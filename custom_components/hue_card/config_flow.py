"""Config flow: reuse the credentials of the official Hue integration or pair manually."""

from __future__ import annotations

from typing import Any

import aiohttp
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import CONF_API_KEY, CONF_HOST, DOMAIN

MANUAL = "__manual__"


class HueCardConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up Hue Card."""

    VERSION = 1

    def __init__(self) -> None:
        self._host: str | None = None

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        hue_entries = [
            e for e in self.hass.config_entries.async_entries("hue")
            if e.data.get("host") and e.data.get("api_key") and e.data.get("api_version", 2) == 2
        ]
        if user_input is not None:
            choice = user_input["bridge"]
            if choice == MANUAL:
                return await self.async_step_manual()
            entry = next(e for e in hue_entries if e.entry_id == choice)
            return await self._create(entry.data["host"], entry.data["api_key"], entry.title)

        if not hue_entries:
            return await self.async_step_manual()

        options = {e.entry_id: f"{e.title} ({e.data['host']})" for e in hue_entries}
        options[MANUAL] = "Andere Bridge manuell koppeln"
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required("bridge", default=hue_entries[0].entry_id): vol.In(options)}),
        )

    async def async_step_manual(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            self._host = user_input[CONF_HOST].strip()
            return await self.async_step_link()
        return self.async_show_form(
            step_id="manual", data_schema=vol.Schema({vol.Required(CONF_HOST): str})
        )

    async def async_step_link(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            session = async_get_clientsession(self.hass, verify_ssl=False)
            try:
                async with session.post(
                    f"https://{self._host}/api",
                    json={"devicetype": "hue_card#homeassistant", "generateclientkey": True},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    data = await resp.json(content_type=None)
            except (aiohttp.ClientError, TimeoutError):
                errors["base"] = "cannot_connect"
            else:
                item = data[0] if isinstance(data, list) and data else {}
                if "success" in item:
                    return await self._create(self._host, item["success"]["username"], "Hue Bridge")
                errors["base"] = "link_button"
        return self.async_show_form(step_id="link", errors=errors)

    async def _create(self, host: str, api_key: str, title: str) -> ConfigFlowResult:
        await self.async_set_unique_id(host)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=f"Hue Card – {title}", data={CONF_HOST: host, CONF_API_KEY: api_key})
