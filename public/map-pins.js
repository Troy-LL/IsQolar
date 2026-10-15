const SVG_NS = "http://www.w3.org/2000/svg";
const PAD = 8;
const TIP = 40;

const KIND_LABEL = {
  room: "Room",
  stairs: "Stairs",
  gate: "Gate",
  entrance: "Entrance",
  cr: "Comfort room",
};

const KIND_PATH = {
  room: "M3.5 14.5V3.5h9v11M8 14.5V9",
  stairs: "M2 13h4V9h4V5h4",
  gate: "M3 14.5V6.5M13 14.5V6.5M3 6.5C3 2.5 13 2.5 13 6.5",
  entrance: "M2 8h7M6.2 4.8 10 8 6.2 11.2M12 3.5v9",
};

function svgEl(tag, attrs, text) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}

export function zoomStep(zoom) {
  const z = Number(zoom);
  if (!Number.isFinite(z) || z < 16.5) return 0;
  if (z < 18) return 1;
  if (z < 19.5) return 2;
  return 3;
}

export function kindOf(kind) {
  const s = String(kind || "room").toLowerCase();
  if (s === "stair" || s === "stairs") return "stairs";
  if (s === "cr" || s === "comfort" || s === "restroom") return "cr";
  if (s === "gate") return "gate";
  if (s === "entrance" || s === "entry" || s === "start") return "entrance";
  return "room";
}

function kindIcon(kind) {
  const icon = svgEl("svg", {
    class: "opin-ico",
    x: "14.5",
    y: "10.5",
    width: "15",
    height: "15",
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
  });
  if (kind === "cr") {
    icon.append(svgEl("text", {
      x: "8",
      y: "11.2",
      "text-anchor": "middle",
      "font-size": "7.5",
      "font-weight": "700",
      "font-family": "system-ui, sans-serif",
      fill: "#8B0000",
    }, "CR"));
    return icon;
  }
  const d = KIND_PATH[kind];
  if (!d) return null;
  icon.append(svgEl("path", {
    d,
    fill: "none",
    stroke: "#8B0000",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));
  return icon;
}

export function pinElement({ kind, state, label } = {}) {
  const known = Object.hasOwn(KIND_LABEL, kind) ? kind : "";
  const btn = document.createElement("button");
  btn.setAttribute("type", "button");
  btn.className = "opin";
  if (known) btn.dataset.kind = known;
  if (state === "selected" || state === "destination") btn.dataset.state = state;
  btn.setAttribute("aria-label", label || (known ? KIND_LABEL[known] : "Pin"));
  if (state === "selected" || state === "destination") btn.setAttribute("aria-pressed", "true");
  const svg = svgEl("svg", { viewBox: "0 0 44 44", width: "44", height: "44", "aria-hidden": "true" });
  svg.append(svgEl("path", {
    class: "opin-fill",
    d: "M22 40c0 0-13-12.2-13-22a13 13 0 1 1 26 0c0 9.8-13 22-13 22z",
  }));
  svg.append(svgEl("circle", { class: "opin-ring", cx: "22", cy: "18", r: "8.25" }));
  if (known) {
    const icon = kindIcon(known);
    if (icon) svg.append(icon);
  }
  btn.append(svg);
  return btn;
}

function hiddenName() {
  return [
    "all",
    ["!=", ["get", "name"], null],
    ["!", ["in", "?", ["to-string", ["coalesce", ["get", "name"], ""]]]],
  ];
}

export const namesLayer = {
  filter: hiddenName(),
  layout: {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Bold"],
    "text-anchor": "top",
    "text-offset": [0, 0.8],
    "text-size": [
      "step",
      ["zoom"],
      ["case", ["get", "main"], 14, 11],
      17,
      ["case", ["get", "main"], 16, 13],
      18.5,
      ["case", ["get", "main"], 18, 15],
    ],
    "text-max-width": 8,
    "text-padding": 10,
    "text-allow-overlap": false,
    "symbol-z-order": "source",
  },
  paint: {
    "text-color": ["case", ["get", "main"], "#5c0000", "#1f1a1a"],
    "text-halo-color": "#ffffff",
    "text-halo-width": 3,
    "text-halo-blur": 0,
  },
};

export const wingsLayer = {
  filter: hiddenName(),
  layout: {
    "text-field": ["upcase", ["get", "name"]],
    "text-font": ["Noto Sans Bold"],
    "text-letter-spacing": 0.08,
    "text-size": ["step", ["zoom"], 11, 18.4, 13, 19.4, 15],
    "text-padding": 16,
    "text-allow-overlap": false,
  },
  paint: {
    "text-color": "#6B5E57",
    "text-halo-color": "#ffffff",
    "text-halo-width": 2,
    "text-halo-blur": 0,
  },
};

function viewBounds() {
  const desk = innerWidth >= 900;
  const sheet = document.getElementById("sheet");
  const open = !!(sheet && !sheet.hidden);
  const sheetTop = open ? sheet.getBoundingClientRect().top : innerHeight;
  const top = desk ? 80 : 112;
  const left = desk && open ? 424 : 8;
  const right = innerWidth - (desk ? 68 : 60);
  const bottom = Math.min(innerHeight - 8, sheetTop - 8);
  return { left, top, right: Math.max(left + 44, right), bottom: Math.max(top + 44, bottom) };
}

function overlaps(a, b, pad) {
  return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}

function fits(bounds, box) {
  return box.w <= bounds.right - bounds.left + 0.5
    && box.h <= bounds.bottom - bounds.top + 0.5
    && box.x >= bounds.left - 0.5
    && box.y >= bounds.top - 0.5
    && box.x + box.w <= bounds.right + 0.5
    && box.y + box.h <= bounds.bottom + 0.5;
}

function shiftIn(bounds, box) {
  let x = box.x;
  let y = box.y;
  if (x < bounds.left) x = bounds.left;
  if (y < bounds.top) y = bounds.top;
  if (x + box.w > bounds.right) x = bounds.right - box.w;
  if (y + box.h > bounds.bottom) y = bounds.bottom - box.h;
  return { x, y, w: box.w, h: box.h };
}

function placeBox(bounds, taken, candidates, allowOverlap) {
  for (const c of candidates) {
    if (fits(bounds, c) && !taken.some((o) => overlaps(c, o, PAD))) return c;
  }
  for (const c of candidates) {
    const s = shiftIn(bounds, c);
    if (Math.hypot(s.x - c.x, s.y - c.y) > 28) continue;
    if (fits(bounds, s) && !taken.some((o) => overlaps(s, o, PAD))) return s;
  }
  if (!allowOverlap) return null;
  for (const c of candidates) {
    const s = shiftIn(bounds, c);
    if (Math.hypot(s.x - c.x, s.y - c.y) > 28) continue;
    if (fits(bounds, s)) return s;
  }
  return null;
}

function inView(x, y) {
  return x >= 4 && y >= 4 && x <= innerWidth - 4 && y <= innerHeight - 4;
}

function ensureLayer() {
  let layer = document.getElementById("map-pins");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "map-pins";
    layer.className = "map-pins";
    document.body.append(layer);
  }
  return layer;
}

