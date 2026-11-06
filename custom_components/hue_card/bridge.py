"""Local connection to the Hue bridge (CLIP API v2) with the event stream."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import json
import logging
import math
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import RELEVANT_TYPES, WRITABLE_TYPES

_LOGGER = logging.getLogger(__name__)

RECONNECT_DELAY = 10
NOTIFY_DEBOUNCE = 0.15


class HueBridgeClient:
    """Keeps a live copy of the bridge resources and sends commands."""

    def __init__(self, hass: HomeAssistant, host: str, api_key: str) -> None:
        self.hass = hass
        self.host = host
        self.api_key = api_key
        self._session = async_get_clientsession(hass, verify_ssl=False)
        self.resources: dict[str, dict[str, Any]] = {}
        self._listeners: list[Callable[[], None]] = []
        self._stream_task: asyncio.Task | None = None
        self._notify_handle: asyncio.TimerHandle | None = None
        self.connected = False

    # ------------------------------------------------------------------ setup
    @property
    def _headers(self) -> dict[str, str]:
        return {"hue-application-key": self.api_key}

    async def async_start(self) -> None:
        """Load all resources and start listening to the event stream."""
        await self.async_refresh()
        self._stream_task = self.hass.async_create_background_task(
            self._run_eventstream(), "hue_card_eventstream"
        )

    async def async_stop(self) -> None:
        """Stop the event stream."""
        if self._stream_task:
            self._stream_task.cancel()
            try:
                await self._stream_task
            except asyncio.CancelledError:
                pass
            self._stream_task = None
        if self._notify_handle:
            self._notify_handle.cancel()

    async def async_refresh(self) -> None:
        """Fetch all resources from the bridge."""
        url = f"https://{self.host}/clip/v2/resource"
        async with self._session.get(
            url, headers=self._headers, timeout=aiohttp.ClientTimeout(total=20)
        ) as resp:
            resp.raise_for_status()
            payload = await resp.json(content_type=None)
        self.resources = {
            item["id"]: item
            for item in payload.get("data", [])
            if item.get("type") in RELEVANT_TYPES
        }
        self.connected = True
        self._schedule_notify()

    # ----------------------------------------------------------- event stream
    async def _run_eventstream(self) -> None:
        url = f"https://{self.host}/eventstream/clip/v2"
        headers = {**self._headers, "Accept": "text/event-stream"}
        while True:
            try:
                async with self._session.get(
                    url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=None, sock_read=None),
                ) as resp:
                    resp.raise_for_status()
                    self.connected = True
                    buffer = ""
                    async for raw in resp.content:
                        line = raw.decode("utf-8", errors="ignore").rstrip("\r\n")
                        if line.startswith("data:"):
                            buffer += line[5:].strip()
                        elif line == "" and buffer:
                            self._handle_event_payload(buffer)
                            buffer = ""
            except asyncio.CancelledError:
                raise
            except Exception as err:  # noqa: BLE001
                self.connected = False
                _LOGGER.debug("Hue event stream interrupted: %s", err)
            await asyncio.sleep(RECONNECT_DELAY)
            try:
                await self.async_refresh()
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Hue refresh failed: %s", err)

    def _handle_event_payload(self, payload: str) -> None:
        try:
            events = json.loads(payload)
        except ValueError:
            return
        changed = False
        for event in events:
            etype = event.get("type")
            for item in event.get("data", []):
                rid = item.get("id")
                rtype = item.get("type")
                if not rid or rtype not in RELEVANT_TYPES:
                    continue
                if etype == "delete":
                    self.resources.pop(rid, None)
                elif etype == "add" or rid not in self.resources:
                    self.resources[rid] = item
                else:
                    _deep_merge(self.resources[rid], item)
                changed = True
        if changed:
            self._schedule_notify()

    # ------------------------------------------------------------- listeners
    @callback
    def add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        def _remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return _remove

    def _schedule_notify(self) -> None:
        if self._notify_handle:
            return

        def _fire() -> None:
            self._notify_handle = None
            for listener in list(self._listeners):
                listener()

        self._notify_handle = self.hass.loop.call_later(NOTIFY_DEBOUNCE, _fire)

    # --------------------------------------------------------------- command
    async def async_command(self, rtype: str, rid: str, body: dict[str, Any]) -> Any:
        """Send a PUT to a resource."""
        if rtype not in WRITABLE_TYPES:
            raise ValueError(f"Resource type {rtype} is not writable")
        url = f"https://{self.host}/clip/v2/resource/{rtype}/{rid}"
        async with self._session.put(
            url,
            headers=self._headers,
            json=body,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            data = await resp.json(content_type=None)
            if resp.status >= 400:
                errors = data.get("errors") if isinstance(data, dict) else data
                raise ValueError(f"Bridge error {resp.status}: {errors}")
            return data

    # --------------------------------------------------------------- snapshot
    def snapshot(self) -> dict[str, Any]:
        """Return the data the card needs, already prepared."""
        res = self.resources
        by_type: dict[str, list[dict[str, Any]]] = {}
        for item in res.values():
            by_type.setdefault(item["type"], []).append(item)

        # light id -> device (for names/archetypes)
        light_device: dict[str, dict[str, Any]] = {}
        for dev in by_type.get("device", []):
            for svc in dev.get("services", []):
                if svc.get("rtype") == "light":
                    light_device[svc["rid"]] = dev

        lights = {}
        for light in by_type.get("light", []):
            lights[light["id"]] = _light_info(light, light_device.get(light["id"]))

        def lights_of_group(group: dict[str, Any]) -> list[str]:
            ids: list[str] = []
            for child in group.get("children", []):
                if child.get("rtype") == "light":
                    ids.append(child["rid"])
                elif child.get("rtype") == "device":
                    dev = res.get(child["rid"])
                    if dev:
                        ids.extend(
                            s["rid"] for s in dev.get("services", []) if s.get("rtype") == "light"
                        )
            return [i for i in ids if i in lights]

        grouped = {g["id"]: g for g in by_type.get("grouped_light", [])}

        areas = []
        for kind in ("room", "zone"):
            for group in by_type.get(kind, []):
                gl = None
                for svc in group.get("services", []):
                    if svc.get("rtype") == "grouped_light":
                        gl = grouped.get(svc["rid"])
                light_ids = lights_of_group(group)
                areas.append(
                    {
                        "id": group["id"],
                        "type": kind,
                        "name": group.get("metadata", {}).get("name", ""),
                        "archetype": group.get("metadata", {}).get("archetype", ""),
                        "grouped_light": gl["id"] if gl else None,
                        "on": bool(gl and gl.get("on", {}).get("on")),
                        "brightness": round((gl or {}).get("dimming", {}).get("brightness", 0)),
                        "lights": light_ids,
                    }
                )
        areas.sort(key=lambda a: (a["type"] != "room", a["name"].lower()))

        scenes = []
        for scene in by_type.get("scene", []):
            palette = scene.get("palette", {}) or {}
            colors = [
                _xy_to_hex(c["color"]["xy"]["x"], c["color"]["xy"]["y"])
                for c in palette.get("color", [])
                if c.get("color", {}).get("xy")
            ]
            temps = [
                _mirek_to_hex(c["color_temperature"]["mirek"])
                for c in palette.get("color_temperature", [])
                if c.get("color_temperature", {}).get("mirek")
            ]
            if not colors and not temps:
                for action in scene.get("actions", []):
                    act = action.get("action", {})
                    if act.get("color", {}).get("xy"):
                        xy = act["color"]["xy"]
                        colors.append(_xy_to_hex(xy["x"], xy["y"]))
                    elif act.get("color_temperature", {}).get("mirek"):
                        temps.append(_mirek_to_hex(act["color_temperature"]["mirek"]))
            swatch = list(dict.fromkeys(colors + temps))[:5]
            image = (scene.get("metadata", {}).get("image") or {}).get("rid")
            scenes.append(
                {
                    "id": scene["id"],
                    "kind": "scene",
                    "name": scene.get("metadata", {}).get("name", ""),
                    "group": (scene.get("group") or {}).get("rid"),
                    "colors": swatch or ["#FFD9A0"],
                    "image": image,
                    "dynamic": len(colors) > 1,
                    "auto_dynamic": bool(scene.get("auto_dynamic")),
                    "speed": scene.get("speed"),
                    "active": (scene.get("status") or {}).get("active", "inactive"),
                    "mapping": (scene.get("mapping") or {}).get("algorithm"),
                }
            )
        for smart in by_type.get("smart_scene", []):
            image = (smart.get("metadata", {}).get("image") or {}).get("rid")
            scenes.append(
                {
                    "id": smart["id"],
                    "kind": "smart_scene",
                    "name": smart.get("metadata", {}).get("name", ""),
                    "group": (smart.get("group") or {}).get("rid"),
                    "colors": ["#FFE2A8", "#DDEBFF", "#FFF4DA"],
                    "image": image,
                    "dynamic": False,
                    "auto_dynamic": False,
                    "speed": None,
                    "active": "active" if smart.get("state") == "active" else "inactive",
                    "mapping": None,
                }
            )
        scenes.sort(key=lambda s: s["name"].lower())

        return {
            "connected": self.connected,
            "areas": areas,
            "scenes": scenes,
            "lights": lights,
        }


# ------------------------------------------------------------------- helpers
def _deep_merge(target: dict[str, Any], update: dict[str, Any]) -> None:
    for key, value in update.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            _deep_merge(target[key], value)
        else:
            target[key] = value


def _light_info(light: dict[str, Any], device: dict[str, Any] | None) -> dict[str, Any]:
    on = bool(light.get("on", {}).get("on"))
    brightness = light.get("dimming", {}).get("brightness")
    color = "#FFD9A0"
    mode = "white"
    xy = light.get("color", {}).get("xy")
    mirek = light.get("color_temperature", {}).get("mirek")
    if light.get("color_temperature", {}).get("mirek_valid") and mirek:
        color = _mirek_to_hex(mirek)
        mode = "temperature"
    elif xy:
        color = _xy_to_hex(xy["x"], xy["y"])
        mode = "color"
    effect = (light.get("effects_v2") or {}).get("status", {}).get("effect") or (
        light.get("effects") or {}
    ).get("status")
    if effect in ("no_effect", None):
        effect = None
    meta = (device or {}).get("metadata", {})
    return {
        "id": light["id"],
        "name": meta.get("name") or light.get("metadata", {}).get("name", ""),
        "archetype": meta.get("archetype") or light.get("metadata", {}).get("archetype", ""),
        "on": on,
        "brightness": round(brightness) if brightness is not None else None,
        "color": color,
        "mode": mode,
        "effect": effect,
        "has_color": "color" in light,
        "has_temperature": "color_temperature" in light,
        "effects": ((light.get("effects_v2") or {}).get("action") or {}).get("effect_values")
        or (light.get("effects") or {}).get("effect_values")
        or [],
        "dynamics": (light.get("dynamics") or {}).get("status"),
    }


def _xy_to_hex(x: float, y: float) -> str:
    if y <= 0:
        return "#FFFFFF"
    z = 1.0 - x - y
    big_y = 1.0
    big_x = (big_y / y) * x
    big_z = (big_y / y) * z
    r = big_x * 1.656492 - big_y * 0.354851 - big_z * 0.255038
    g = -big_x * 0.707196 + big_y * 1.655397 + big_z * 0.036152
    b = big_x * 0.051713 - big_y * 0.121364 + big_z * 1.011530
    r, g, b = (max(0.0, v) for v in (r, g, b))
    peak = max(r, g, b) or 1.0
    out = []
    for v in (r / peak, g / peak, b / peak):
        v = 12.92 * v if v <= 0.0031308 else 1.055 * math.pow(v, 1 / 2.4) - 0.055
        out.append(max(0, min(255, round(v * 255))))
    return "#{:02X}{:02X}{:02X}".format(*out)


def _mirek_to_hex(mirek: int) -> str:
    kelvin = 1_000_000 / max(mirek, 1) / 100
    if kelvin <= 66:
        r = 255
        g = 99.4708025861 * math.log(kelvin) - 161.1195681661
        b = 0 if kelvin <= 19 else 138.5177312231 * math.log(kelvin - 10) - 305.0447927307
    else:
        r = 329.698727446 * math.pow(kelvin - 60, -0.1332047592)
        g = 288.1221695283 * math.pow(kelvin - 60, -0.0755148492)
        b = 255
    return "#{:02X}{:02X}{:02X}".format(
        *(max(0, min(255, round(v))) for v in (r, g, b))
    )
