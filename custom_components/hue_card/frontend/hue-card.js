/* Hue Card – Hue-App-artige Steuerung für Home Assistant */
(() => {
  const VERSION = "0.2.1";

  const ICONS = {
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z",
    table: "M8 3h8l2 7H6zM12 10v8M8 20h8",
    floor: "M9 2h6l2 5H7zM12 7v13M9 21h6",
    pendant: "M12 2v6M5 15a7 7 0 0 1 14 0zM10 18a2 2 0 0 0 4 0",
    strip: "M3 9c3 4 6 4 9 0s6-4 9 0M3 15c3 4 6 4 9 0s6-4 9 0",
    iris: "M4 15a8 8 0 0 1 16 0zM8 19h8",
    spot: "M8 4h8l-1 8H9zM12 12v8M9 20h6",
    outdoor: "M6 21V9l6-5 6 5v12M10 21v-5h4v5",
  };
  const AREA_ICONS = {
    sofa: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2",
    pot: "M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h2M20 10h2M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2",
    bed: "M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3",
    desk: "M3 9h18M5 9v10M19 9v10M14 9v5h5M9 5h6v4",
    toy: "M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 20a6 6 0 0 1 12 0z",
    bath: "M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0",
    door: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12h.01",
    stairs: "M3 20h5v-5h5v-5h5V5h3",
    tree: "M12 3l6 9h-4l4 6H6l4-6H6zM12 18v3",
    tv: "M3 6h18v11H3zM8 21h8",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  };

  const lightIcon = (arch = "") => {
    const a = arch.toLowerCase();
    if (a.includes("iris")) return ICONS.iris;
    if (a.includes("table")) return ICONS.table;
    if (a.includes("floor")) return ICONS.floor;
    if (a.includes("pendant") || a.includes("ceiling")) return ICONS.pendant;
    if (a.includes("strip") || a.includes("play") || a.includes("gradient") || a.includes("string")) return ICONS.strip;
    if (a.includes("spot") || a.includes("recessed")) return ICONS.spot;
    if (a.includes("wall") || a.includes("lantern") || a.includes("garden") || a.includes("pedestal")) return ICONS.outdoor;
    return ICONS.bulb;
  };
  const areaIcon = (arch = "", type) => {
    if (type === "zone") return AREA_ICONS.layers;
    const a = arch.toLowerCase();
    if (a.includes("living") || a.includes("lounge")) return AREA_ICONS.sofa;
    if (a.includes("kitchen") || a.includes("dining")) return AREA_ICONS.pot;
    if (a.includes("kids")) return AREA_ICONS.toy;
    if (a.includes("bedroom") || a.includes("guest")) return AREA_ICONS.bed;
    if (a.includes("office") || a.includes("study")) return AREA_ICONS.desk;
    if (a.includes("bath") || a.includes("toilet")) return AREA_ICONS.bath;
    if (a.includes("stair")) return AREA_ICONS.stairs;
    if (a.includes("hall") || a.includes("front_door")) return AREA_ICONS.door;
    if (a.includes("terrace") || a.includes("garden") || a.includes("balcony") || a.includes("porch")) return AREA_ICONS.tree;
    if (a.includes("tv") || a.includes("recreation")) return AREA_ICONS.tv;
    return AREA_ICONS.layers;
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, t) => {
    const x = hexToRgb(a), y = hexToRgb(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  const lum = (h) => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const circleBg = (c) => {
    const a = c[0], b = c[1] || mix(c[0], "#000000", 0.25), d = c[2] || mix(c[0], "#FFFFFF", 0.35);
    return `radial-gradient(circle at 30% 28%, ${d} 0%, transparent 55%), linear-gradient(150deg, ${a}, ${b})`;
  };
  const cardBg = (c) => `linear-gradient(180deg, ${c} 0%, ${mix(c, "#2A2618", 0.45)} 100%)`;
  const hslHex = (h, sat, l) => {
    sat /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = sat * Math.min(l, 1 - l);
    const f = (n) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255).toString(16).padStart(2, "0");
    return "#" + f(0) + f(8) + f(4);
  };
  const hexToHsl = (h) => {
    const [r, g, b] = hexToRgb(h).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let hh = 0;
    if (d) { hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
    const l = (mx + mn) / 2;
    return [hh, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
  };
  const hexToXy = (h) => {
    const lin = (v) => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
    const [r, g, b] = hexToRgb(h).map(lin);
    const X = r * 0.4124 + g * 0.3576 + b * 0.1805, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    const sum = X + Y + Z;
    return sum ? { x: +(X / sum).toFixed(4), y: +(Y / sum).toFixed(4) } : { x: 0.3227, y: 0.329 };
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fxCircle = (c) => `radial-gradient(circle at 35% 30%, ${mix(c, "#FFFFFF", 0.5)} 0%, transparent 55%), radial-gradient(circle at 70% 75%, ${c} 0%, transparent 60%), linear-gradient(150deg, ${mix(c, "#000000", 0.55)}, #0E0F13)`;

  // Effekte wie in der Hue-App: Familie → Varianten (Farbe = Effektparameter, null = Standard)
  const FX = [
    { title: "Flammen", fam: [
      { id: "candle", n: "Kerze", v: [["Standard", null, "#FFB24D"], ["Orange", "#FF8C2A"], ["Warmweiß", "#FFE0A8"]] },
      { id: "fire", n: "Kaminfeuer", v: [["Standard", null, "#FF6A1A"], ["Violett", "#A35BFF"], ["Grün", "#2ED3A0"]] } ] },
    { title: "Funkelnd", fam: [
      { id: "sparkle", n: "Funkeln", v: [["Gold", null, "#F2C760"], ["Violett", "#B07BFF"], ["Rosa", "#FF8DB8"]] },
      { id: "glisten", n: "Glitzern", v: [["Standard", null, "#FFF0C0"]] },
      { id: "opal", n: "Opal", v: [["Standard", null, "#C7E9F5"]] } ] },
    { title: "Kosmos", fam: [
      { id: "cosmos", n: "Kosmos", v: [["Violett", null, "#8E44E8"], ["Gold", "#E0B85A"], ["Blau", "#3D5AFE"], ["Rosa", "#E86A9A"]] } ] },
    { title: "Tropfen", fam: [
      { id: "sunbeam", n: "Sonnen\u00ADstrahl", v: [["Standard", null, "#FFE08A"], ["Orange", "#FF9A6A"], ["Violett", "#9A8AFF"]] },
      { id: "enchant", n: "Zauberwelt", v: [["Standard", null, "#F4B8D8"]] } ] },
    { title: "Schleifen", fam: [
      { id: "prism", n: "Prisma", v: [["Hell", null, "#FFD25A"], ["Pastell", "#B8C8A8"]] },
      { id: "underwater", n: "Unterwasser", v: [["Standard", null, "#2EC4E6"]] } ] },
  ];
  const SVG = {
    pen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>`,
    folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    sun: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    fx: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2.5l1.8 5.2L17 9.5l-5.2 1.8L10 16.5l-1.8-5.2L3 9.5l5.2-1.8zM18 13l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9zM18 2l.6 1.6 1.6.6-1.6.6L18 6.4l-.6-1.6-1.6-.6 1.6-.6z"/></svg>`,
    wave: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`,
  };

  const STYLE = `
    :host { display: block; }
    * { box-sizing: border-box; }
    .card { position: relative; border-radius: var(--ha-card-border-radius, 24px); background: #16171B; color: #F3F4F6;
      font-family: Inter, var(--ha-font-family-body, system-ui), sans-serif; overflow: hidden; display: flex; flex-direction: column; }
    .card.fixed { height: var(--hc-height); }
    .scroll { flex: 1 1 auto; overflow-y: auto; }
    button { font: inherit; color: inherit; cursor: pointer; }
    button:focus-visible { outline: 2px solid #4C8DFF; outline-offset: 2px; }
    .hs { display: flex; gap: 10px; overflow-x: auto; padding: 2px 16px 6px; scroll-snap-type: x mandatory; scroll-padding-left: 16px; scrollbar-width: none; }
    .hs::-webkit-scrollbar { display: none; }
    h2.sec { margin: 0 16px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #A1A6B3; }
    .switch { width: 52px; height: 30px; border-radius: 15px; border: 0; padding: 3px; display: flex; flex: none; }
    .switch > span { width: 24px; height: 24px; border-radius: 12px; background: #FFF; display: block; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
    .switch.on { background: #2F6FEB; justify-content: flex-end; } .switch.off { background: #4A4D57; justify-content: flex-start; }
    input[type=range] { width: 100%; margin: 0; accent-color: #FFFFFF; }
    .head { flex: none; padding: 18px 16px 16px; border-radius: 0 0 24px 24px; display: flex; flex-direction: column; gap: 14px; }
    .head-row { display: flex; align-items: center; gap: 10px; }
    .round { width: 40px; height: 40px; border-radius: 20px; border: 0; display: flex; align-items: center; justify-content: center; flex: none; }
    .title { margin: 0; flex: 1 1 auto; font-size: 18px; font-weight: 600; }
    .scenes { display: grid; grid-auto-flow: column; grid-template-rows: repeat(2, 126px); grid-auto-columns: 104px; }
    .scene { position: relative; scroll-snap-align: start; }
    .scene > button:not(.edbtn) { width: 104px; height: 126px; border-radius: 16px; border: 0; padding: 12px 6px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .circle { position: relative; width: 50px; height: 50px; border-radius: 25px; flex: none; box-shadow: 0 2px 8px rgba(0,0,0,.35); overflow: hidden; }
    .circle img { width: 50px; height: 50px; object-fit: cover; display: block; }
    .overlay { position: absolute; left: 10px; top: 10px; width: 30px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; }
    .sname { font-size: 11.5px; font-weight: 600; line-height: 1.25; text-align: center; hyphens: auto; -webkit-hyphens: auto; overflow-wrap: break-word; }
    .badge { position: absolute; left: 6px; top: 6px; width: 24px; height: 24px; border-radius: 12px; background: rgba(22,23,27,.75); display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .lamp { flex: none; width: 92px; height: 128px; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; scroll-snap-align: start; }
    .lamp .top { flex: 1 1 auto; border: 0; background: transparent; padding: 10px 4px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .lamp .name { height: 32px; display: flex; align-items: center; font-size: 12px; font-weight: 600; line-height: 1.2; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.45); }
    .lamp .bottom { flex: none; height: 44px; display: flex; align-items: center; justify-content: center; border-top: 1px solid rgba(0,0,0,.12); }
    .lamp .sw { width: 48px; height: 28px; border-radius: 14px; border: 0; padding: 3px; background: rgba(0,0,0,.28); display: flex; }
    .lamp .sw > span { width: 22px; height: 22px; border-radius: 11px; display: block; box-shadow: 0 1px 3px rgba(0,0,0,.35); }
    .areas { padding: 8px 16px 20px; display: flex; flex-direction: column; gap: 20px; }
    .agrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; }
    .area { border-radius: 18px; padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
    .area .open { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 12px; min-height: 44px; border: 0; background: transparent; text-align: left; padding: 0; }
    .aicon { width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex: none; }
    .msg { padding: 24px 16px; color: #A1A6B3; font-size: 14px; }
    .edbtn { position: absolute; right: 4px; top: 4px; width: 30px; height: 30px; border-radius: 15px; border: 0; padding: 0; background: rgba(22,23,27,.8); color: #fff; display: flex; align-items: center; justify-content: center; }
    .sheet { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 2; }
    .bar { flex: none; display: flex; align-items: center; gap: 10px; padding: 16px 16px 10px; }
    .done { height: 40px; padding: 0 16px; border-radius: 20px; border: 0; background: rgba(255,255,255,.14); font-size: 13px; font-weight: 700; letter-spacing: .04em; }
    .box { margin: 0 16px; background: #26272D; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .lbl { font-size: 15px; font-weight: 600; } .val { font-size: 14px; color: #D4D7DE; } .hint { font-size: 13px; line-height: 1.45; color: #A1A6B3; }
    .seg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 12px; background: #16171B; }
    .seg button { height: 38px; border-radius: 9px; border: 0; font-size: 14px; font-weight: 600; }
    .chip { height: 26px; padding: 0 10px; border-radius: 13px; background: rgba(255,255,255,.12); display: flex; align-items: center; font-size: 12px; font-weight: 600; }
    .frow { display: flex; align-items: center; gap: 12px; padding: 8px 0; border: 0; background: transparent; width: 100%; text-align: left; }
    .vbri { -webkit-appearance: none; appearance: none; writing-mode: vertical-lr; direction: rtl; opacity: 0; cursor: ns-resize; position: absolute; inset: 0; width: 96px; height: 60px; margin: 0; }
    .modes { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 30px; background: #2A2B31; }
    .modes button { width: 44px; height: 44px; border-radius: 22px; border: 0; padding: 5px; background: transparent; display: flex; align-items: center; justify-content: center; }
    .modes button > span { display: block; width: 34px; height: 34px; border-radius: 17px; }
    .wheel { position: relative; border-radius: 50%; border: 0; padding: 0; box-shadow: 0 10px 40px rgba(0,0,0,.5); cursor: crosshair; flex: none; touch-action: none; }
    .dot { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 11px; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); pointer-events: none; }
    .pin { position: absolute; width: 64px; height: 76px; margin: -74px 0 0 -32px; pointer-events: none; }
    .fxt { height: 112px; border-radius: 14px; border: 0; padding: 10px 4px 8px; display: flex; flex-direction: column; align-items: center; gap: 5px; }
  `;

  class HueCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._data = null;
      this._view = null;
      this._areaId = null;
      this._busy = false;
      this._scroll = {};
      this._pending = {};
      this._edit = null;
      this._lampId = null;
      this._mode = {};
      this._fxVar = {};
      this._pos = {};
    }

    setConfig(config) {
      this._config = config || {};
      this._render();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (first) this._subscribe();
    }

    connectedCallback() { if (this._hass && !this._unsub) this._subscribe(); }
    disconnectedCallback() { if (this._unsub) { this._unsub.then((u) => u && u()).catch(() => {}); this._unsub = null; } }

    getCardSize() { return 8; }
    getGridOptions() { return { columns: 6, rows: 8, min_columns: 4, min_rows: 6 }; }
    static getStubConfig() { return { area: "" }; }

    _subscribe() {
      if (!this._hass || this._unsub) return;
      this._unsub = this._hass.connection
        .subscribeMessage((data) => { this._data = data; if (!this._busy) this._render(); }, { type: "hue_card/subscribe" })
        .catch((err) => { this._error = err && err.message ? err.message : String(err); this._render(); });
    }

    _cmd(rtype, rid, body) {
      return this._hass.callWS({ type: "hue_card/command", rtype, rid, body }).catch((err) => {
        console.warn("hue-card", err);
      });
    }

    _currentArea() {
      const areas = (this._data && this._data.areas) || [];
      if (this._areaId) return areas.find((a) => a.id === this._areaId) || null;
      const want = (this._config.area || "").toLowerCase();
      if (want) {
        const a = areas.find((x) => x.id === this._config.area || x.name.toLowerCase() === want);
        if (a) { this._areaId = a.id; return a; }
      }
      return null;
    }

    // ------------------------------------------------------------------ render
    _render() {
      if (!this.shadowRoot) return;
      this.shadowRoot.querySelectorAll("[data-scroll]").forEach((el) => { this._scroll[el.dataset.scroll] = el.scrollLeft || el.scrollTop; });
      let body;
      if (this._error) body = `<div class="msg">Hue Card: ${esc(this._error)}</div>`;
      else if (!this._data) body = `<div class="msg">Verbinde mit der Hue Bridge …</div>`;
      else {
        const area = this._view === "areas" ? null : this._currentArea();
        if (area && this._view === "lamp" && this._data.lights[this._lampId]) body = this._lampView(area);
        else if (area) body = this._roomView(area) + (this._edit ? this._sceneSheet(area) : "");
        else body = this._areasView();
      }
      const editing = this._view === "lamp" || !!this._edit;
      const h = (this._config && this._config.height) || (editing ? 760 : null);
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="card${h ? " fixed" : ""}" lang="de" style="${h ? `--hc-height:${Number(h)}px` : ""}">${body}</div>`;
      this.shadowRoot.querySelectorAll("[data-scroll]").forEach((el) => {
        const v = this._scroll[el.dataset.scroll];
        if (v) { if (el.classList.contains("hs")) el.scrollLeft = v; else el.scrollTop = v; }
      });
      this._bind();
    }

    _areasView() {
      const areas = this._data.areas || [];
      const lights = this._data.lights || {};
      const onCount = areas.filter((a) => a.on).length;
      const group = (type, title) => {
        const list = areas.filter((a) => a.type === type);
        if (!list.length) return "";
        return `<section style="display:flex;flex-direction:column;gap:10px">
          <h2 class="sec" style="margin:0">${title}</h2>
          <div class="agrid">${list.map((a) => {
            const cols = a.lights.map((id) => lights[id]).filter((l) => l && l.on).map((l) => l.color);
            const active = this._activeScene(a);
            const c1 = cols[0] || "#26272D", c2 = cols[1] || (cols[0] ? mix(cols[0], "#000000", 0.3) : "#26272D");
            const bg = a.on ? `linear-gradient(120deg, ${c1}, ${c2})` : "#26272D";
            const light = a.on && lum(c1) > 0.62;
            const fg = light ? "#16171B" : "#F3F4F6";
            const sub = a.on ? `${active ? esc(active.name) + " · " : ""}${a.brightness} %` : `${a.lights.length} ${a.lights.length === 1 ? "Lampe" : "Lampen"} · aus`;
            return `<div class="area" style="background:${bg};color:${fg}">
              <div style="display:flex;align-items:center;gap:12px">
                <button class="open" data-action="open-area" data-id="${a.id}" aria-label="${esc(a.name)} öffnen" style="color:${fg}">
                  <span class="aicon" style="background:${light ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.12)"}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${areaIcon(a.archetype, a.type)}"/></svg></span>
                  <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
                    <span style="font-size:16px;font-weight:600">${esc(a.name)}</span>
                    <span style="font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</span></span>
                </button>
                ${a.grouped_light ? `<button class="switch ${a.on ? "on" : "off"}" data-action="area-toggle" data-id="${a.id}" aria-pressed="${a.on}" aria-label="${esc(a.name)} schalten"><span></span></button>` : ""}
              </div>
              ${a.on && a.grouped_light ? `<input type="range" min="1" max="100" value="${a.brightness}" data-action="area-bri" data-id="${a.id}" aria-label="Helligkeit ${esc(a.name)}" style="accent-color:${light ? "#16171B" : "#FFFFFF"}">` : ""}
            </div>`;
          }).join("")}</div></section>`;
      };
      return `<div class="scroll" data-scroll="areas"><div style="padding:22px 16px 10px">
          <div style="font-size:13px;color:#A1A6B3">${onCount ? `${onCount} ${onCount === 1 ? "Bereich" : "Bereiche"} an` : "Alles aus"}</div>
          <h1 style="margin:4px 0 0;font-size:28px;font-weight:700;letter-spacing:-.02em">Bereiche</h1></div>
        <div class="areas">${group("room", "Räume")}${group("zone", "Zonen")}</div></div>`;
    }

    _activeSceneId(area) {
      const p = this._pending && this._pending[area.id];
      if (p && Date.now() - p.t < 4000) return p.id;
      return area.active_scene || null;
    }

    _activeScene(area) {
      const id = this._activeSceneId(area);
      return id ? (this._data.scenes || []).find((s) => s.id === id) || null : null;
    }

    _sceneTile(s, sel, area) {
      const img = this._imageUrl(s);
      const smart = s.kind === "smart_scene";
      const showEdit = smart || sel;
      return `<div class="scene">
          <button data-action="scene" data-id="${s.id}" aria-pressed="${sel}" style="background:${sel ? `linear-gradient(160deg, ${s.colors[0]}CC, ${(s.colors[1] || s.colors[0])}99)` : "#26272D"}">
            <span class="circle" style="background:${circleBg(s.colors)}">
              ${img ? `<img src="${img}" alt="" onerror="this.remove()">` : ""}
              ${smart && !sel ? `<span class="overlay" style="left:11px;top:11px;width:28px;height:28px;background:rgba(255,255,255,.85);color:#16171B">${SVG.clock}</span>` : ""}
              ${sel ? `<span class="overlay" style="background:rgba(22,23,27,.7)"><span style="width:10px;height:10px;border-radius:2px;background:#fff"></span></span>` : ""}
            </span>
            <span class="sname">${esc(s.name)}</span>
          </button>
          ${s.dynamic && !smart ? `<span class="badge" title="Dynamisch">${SVG.wave}</span>` : ""}
          ${showEdit ? `<button class="edbtn" data-action="scene-edit" data-id="${s.id}" aria-label="${esc(s.name)} ${smart ? "öffnen" : "bearbeiten"}">${smart ? SVG.folder : SVG.pen}</button>` : ""}
        </div>`;
    }

    _lampCard(l, opts = {}) {
      const c = l.on ? l.color : "#6B6658";
      const ring = opts.selected ? "box-shadow:0 0 0 3px #16171B, 0 0 0 5px #F5C26B;" : "";
      const on = opts.inScene !== undefined ? opts.inScene : l.on;
      return `<div class="lamp" style="background:${cardBg(c)};${ring}">
          <button class="top" data-action="${opts.pick || "lamp-edit"}" data-id="${l.id}" aria-label="${esc(l.name)} bearbeiten" ${opts.noPick ? "disabled" : ""}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${l.on ? "#fff" : "rgba(255,255,255,.6)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${lightIcon(l.archetype)}"/></svg>
            <span class="name" style="color:${l.on ? "#fff" : "rgba(255,255,255,.7)"}">${esc(l.name)}</span>
          </button>
          <div class="bottom"><button class="sw" data-action="${opts.toggle || "lamp-toggle"}" data-id="${l.id}" aria-pressed="${on}" aria-label="${esc(l.name)} ${opts.inScene !== undefined ? "in Szene" : "schalten"}" style="justify-content:${on ? "flex-end" : "flex-start"}"><span style="background:${on ? "#fff" : "#9A9AA2"}"></span></button></div>
        </div>`;
    }

    _roomView(area) {
      const lights = this._data.lights || {};
      const scenes = (this._data.scenes || []).filter((s) => s.group === area.id && !s.parent);
      const active = this._activeScene(area);
      const activeId = active ? active.id : null;
      const onCols = area.lights.map((id) => lights[id]).filter((l) => l && l.on).map((l) => l.color);
      const pal = active ? active.colors : onCols;
      const c1 = area.on && pal[0] ? pal[0] : null;
      const c2 = area.on && (pal[1] || pal[0]) ? (pal[1] || mix(pal[0], "#000000", 0.25)) : null;
      const headBg = c1 ? `linear-gradient(170deg, ${c1}, ${c2})` : "#26272D";
      const light = c1 && lum(c1) > 0.62;
      const fg = light ? "#16171B" : "#FFFFFF";
      const chip = light ? "rgba(255,255,255,.55)" : "rgba(22,23,27,.45)";

      const sceneTiles = scenes.map((s) => {
        const childActive = s.kind === "smart_scene" && active && active.parent === s.id;
        return this._sceneTile(s, area.on && (s.id === activeId || childActive), area);
      }).join("");
      const lampCards = area.lights.map((id) => lights[id]).filter(Boolean).map((l) => this._lampCard(l)).join("");

      return `<div class="head" style="background:${headBg};color:${fg}">
          <div class="head-row">
            <button class="round" data-action="back" aria-label="Zurück zu den Bereichen" style="background:${chip};color:${fg}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
            <h1 class="title">${esc(area.name)}</h1>
            ${area.grouped_light ? `<button class="switch ${area.on ? "on" : "off"}" data-action="area-toggle" data-id="${area.id}" aria-pressed="${area.on}" aria-label="${esc(area.name)} schalten"><span></span></button>` : ""}
          </div>
          ${area.grouped_light ? `<input type="range" min="1" max="100" value="${area.brightness || 1}" data-action="area-bri" data-id="${area.id}" aria-label="Helligkeit ${esc(area.name)}" style="accent-color:${light ? "#16171B" : "#FFFFFF"}">` : ""}
        </div>
        <div class="scroll" data-scroll="room-${area.id}" style="padding:18px 0 20px;display:flex;flex-direction:column;gap:22px">
          <section style="display:flex;flex-direction:column;gap:10px">
            <h2 class="sec">Szenen</h2>
            ${scenes.length ? `<div class="hs scenes" data-scroll="scenes-${area.id}">${sceneTiles}</div>` : `<div class="msg" style="padding:0 16px">Für diesen Bereich sind keine Szenen gespeichert.</div>`}
          </section>
          <section style="display:flex;flex-direction:column;gap:10px">
            <h2 class="sec">Lampen</h2>
            <div class="hs" data-scroll="lamps-${area.id}">${lampCards}</div>
          </section>
        </div>`;
    }

    // ------------------------------------------------------------ scene sheet
    _sceneSheet(area) {
      const scenes = this._data.scenes || [];
      const s = scenes.find((x) => x.id === this._edit);
      if (!s) { this._edit = null; return ""; }
      const lights = this._data.lights || {};
      const img = this._imageUrl(s);
      const smart = s.kind === "smart_scene";
      const c0 = s.colors[0] || "#26272D";
      const badges = [];
      if (smart) badges.push("Tagesverlauf");
      else if (s.dynamic) badges.push("Dynamisch");
      if (s.mapping === "spatial") badges.push("Spatial Mapping");
      let content = "";
      if (smart) {
        const active = this._activeScene(area);
        const rows = (s.children || []).map((c) => {
          const cs = scenes.find((x) => x.id === c.id);
          if (!cs) return "";
          const on = area.on && active && active.id === cs.id;
          return `<div class="row" style="padding:4px 0">
              <button class="frow" data-action="scene" data-id="${cs.id}" aria-pressed="${on}">
                <span class="circle" style="width:44px;height:44px;background:${circleBg(cs.colors)}">${this._imageUrl(cs) ? `<img src="${this._imageUrl(cs)}" alt="" style="width:44px;height:44px" onerror="this.remove()">` : ""}</span>
                <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
                  <span class="lbl">${esc(cs.name)}</span>
                  <span class="hint">ab ${esc(c.time)}${on ? " · aktiv" : ""}</span></span>
              </button>
              <button class="round" data-action="scene-edit" data-id="${cs.id}" aria-label="${esc(cs.name)} bearbeiten" style="background:#33353C;color:#fff">${SVG.pen}</button>
            </div>`;
        }).join("");
        content = `<section class="box" style="gap:6px"><span class="lbl">Folgt dem Tagesverlauf</span>
            <span class="hint">Diese Szenen werden über den Tag automatisch nacheinander aktiviert. Die Zeitpunkte legst du in der Hue-App fest.</span></section>
          <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sec">Szenen in diesem Ablauf</h2>
            <div class="box" style="gap:0;padding:6px 14px">${rows || `<span class="hint">Keine Szenen gefunden.</span>`}</div></section>`;
      } else {
        const spatialOk = scenes.some((x) => x.group === s.group && x.mapping === "spatial");
        const mapped = s.mapping && s.mapping !== "classic";
        const bri = s.brightness != null ? Math.round(s.brightness) : 100;
        const speed = Math.round((s.speed != null ? s.speed : 0.5) * 9) + 1;
        const inScene = new Set(s.lights || []);
        const areaLamps = area.lights.map((id) => lights[id]).filter(Boolean);
        content = `
          ${spatialOk ? `<section style="display:flex;flex-direction:column;gap:8px"><h2 class="sec">Farbverteilung</h2>
            <div class="box"><span class="lbl">Szenenmodus</span>
              <div class="seg" role="group" aria-label="Szenenmodus">
                <button data-action="scene-map" data-id="classic" aria-pressed="${!mapped}" style="background:${mapped ? "transparent" : "#fff"};color:${mapped ? "#E5E7EB" : "#16171B"}">Klassisch</button>
                <button data-action="scene-map" data-id="spatial" aria-pressed="${mapped}" style="background:${mapped ? "#fff" : "transparent"};color:${mapped ? "#16171B" : "#E5E7EB"}">Spatial Mapping</button>
              </div>
              <span class="hint">${mapped ? "Farben werden nach der Position der Lampen im Raum verteilt." : "Farben werden ohne Rücksicht auf die Position verteilt."}</span></div></section>` : ""}
          <section class="box"><div class="row"><span class="lbl">Helligkeit der Szene</span><span class="val">${bri} %</span></div>
            <input type="range" min="1" max="100" value="${bri}" data-action="scene-bri" data-id="${s.id}" aria-label="Helligkeit der Szene"></section>
          ${s.dynamic ? `<section style="display:flex;flex-direction:column;gap:8px"><h2 class="sec">Dynamische Szene</h2>
            <div class="box" style="gap:14px">
              <div style="display:flex;flex-direction:column;gap:10px"><div class="row"><span class="lbl">Geschwindigkeit</span><span class="val">${speed} / 10</span></div>
                <input type="range" min="1" max="10" value="${speed}" data-action="scene-speed" data-id="${s.id}" aria-label="Geschwindigkeit"></div>
              <div style="height:1px;background:#33353C"></div>
              <div class="row"><span style="display:flex;flex-direction:column;gap:2px"><span class="lbl">Automatische Wiedergabe</span><span class="hint" style="font-size:12px">Startet immer dynamisch</span></span>
                <button class="switch ${s.auto_dynamic ? "on" : "off"}" data-action="scene-auto" data-id="${s.id}" aria-pressed="${!!s.auto_dynamic}" aria-label="Automatische Wiedergabe"><span></span></button></div>
            </div></section>` : ""}
          <section style="display:flex;flex-direction:column;gap:8px">
            <div class="row" style="margin:0 16px"><h2 class="sec" style="margin:0">Lampen</h2><span class="val" style="font-size:13px">${[...inScene].filter((id) => area.lights.includes(id)).length} von ${areaLamps.length}</span></div>
            <div class="hs" data-scroll="sheet-lamps">${areaLamps.map((l) => this._lampCard(l, { inScene: inScene.has(l.id), toggle: "scene-lamp", noPick: true })).join("")}</div>
            ${areaLamps.some((l) => !inScene.has(l.id)) ? `<button data-action="scene-all" style="margin:2px 16px 0;align-self:flex-start;height:36px;padding:0 14px;border-radius:18px;border:1px solid #4A4D57;background:transparent;font-size:13px;font-weight:600">Alle Lampen auswählen</button>` : ""}
          </section>`;
      }
      return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${smart ? "Tagesverlauf" : "Szene bearbeiten"}" style="background:linear-gradient(180deg, ${mix(c0, "#16171B", 0.55)} 0%, #16171B 42%)">
          <div class="bar">
            ${this._editStack && this._editStack.length ? `<button class="round" data-action="sheet-back" aria-label="Zurück" style="background:rgba(22,23,27,.5)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>` : ""}
            <span style="flex:1 1 auto;font-size:16px;font-weight:600">${smart ? "Tagesverlauf" : "Szene bearbeiten"}</span>
            <button class="done" data-action="sheet-close">FERTIG</button>
          </div>
          <div class="scroll" data-scroll="sheet-${s.id}" style="padding:8px 0 28px;display:flex;flex-direction:column;gap:20px">
            <div style="padding:0 16px;display:flex;flex-direction:column;gap:12px">
              <span class="circle" style="width:64px;height:64px;border-radius:32px;background:${circleBg(s.colors)}">${img ? `<img src="${img}" alt="" style="width:64px;height:64px" onerror="this.remove()">` : ""}</span>
              <h1 style="margin:0;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:-.02em;overflow-wrap:break-word">${esc(s.name)}</h1>
              ${badges.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${badges.map((b) => `<span class="chip">${b}</span>`).join("")}</div>` : ""}
            </div>
            ${content}
          </div>
        </div>`;
    }

    // ------------------------------------------------------------- lamp view
    _lampMode(l) {
      if (this._mode[l.id]) return this._mode[l.id];
      if (l.effect && l.effect !== "no_effect") return "fx";
      if (l.mode === "color" && l.has_color) return "color";
      if (l.has_temperature) return l.mirek && l.mirek >= 300 ? "warm" : "temp";
      return l.has_color ? "color" : "none";
    }

    _lampPos(l, mode) {
      const key = l.id + mode;
      if (this._pos[key]) return this._pos[key];
      const mmin = l.mirek_min || 153, mmax = l.mirek_max || 500;
      if (mode === "color") {
        const [h, , li] = hexToHsl(l.color);
        const d = clamp(1 - li, 0, 0.5);
        const a = (h * Math.PI) / 180;
        return { x: 50 + Math.cos(a) * d * 100, y: 50 + Math.sin(a) * d * 100 };
      }
      if (mode === "temp") {
        const t = l.mirek ? clamp((mmax - l.mirek) / (mmax - mmin), 0, 1) : 0.5;
        return { x: 50, y: clamp(t * 100, 4, 96) };
      }
      if (mode === "warm") {
        const d = l.mirek ? clamp((l.mirek - 250) / (mmax - 250), 0, 1) * 0.5 : 0.25;
        return { x: 50 + d * 70.7, y: 50 + d * 70.7 };
      }
      return { x: 50, y: 50 };
    }

    _lampView(area) {
      const lights = this._data.lights || {};
      const l = lights[this._lampId];
      const mode = this._lampMode(l);
      const isFx = mode === "fx";
      const w = Math.round(this.getBoundingClientRect().width) || 390;
      const H = Number((this._config && this._config.height) || 760);
      const wheel = Math.max(200, Math.min(w - 40, H - 300, 380));
      const bri = l.on && l.brightness != null ? l.brightness : 0;
      const ring = "inset 0 0 0 2px #FFFFFF";
      const effects = (l.effects || []).filter((e) => e !== "no_effect");

      let top = "";
      if (isFx) {
        const cols = w >= 600 ? 6 : 4;
        const groups = FX.map((g) => {
          const items = [];
          g.fam.forEach((fm) => {
            if (!effects.includes(fm.id)) return;
            fm.v.forEach((v, vi) => {
              const col = v[1] || v[2];
              const sel = l.effect === fm.id && (this._fxVar[l.id] !== undefined ? this._fxVar[l.id] === fm.id + vi : vi === 0);
              items.push(`<button class="fxt" data-action="fx" data-id="${fm.id}" data-var="${vi}" aria-pressed="${sel}" style="background:${sel ? "#3A3B42" : "#2A2B31"};box-shadow:${sel ? ring : "none"}">
                  <span class="circle" style="background:${fxCircle(col)}"></span>
                  <span style="font-size:12px;font-weight:600;line-height:1.2;text-align:center">${fm.n}</span>
                  <span style="font-size:11px;color:#A1A6B3">${v[0]}</span></button>`);
            });
          });
          return items.length ? `<section style="display:flex;flex-direction:column;gap:10px"><h2 class="sec" style="margin:0;letter-spacing:.12em">${g.title}</h2>
              <div style="display:grid;grid-template-columns:repeat(${cols}, minmax(0,1fr));gap:10px">${items.join("")}</div></section>` : "";
        }).join("");
        const known = FX.flatMap((g) => g.fam.map((f) => f.id));
        const extra = effects.filter((e) => !known.includes(e));
        top = `<div style="padding:6px 16px 20px;display:flex;flex-direction:column;gap:22px">
            <div class="row"><h2 style="margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em">Effekte</h2>
              ${l.effect ? `<button class="done" data-action="fx-off">EFFEKT AUS</button>` : ""}</div>
            ${groups}
            ${extra.length ? `<section style="display:flex;flex-direction:column;gap:10px"><h2 class="sec" style="margin:0">Weitere</h2><div style="display:grid;grid-template-columns:repeat(${cols}, minmax(0,1fr));gap:10px">${extra.map((e) => `<button class="fxt" data-action="fx" data-id="${esc(e)}" data-var="0" aria-pressed="${l.effect === e}" style="background:${l.effect === e ? "#3A3B42" : "#2A2B31"};box-shadow:${l.effect === e ? ring : "none"}"><span class="circle" style="background:${fxCircle("#C9B8FF")}"></span><span style="font-size:12px;font-weight:600">${esc(e)}</span></button>`).join("")}</div></section>` : ""}
          </div>`;
      } else if (mode !== "none") {
        const bg = mode === "color"
          ? "radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,0) 70%), conic-gradient(from 90deg, #FF4D4D, #FFD24D, #6BE36B, #4DE3E3, #4D6BFF, #E34DE3, #FF4D4D)"
          : mode === "temp" ? "linear-gradient(180deg, #FFB347 0%, #FFE6BF 38%, #FFFFFF 62%, #D6E6FF 100%)"
            : "radial-gradient(circle, #FFFFFF 0%, #FFF4E2 30%, #FFD594 68%, #FF9F2E 100%)";
        const others = area.lights.map((id) => lights[id]).filter((o) => o && o.id !== l.id && o.on && this._lampMode(o) === mode)
          .map((o) => { const p = this._lampPos(o, mode); return `<span class="dot" style="left:${p.x}%;top:${p.y}%;background:${o.color}"></span>`; }).join("");
        const p = this._lampPos(l, mode);
        top = `<div style="flex:1 1 auto;display:flex;align-items:center;justify-content:center;padding:8px 16px">
            <button class="wheel" data-wheel="${mode}" aria-label="${mode === "color" ? "Farbkreis: tippen, um eine Farbe zu wählen" : "Weißlicht: tippen, um den Farbton zu wählen"}" style="width:${wheel}px;height:${wheel}px;background:${bg}">
              ${others}
              <span class="pin" style="left:${p.x}%;top:${p.y}%">
                <svg width="64" height="76" viewBox="0 0 64 76" style="position:absolute;left:0;top:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))"><path d="M32 2C16 2 4 14 4 30c0 18 22 36 28 44 6-8 28-26 28-44C60 14 48 2 32 2z" fill="${l.on ? l.color : "#6B6658"}" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/></svg>
                <span style="position:absolute;left:0;top:12px;width:64px;display:flex;justify-content:center;color:#fff"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${lightIcon(l.archetype)}"/></svg></span>
              </span>
            </button></div>`;
      } else {
        top = `<div class="msg" style="margin:auto;text-align:center">Diese Lampe kann nur gedimmt werden.</div>`;
      }

      const mbtn = (m, label, inner) => `<button data-action="lamp-mode" data-id="${m}" aria-pressed="${mode === m}" aria-label="${label}" style="box-shadow:${mode === m ? ring : "none"}">${inner}</button>`;
      const modes = [
        l.has_color ? mbtn("color", "Farbe", `<span style="background:radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,.9) 14%, rgba(255,255,255,0) 64%), conic-gradient(from 0deg, #FF7A7A, #FFB877, #FFE27A, #9BE38F, #74D9E8, #7C9BFF, #B989FF, #FF86D2, #FF7A7A)"></span>`) : "",
        l.has_temperature ? mbtn("temp", "Farbtemperatur", `<span style="background:linear-gradient(180deg, #FFC75F 0%, #FFF3E2 60%, #DCEBFF 100%)"></span>`) : "",
        l.has_temperature ? mbtn("warm", "Warmes Weiß", `<span style="background:radial-gradient(circle, #FFFFFF 0%, #FFE9C6 45%, #FFA43A 100%)"></span>`) : "",
      ].join("");
      const fxBtn = effects.length ? `<span style="width:2px;height:22px;border-radius:1px;background:#4A4D57"></span>
          <button data-action="lamp-mode" data-id="fx" aria-pressed="${isFx}" aria-label="Effekte" style="padding:0;color:#fff;box-shadow:${isFx ? ring : "none"}">${SVG.fx}</button>` : "";
      const lamps = area.lights.map((id) => lights[id]).filter(Boolean).map((o) => this._lampCard(o, { selected: o.id === l.id, pick: "lamp-pick" })).join("");
      const glow = (isFx || !l.on ? "#16171B" : l.color) + "40";

      return `<div style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;background:radial-gradient(circle at 50% 38%, ${glow} 0%, #16171B 65%)">
          <div class="bar"><span style="flex:1 1 auto;font-size:15px;font-weight:600">${isFx ? "" : esc(l.name)}</span>
            <button class="done" data-action="lamp-done">FERTIG</button></div>
          <div class="scroll" data-scroll="lamp-top-${isFx ? "fx" : "w"}" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column">${top}</div>
          <div style="flex:none;padding:6px 0 14px;background:linear-gradient(180deg, rgba(22,23,27,0) 0%, rgba(22,23,27,.92) 18px, #16171B 40px);display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 16px">
              ${modes || fxBtn ? `<div class="modes" role="group" aria-label="Modus">${modes}${fxBtn}</div>` : "<span></span>"}
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:none">
                <span style="font-size:12px;font-weight:600;letter-spacing:.08em">${bri} %</span>
                <span style="position:relative;width:96px;height:60px;border-radius:30px;overflow:hidden;background:#3A3C44;display:block">
                  <span style="position:absolute;left:0;right:0;bottom:0;height:${bri}%;background:linear-gradient(180deg, #F2F2F4, #B9BBC2);display:block"></span>
                  <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${bri > 55 ? "#16171B" : "#FFFFFF"};pointer-events:none">${SVG.sun}</span>
                  <input class="vbri" type="range" min="1" max="100" value="${bri || 1}" data-action="lamp-bri" data-id="${l.id}" aria-label="Helligkeit">
                </span>
              </div>
            </div>
            <div class="hs" data-scroll="lamp-row-${area.id}" role="group" aria-label="Lampe wählen" style="padding:4px 16px">${lamps}</div>
          </div>
        </div>`;
    }

    _imageUrl(scene) {
      const base = this._config && this._config.image_path;
      if (!base || !scene.image) return null;
      return `${base.replace(/\/$/, "")}/${scene.image}.jpg`;
    }

    // ------------------------------------------------------------------ events
    _bind() {
      const root = this.shadowRoot;
      root.querySelectorAll("[data-action]").forEach((el) => {
        const action = el.dataset.action;
        if (el.tagName === "INPUT") {
          el.addEventListener("pointerdown", () => { this._busy = true; });
          el.addEventListener("change", (ev) => { this._busy = false; this._onInput(action, el.dataset.id, Number(ev.target.value)); });
          el.addEventListener("pointerup", () => { setTimeout(() => { this._busy = false; }, 300); });
          return;
        }
        el.addEventListener("click", (ev) => { ev.stopPropagation(); this._onClick(action, el.dataset); });
      });
      root.querySelectorAll("[data-wheel]").forEach((el) => {
        el.addEventListener("click", (ev) => this._onWheel(el, ev));
      });
    }

    _area(id) { return (this._data.areas || []).find((a) => a.id === id); }
    _scene(id) { return (this._data.scenes || []).find((x) => x.id === id); }

    _sceneUpdate(id, changes) {
      return this._hass.callWS({ type: "hue_card/scene_update", scene_id: id, ...changes }).catch((err) => console.warn("hue-card", err));
    }

    _onInput(action, id, value) {
      if (action === "area-bri") {
        const a = this._area(id);
        if (a && a.grouped_light) this._cmd("grouped_light", a.grouped_light, { on: { on: true }, dimming: { brightness: value } });
      } else if (action === "lamp-bri") {
        this._cmd("light", id, { on: { on: true }, dimming: { brightness: value } });
      } else if (action === "scene-bri") {
        this._sceneUpdate(id, { brightness: value });
      } else if (action === "scene-speed") {
        this._sceneUpdate(id, { speed: (value - 1) / 9 });
      }
    }

    _onWheel(el, ev) {
      const l = this._data.lights[this._lampId];
      if (!l) return;
      const mode = el.dataset.wheel;
      const r = el.getBoundingClientRect();
      let dx = (ev.clientX - r.left) / r.width - 0.5, dy = (ev.clientY - r.top) / r.height - 0.5;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.5) { dx = (dx / d) * 0.5; dy = (dy / d) * 0.5; d = 0.5; }
      this._pos[l.id + mode] = { x: (dx + 0.5) * 100, y: (dy + 0.5) * 100 };
      const mmin = l.mirek_min || 153, mmax = l.mirek_max || 500;
      const body = { on: { on: true } };
      if (mode === "color") {
        const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        body.color = { xy: hexToXy(hslHex(hue, 100, 100 - Math.min(1, d / 0.5) * 50)) };
      } else if (mode === "temp") {
        body.color_temperature = { mirek: Math.round(mmax - (dy + 0.5) * (mmax - mmin)) };
      } else {
        body.color_temperature = { mirek: Math.round(clamp(250 + (d / 0.5) * (mmax - 250), mmin, mmax)) };
      }
      const go = () => this._cmd("light", l.id, body);
      if (l.effect) this._cmd("light", l.id, { effects_v2: { action: { effect: "no_effect" } } }).then(go); else go();
      this._render();
    }

    _onClick(action, d) {
      const data = this._data;
      if (!data) return;
      switch (action) {
        case "open-area":
          this._areaId = d.id; this._view = "room"; this._render(); break;
        case "back":
          this._view = "areas"; this._areaId = null; this._edit = null; this._render(); break;
        case "area-toggle": {
          const a = this._area(d.id);
          if (a && a.grouped_light) this._cmd("grouped_light", a.grouped_light, { on: { on: !a.on } });
          break;
        }
        case "scene": {
          const s = this._scene(d.id);
          if (!s) break;
          if (s.group) { this._pending[s.group] = { id: s.id, t: Date.now() }; this._render(); }
          if (s.kind === "smart_scene") this._cmd("smart_scene", s.id, { recall: { action: "activate" } });
          else this._cmd("scene", s.id, { recall: { action: s.auto_dynamic ? "dynamic_palette" : "active" } });
          break;
        }
        case "scene-edit":
          if (this._edit && this._edit !== d.id) { this._editStack = this._editStack || []; this._editStack.push(this._edit); }
          this._edit = d.id; this._render(); break;
        case "sheet-back":
          this._edit = (this._editStack || []).pop() || null; this._render(); break;
        case "sheet-close":
          this._edit = null; this._editStack = []; this._render(); break;
        case "scene-map":
          this._sceneUpdate(this._edit, { mapping: d.id === "spatial" ? "spatial" : "classic" }); break;
        case "scene-auto": {
          const s = this._scene(d.id);
          if (s) this._sceneUpdate(s.id, { auto_dynamic: !s.auto_dynamic });
          break;
        }
        case "scene-lamp": {
          const s = this._scene(this._edit);
          if (!s) break;
          const set = new Set(s.lights || []);
          if (set.has(d.id)) { if (set.size > 1) set.delete(d.id); } else set.add(d.id);
          this._sceneUpdate(s.id, { lights: [...set] });
          break;
        }
        case "scene-all": {
          const s = this._scene(this._edit);
          const a = s && this._area(s.group);
          if (s && a) this._sceneUpdate(s.id, { lights: [...new Set([...(s.lights || []), ...a.lights])] });
          break;
        }
        case "lamp-toggle": {
          const l = data.lights[d.id];
          if (l) this._cmd("light", l.id, { on: { on: !l.on } });
          break;
        }
        case "lamp-edit":
        case "lamp-pick":
          if (data.lights[d.id]) { this._lampId = d.id; this._view = "lamp"; this._render(); }
          break;
        case "lamp-done":
          this._view = "room"; this._lampId = null; this._render(); break;
        case "lamp-mode":
          this._mode[this._lampId] = d.id; this._render(); break;
        case "fx": {
          const l = data.lights[this._lampId];
          if (!l) break;
          const fam = FX.flatMap((g) => g.fam).find((f) => f.id === d.id);
          const v = fam ? fam.v[Number(d.var) || 0] : null;
          const action2 = { effect: d.id };
          if (v && v[1]) action2.parameters = { color: { xy: hexToXy(v[1]) } };
          this._fxVar[l.id] = d.id + (Number(d.var) || 0);
          this._cmd("light", l.id, { on: { on: true }, effects_v2: { action: action2 } });
          this._render();
          break;
        }
        case "fx-off": {
          const l = data.lights[this._lampId];
          if (l) this._cmd("light", l.id, { effects_v2: { action: { effect: "no_effect" } } });
          break;
        }
        default:
          break;
      }
    }
  }

  if (!customElements.get("hue-card")) {
    customElements.define("hue-card", HueCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: "hue-card", name: "Hue Card", description: "Hue-App-artige Steuerung für Räume, Szenen und Lampen", preview: false });
    console.info(`%c HUE-CARD %c ${VERSION} `, "background:#F5B04C;color:#16171B;font-weight:700", "background:#26272D;color:#fff");
  }
})();
