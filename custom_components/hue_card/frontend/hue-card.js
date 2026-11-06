/* Hue Card – Hue-App-artige Steuerung für Home Assistant (Stufe 1) */
(() => {
  const VERSION = "0.1.0";

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
    .scene > button { width: 104px; height: 126px; border-radius: 16px; border: 0; padding: 12px 6px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
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
        body = area ? this._roomView(area) : this._areasView();
      }
      const h = this._config && this._config.height;
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

    _activeScene(area) {
      return (this._data.scenes || []).find((s) => s.group === area.id && s.active && s.active !== "inactive") || null;
    }

    _roomView(area) {
      const lights = this._data.lights || {};
      const scenes = (this._data.scenes || []).filter((s) => s.group === area.id);
      const active = this._activeScene(area);
      const onCols = area.lights.map((id) => lights[id]).filter((l) => l && l.on).map((l) => l.color);
      const pal = active ? active.colors : onCols;
      const c1 = area.on && pal[0] ? pal[0] : null;
      const c2 = area.on && (pal[1] || pal[0]) ? (pal[1] || mix(pal[0], "#000000", 0.25)) : null;
      const headBg = c1 ? `linear-gradient(170deg, ${c1}, ${c2})` : "#26272D";
      const light = c1 && lum(c1) > 0.62;
      const fg = light ? "#16171B" : "#FFFFFF";
      const chip = light ? "rgba(255,255,255,.55)" : "rgba(22,23,27,.45)";

      const sceneTiles = scenes.map((s) => {
        const sel = area.on && s.active && s.active !== "inactive";
        const img = this._imageUrl(s);
        return `<div class="scene">
          <button data-action="scene" data-id="${s.id}" data-kind="${s.kind}" aria-pressed="${sel}" style="background:${sel ? `linear-gradient(160deg, ${s.colors[0]}CC, ${(s.colors[1] || s.colors[0])}99)` : "#26272D"}">
            <span class="circle" style="background:${circleBg(s.colors)}">
              ${img ? `<img src="${img}" alt="" onerror="this.remove()">` : ""}
              ${s.kind === "smart_scene" && !sel ? `<span class="overlay" style="left:11px;top:11px;width:28px;height:28px;background:rgba(255,255,255,.85);color:#16171B"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg></span>` : ""}
              ${sel ? `<span class="overlay" style="background:rgba(22,23,27,.7)"><span style="width:10px;height:10px;border-radius:2px;background:#fff"></span></span>` : ""}
            </span>
            <span class="sname">${esc(s.name)}</span>
          </button>
          ${s.dynamic ? `<span class="badge" title="Dynamisch"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg></span>` : ""}
        </div>`;
      }).join("");

      const lampCards = area.lights.map((id) => lights[id]).filter(Boolean).map((l) => {
        const c = l.on ? l.color : "#6B6658";
        return `<div class="lamp" style="background:${cardBg(c)}">
          <button class="top" data-action="lamp-edit" data-id="${l.id}" aria-label="${esc(l.name)} bearbeiten">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${l.on ? "#fff" : "rgba(255,255,255,.6)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${lightIcon(l.archetype)}"/></svg>
            <span class="name" style="color:${l.on ? "#fff" : "rgba(255,255,255,.7)"}">${esc(l.name)}</span>
          </button>
          <div class="bottom"><button class="sw" data-action="lamp-toggle" data-id="${l.id}" aria-pressed="${l.on}" aria-label="${esc(l.name)} schalten" style="justify-content:${l.on ? "flex-end" : "flex-start"}"><span style="background:${l.on ? "#fff" : "#9A9AA2"}"></span></button></div>
        </div>`;
      }).join("");

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
    }

    _area(id) { return (this._data.areas || []).find((a) => a.id === id); }

    _onInput(action, id, value) {
      if (action === "area-bri") {
        const a = this._area(id);
        if (a && a.grouped_light) this._cmd("grouped_light", a.grouped_light, { on: { on: true }, dimming: { brightness: value } });
      }
    }

    _onClick(action, d) {
      const data = this._data;
      if (!data) return;
      switch (action) {
        case "open-area":
          this._areaId = d.id; this._view = "room"; this._render(); break;
        case "back":
          this._view = "areas"; this._areaId = null; this._render(); break;
        case "area-toggle": {
          const a = this._area(d.id);
          if (a && a.grouped_light) this._cmd("grouped_light", a.grouped_light, { on: { on: !a.on } });
          break;
        }
        case "scene": {
          const s = (data.scenes || []).find((x) => x.id === d.id);
          if (!s) break;
          if (s.kind === "smart_scene") this._cmd("smart_scene", s.id, { recall: { action: "activate" } });
          else this._cmd("scene", s.id, { recall: { action: s.auto_dynamic ? "dynamic_palette" : "active" } });
          break;
        }
        case "lamp-toggle": {
          const l = data.lights[d.id];
          if (l) this._cmd("light", l.id, { on: { on: !l.on } });
          break;
        }
        case "lamp-edit":
          // Stufe 2: Lampe bearbeiten
          break;
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