function pinState(pin) {
  if (pin.selected) return "selected";
  if (pin.dest) return "destination";
  return "";
}

/**
 * @param {Element|null} host
 * @param {{ zoom?: number, building?: string, chip?: {x:number,y:number}|null, pins?: Array<{id?: string, x:number, y:number, kind?: string, label?: string, selected?: boolean, dest?: boolean}> }} model
 */
export function drawMapPins(host, model) {
  wired = true;
  render(host, model || {});
}

function render(host, model) {
  const layer = ensureLayer();
  const bounds = viewBounds();
  layer.dataset.step = String(zoomStep(model.zoom));
  layer.replaceChildren();
  const taken = [];
  const pins = (Array.isArray(model.pins) ? model.pins : [])
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && inView(p.x, p.y))
    .map((p) => ({ ...p, kind: kindOf(p.kind) }))
    .sort((a, b) => Number(!!(b.selected || b.dest)) - Number(!!(a.selected || a.dest)));

  for (const pin of pins) {
    const state = pinState(pin);
    const btn = pinElement({ kind: pin.kind, state, label: pin.label || KIND_LABEL[pin.kind] });
    btn.style.left = `${pin.x - 22}px`;
    btn.style.top = `${pin.y - TIP}px`;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const detail = { id: pin.id || "", kind: pin.kind, label: pin.label || "" };
      (host || layer).dispatchEvent(new CustomEvent("mappin", { bubbles: true, detail }));
    });
    layer.append(btn);
    taken.push({ x: pin.x - 22, y: pin.y - TIP, w: 44, h: 44 });
    pin.btn = btn;
  }

  const building = String(model.building || "").trim();
  if (building && model.chip && Number.isFinite(model.chip.x) && Number.isFinite(model.chip.y)) {
    const chip = document.createElement("div");
    chip.className = "bldg-chip";
    chip.textContent = building;
    chip.style.maxWidth = `${Math.max(80, bounds.right - bounds.left)}px`;
    layer.append(chip);
    const w = Math.ceil(chip.getBoundingClientRect().width);
    const h = Math.ceil(chip.getBoundingClientRect().height);
    const ax = model.chip.x;
    const ay = model.chip.y;
    const box = placeBox(bounds, taken, [
      { x: ax - w / 2, y: ay - h - 12, w, h },
      { x: ax - w / 2, y: ay + 14, w, h },
      { x: ax + 20, y: ay - h / 2, w, h },
      { x: ax - w - 20, y: ay - h / 2, w, h },
    ], true);
    if (box) {
      chip.style.left = `${box.x}px`;
      chip.style.top = `${box.y}px`;
      taken.push(box);
    } else {
      chip.remove();
    }
  }

  for (const pin of pins) {
    const text = String(pin.label || "").trim();
    if (!text) continue;
    const lab = document.createElement("span");
    lab.className = "opin-label";
    lab.textContent = text;
    lab.style.maxWidth = `${Math.max(48, bounds.right - bounds.left)}px`;
    layer.append(lab);
    const w = Math.ceil(lab.getBoundingClientRect().width);
    const h = Math.ceil(lab.getBoundingClientRect().height) || 16;
    const left = pin.x - 22;
    const top = pin.y - TIP;
    const right = left + 44;
    const bottom = top + 44;
    const box = placeBox(bounds, taken, [
      { x: right + PAD, y: top + 10, w, h },
      { x: left - PAD - w, y: top + 10, w, h },
      { x: pin.x - w / 2, y: top - PAD - h, w, h },
      { x: right + PAD, y: bottom + PAD, w, h },
      { x: left - PAD - w, y: bottom + PAD, w, h },
    ], false);
    if (!box) {
      lab.remove();
      continue;
    }
    lab.style.left = `${box.x}px`;
    lab.style.top = `${box.y}px`;
    taken.push(box);
  }
}

