"""Diagnostics: raw scene data to understand bridge features."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    client = entry.runtime_data
    res = client.resources
    scenes = []
    for item in res.values():
        if item.get("type") == "scene":
            scenes.append({
                "id": item["id"],
                "name": item.get("metadata", {}).get("name"),
                "group": (item.get("group") or {}).get("rid"),
                "mapping": item.get("mapping"),
                "status": item.get("status"),
                "speed": item.get("speed"),
                "auto_dynamic": item.get("auto_dynamic"),
                "palette_sizes": {k: len(v or []) for k, v in (item.get("palette") or {}).items()},
                "extra_keys": sorted(k for k in item if k not in ("id", "id_v1", "type", "metadata", "group", "actions", "palette", "speed", "auto_dynamic", "status", "mapping", "recall", "owner")),
            })
    smart = [item for item in res.values() if item.get("type") == "smart_scene"]
    return {"connected": client.connected, "scenes": scenes, "smart_scenes": smart}
