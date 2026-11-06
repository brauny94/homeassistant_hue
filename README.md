# Hue Card für Home Assistant

> [!WARNING]
> **Hinweis:** Der Code in diesem Repository wurde mit KI (Claude von Anthropic) erstellt und ist ein privates Projekt für den Eigengebrauch. Er wird nicht regelmäßig gewartet, es gibt keinen Support und keine Garantie, dass er mit künftigen Versionen von Home Assistant oder der Hue Bridge funktioniert. Nutzung auf eigenes Risiko.
>
> **Disclaimer:** The code in this repository was generated with AI (Claude by Anthropic) for personal use. It is not regularly maintained, comes without support or warranty, and may break with future Home Assistant or Hue Bridge versions. Use at your own risk.

Eine Dashboard-Card, die Räume, Szenen und Lampen so steuert wie die Philips-Hue-App. Dahinter steckt eine kleine Integration, die direkt mit der Hue Bridge (API v2) spricht und Änderungen live über den Eventstream bekommt.

**Stand: Stufe 1**
- Bereichs-Übersicht mit allen Räumen und Zonen (Schalter, Helligkeit)
- Raum-Ansicht mit allen gespeicherten Szenen (zwei Reihen, seitlich wischbar, dynamische Szenen markiert) und allen Lampen (Farbe, Schalter)
- Szenen starten (dynamische Szenen mit „automatischer Wiedergabe“ starten dynamisch), Raum und Lampen schalten, Raumhelligkeit

Geplant: Szene bearbeiten (Spatial Mapping, Helligkeit, Geschwindigkeit, Lampen), Lampe bearbeiten (Farbe, Weißlicht, Effekte), Szenenbilder.

## Installation

1. Im Home-Assistant-Marktplatz dieses Repository als eigene Quelle vom Typ **Integration** hinzufügen und „Hue Card“ installieren.
2. Home Assistant neu starten.
3. *Einstellungen → Geräte & Dienste → Integration hinzufügen → Hue Card*. Ist die offizielle Hue-Integration eingerichtet, werden deren Zugangsdaten übernommen; sonst wird die Bridge per Link-Knopf gekoppelt.
4. Im Dashboard eine Karte vom Typ **Hue Card** hinzufügen (die Card wird von der Integration automatisch geladen).

## Card-Konfiguration

```yaml
type: custom:hue-card
area: Wohnzimmer        # optional: startet direkt in diesem Raum (Name oder ID)
height: 760             # optional: feste Höhe in px
image_path: /local/hue_scenes   # optional: Szenenbilder als <bild-kennung>.jpg
```

Ohne `area` startet die Card in der Bereichs-Übersicht.
