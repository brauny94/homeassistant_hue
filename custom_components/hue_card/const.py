"""Constants for the Hue Card integration."""

DOMAIN = "hue_card"
VERSION = "0.1.1"  # keep in sync with manifest.json

CONF_HOST = "host"
CONF_API_KEY = "api_key"

FRONTEND_URL_BASE = "/hue_card_static"
CARD_FILENAME = "hue-card.js"

# Resource types the card may change via the generic command.
WRITABLE_TYPES = ("light", "grouped_light", "scene", "smart_scene")

# Resource types the card needs to know about.
RELEVANT_TYPES = (
    "room",
    "zone",
    "device",
    "light",
    "grouped_light",
    "scene",
    "smart_scene",
    "bridge_home",
)