function readTranslate(el) {
  const m = /translate\(\s*([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform || "");
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

function markerPoint(el) {
  const dot = el.querySelector("i") || el;
  const r = dot.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: (el.querySelector("span")?.textContent || "").trim() };
}

function fromDom() {
  const zoom = Number(document.body.dataset.izoom);
  const pins = [];
  const pin = document.getElementById("pin");
  if (pin && !pin.hidden) {
    const at = readTranslate(pin);
    if (at) {
      const title = document.getElementById("title")?.textContent?.trim() || "";
      pins.push({ id: "selected", x: at.x, y: at.y, kind: "room", label: title, selected: true, dest: true });
    }
    pin.classList.add("pin-replaced");
  } else if (pin) {
    pin.classList.remove("pin-replaced");
  }
  const indoor = document.body.classList.contains("inside");
  if (!indoor) {
    document.querySelectorAll(".pin-mk").forEach((el) => {
      const at = markerPoint(el);
      if (!at || !inView(at.x, at.y)) return;
      const kind = /gate/i.test(at.text) ? "gate" : /entrance/i.test(at.text) ? "entrance" : "room";
      pins.push({ id: kind, x: at.x, y: at.y, kind, label: at.text });
      el.classList.add("pin-replaced");
    });
  }
  const sheet = document.getElementById("sheet");
  const title = document.getElementById("title")?.textContent?.trim() || "";
  const outdoor = !indoor;
  const open = !!(sheet && !sheet.hidden);
  const buildingSheet = outdoor && open && title && document.getElementById("inside") && !document.getElementById("inside").hidden;
  let building = "";
  let chip = null;
  if (buildingSheet) {
    building = title;
    chip = { x: innerWidth / 2, y: Math.min(innerHeight * 0.42, innerHeight * 0.55) };
  } else if (!outdoor) {
    const where = document.getElementById("where")?.textContent || "";
    building = where.split("·")[0].trim();
    const b = viewBounds();
    chip = { x: b.left + 90, y: b.top + 28 };
  }
  return { zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 16.8, building, chip, pins };
}

let wired = false;
let pending = false;

function schedule() {
  if (wired || pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (!wired) render(document.getElementById("viewport"), fromDom());
  });
}

function watch() {
  const opts = { attributes: true, attributeFilter: ["style", "hidden", "class", "data-izoom", "data-snap"] };
  const pin = document.getElementById("pin");
  const outdoor = document.getElementById("outdoor");
  const sheet = document.getElementById("sheet");
  const title = document.getElementById("title");
  const where = document.getElementById("where");
  if (pin) new MutationObserver(schedule).observe(pin, opts);
  if (outdoor) new MutationObserver(schedule).observe(outdoor, { attributes: true, childList: true, subtree: true, attributeFilter: ["style", "class"] });
  if (sheet) new MutationObserver(schedule).observe(sheet, opts);
  if (title) new MutationObserver(schedule).observe(title, { childList: true, characterData: true, subtree: true });
  if (where) new MutationObserver(schedule).observe(where, { childList: true, characterData: true, subtree: true });
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ["class", "data-izoom"] });
  window.addEventListener("resize", schedule);
  schedule();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();
}
