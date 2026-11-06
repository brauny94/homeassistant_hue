"""Websocket API used by the card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, WRITABLE_TYPES


def _client(hass: HomeAssistant):
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    return None


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get_home)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_command)
    websocket_api.async_register_command(hass, ws_scene_update)


@websocket_api.websocket_command({vol.Required("type"): "hue_card/get_home"})
@callback
def ws_get_home(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    client = _client(hass)
    if client is None:
        connection.send_error(msg["id"], "not_set_up", "Hue Card ist nicht eingerichtet")
        return
    connection.send_result(msg["id"], client.snapshot())


@websocket_api.websocket_command({vol.Required("type"): "hue_card/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    client = _client(hass)
    if client is None:
        connection.send_error(msg["id"], "not_set_up", "Hue Card ist nicht eingerichtet")
        return

    @callback
    def _forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], client.snapshot()))

    connection.subscriptions[msg["id"]] = client.add_listener(_forward)
    connection.send_result(msg["id"])
    _forward()


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hue_card/command",
        vol.Required("rtype"): vol.In(WRITABLE_TYPES),
        vol.Required("rid"): str,
        vol.Required("body"): dict,
    }
)
@websocket_api.async_response
async def ws_command(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    client = _client(hass)
    if client is None:
        connection.send_error(msg["id"], "not_set_up", "Hue Card ist nicht eingerichtet")
        return
    try:
        result = await client.async_command(msg["rtype"], msg["rid"], msg["body"])
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "bridge_error", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hue_card/scene_update",
        vol.Required("scene_id"): str,
        vol.Optional("brightness"): vol.Coerce(float),
        vol.Optional("speed"): vol.Coerce(float),
        vol.Optional("auto_dynamic"): bool,
        vol.Optional("mapping"): str,
        vol.Optional("lights"): [str],
    }
)
@websocket_api.async_response
async def ws_scene_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    client = _client(hass)
    if client is None:
        connection.send_error(msg["id"], "not_set_up", "Hue Card ist nicht eingerichtet")
        return
    changes = {k: msg[k] for k in ("brightness", "speed", "auto_dynamic", "mapping", "lights") if k in msg}
    try:
        result = await client.async_scene_update(msg["scene_id"], changes)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "bridge_error", str(err))
        return
    connection.send_result(msg["id"], result)
