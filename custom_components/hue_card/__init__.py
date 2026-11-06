"""Hue Card: a Hue-app style dashboard card backed by the Hue bridge API v2."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .bridge import HueBridgeClient
from .const import CARD_FILENAME, CONF_API_KEY, CONF_HOST, FRONTEND_URL_BASE, VERSION
from .websocket import async_register_websocket

_LOGGER = logging.getLogger(__name__)

type HueCardConfigEntry = ConfigEntry[HueBridgeClient]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the card and register the websocket API once."""
    frontend_dir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL_BASE, str(frontend_dir), False)]
    )
    add_extra_js_url(hass, f"{FRONTEND_URL_BASE}/{CARD_FILENAME}?v={VERSION}")
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HueCardConfigEntry) -> bool:
    """Connect to the bridge."""
    client = HueBridgeClient(hass, entry.data[CONF_HOST], entry.data[CONF_API_KEY])
    try:
        await client.async_start()
    except Exception as err:  # noqa: BLE001
        await client.async_stop()
        raise ConfigEntryNotReady(f"Hue Bridge nicht erreichbar: {err}") from err
    entry.runtime_data = client
    return True


async def async_unload_entry(hass: HomeAssistant, entry: HueCardConfigEntry) -> bool:
    """Disconnect."""
    await entry.runtime_data.async_stop()
    return True

