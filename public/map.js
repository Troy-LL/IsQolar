import { planCampusRoute, allRooms, roomName, floorShort } from "./route.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const params = new URLSearchParams(location.search);
const SLOW = params.get("slow") === "1" ? 5 : 1;
const EDIT = params.get("edit") === "1";
// 4F's directory poster is turned a quarter turn compared with 1F and 5F, so draw it turned back.
const ROTATE = { "main-4f": true };
const WINGS = [
  ["West wing", ["stair-west-end", "stair-west-dome"]],
  ["North wing", ["stair-north-end", "stair-north-dome"]],
  ["East wing", ["stair-east-end", "stair-east-dome"]],
  ["South wing", ["stair-south-north", "stair-south-south"]],
];

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_IO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const PEEK = 132;
const LEG_PAD = 48;
// Indoor zoom is relative to the whole-floor fit, and a wide screen fits the floor far larger, so desktop stops a step earlier.
const LEG_MAX_ZOOM = 19.5;
const GOAL_ZOOM = innerWidth >= 900 ? 19.5 : 20.5;
// Every leg clears the floor chip (top), the floor stack (right) and the sheet (bottom).
function legPad() {
  const desk = innerWidth >= 900;
  const open = !$("sheet").hidden;
  return { top: desk ? 90 : 140, bottom: desk ? 40 : 160, left: (desk && open ? 420 : 0) + 24, right: 88 };
}
const S = { floors: [], paths: null, stairs: null, campus: null, rooms: [], inside: false, floorId: null, sel: null, route: null, step: -1, cam: {} };

function svg(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}
function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}
const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms * SLOW));
const stage = (s) => (document.body.dataset.stage = s);

// ---------- camera ----------
function layerOf(name) { return $(name); }
function setCam(name, c) {
  S.cam[name] = c;
  layerOf(name).setAttribute("viewBox", `${c.x} ${c.y} ${c.w} ${c.h}`);
  if (name === "indoor") queueLabels();
}
function insets() {
  const W = innerWidth;
  const H = innerHeight;
  const desk = W >= 900;
  const sheet = $("sheet");
  const open = !sheet.hidden;
  const top = desk ? 24 : 80;
  const left = desk && open ? 420 : 12;
  const right = S.inside ? 76 : 16;
  const bottom = !desk && open ? snapPx() + 12 : 16;
  return { W, H, top, left, right, bottom };
}
function fitCam(box, padPx = 0, bottomPx) {
  const ins = insets();
  const { W, H } = ins;
  const top = ins.top + padPx;
  const left = ins.left + padPx;
  const right = ins.right + padPx;
  const bottom = (bottomPx ?? ins.bottom) + padPx;
  const aw = Math.max(80, W - left - right);
  const ah = Math.max(80, H - top - bottom);
  const s = Math.min(aw / box.w, ah / box.h);
  return { x: box.x + box.w / 2 - (left + aw / 2) / s, y: box.y + box.h / 2 - (top + ah / 2) / s, w: W / s, h: H / s };
}
function tween(name, to, ms, ease = (t) => 1 - Math.pow(1 - t, 3)) {
  const from = S.cam[name] || to;
  const dur = RM ? 0 : ms * SLOW;
  if (!dur) {
    setCam(name, to);
    return Promise.resolve();
  }
  return new Promise((done) => {
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      const k = ease(t);
      setCam(name, { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k });
      if (t < 1) requestAnimationFrame(frame);
      else done();
    }
    requestAnimationFrame(frame);
  });
}
function fitCamPad(box, pad, maxZoom = GOAL_ZOOM) {
  const W = innerWidth;
  const H = innerHeight;
  const aw = Math.max(80, W - pad.left - pad.right);
  const ah = Math.max(80, H - pad.top - pad.bottom);
  // never zoom past maxZoom: grow tiny boxes around their center
  const fw = fitCam(floorBox(S.floorId)).w;
  const minW = (fw / Math.pow(2, maxZoom - 18)) * (aw / W);
  if (box.w < minW) box = { x: box.x + box.w / 2 - minW / 2, y: box.y, w: minW, h: box.h };
  const minH = minW * (ah / aw);
  if (box.h < minH) box = { x: box.x, y: box.y + box.h / 2 - minH / 2, w: box.w, h: minH };
  const s = Math.min(aw / box.w, ah / box.h);
  return { x: box.x + box.w / 2 - (pad.left + aw / 2) / s, y: box.y + box.h / 2 - (pad.top + ah / 2) / s, w: W / s, h: H / s };
}
function bbox(points, pad = 0) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}

// ---------- outdoor (MapLibre + OpenStreetMap) ----------
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
let map = null;
const flyDur = (ms) => (RM ? 0 : ms * SLOW);
function lngLatBox(coords) {
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}
function mapPadding() {
  const { W, H, top, left, right, bottom } = insets();
  return { top: top + 40, left: left + 20, right: right + 20, bottom: Math.min(bottom + 20, H * 0.6), W, H };
}
function moveDone(ms = 1400) {
  // moveend does not fire when the camera is already there, so also stop waiting after the move time.
  return new Promise((r) => {
    const t = setTimeout(r, flyDur(ms) + (RM ? 50 : 400));
    map.once("moveend", () => {
      clearTimeout(t);
      r();
    });
  });
}
async function flyTo(opts) {
  const done = moveDone(opts.duration || 1400);
  const p = opts.padding || mapPadding();
  const padding = { top: p.top, left: p.left, right: p.right, bottom: p.bottom };
  if (RM) map.jumpTo({ ...opts, padding });
  else map.flyTo({ curve: 1.3, easing: EASE_IO, ...opts, padding, duration: flyDur(opts.duration || 1400), essential: true });
  await done;
}
// Fit the outdoor camera to one leg: 48px padding, peek height at the bottom, 600ms easeInOutCubic.
async function fitLeg(coords) {
  const padding = legPad();
  const bearing = map.getBearing();
  const cam = map.cameraForBounds(lngLatBox(coords), { padding, bearing, maxZoom: 18.4 });
  if (!cam) return;
  const done = moveDone(600);
  const opts = { center: cam.center, zoom: cam.zoom - 0.2, pitch: 30, bearing, padding: { top: 0, left: 0, right: 0, bottom: 0 } };
  if (RM) map.jumpTo(opts);
  else map.easeTo({ ...opts, duration: flyDur(600), easing: EASE_IO });
  await done;
}
async function fitTo(coords, extra = {}) {
  // Fit flat first, then tilt: fitBounds with pitch and a tall phone sheet often refuses to fit.
  const pad = mapPadding();
  const padding = { top: pad.top, left: pad.left, right: pad.right, bottom: pad.bottom };
  const box = lngLatBox(coords);
  const cam = map.cameraForBounds(box, { padding, bearing: extra.bearing ?? -25, maxZoom: extra.maxZoom ?? 18.5 });
  const center = cam ? cam.center : [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2];
  const zoom = cam ? cam.zoom - 0.25 : 16.5;
  await flyTo({ center, zoom, pitch: extra.pitch ?? 50, bearing: extra.bearing ?? -25, duration: extra.duration ?? 1500 });
}
function featCoords(f) { return f.geometry.coordinates[0]; }
function featCenter(f) {
  const c = featCoords(f);
  return [c.reduce((a, p) => a + p[0], 0) / c.length, c.reduce((a, p) => a + p[1], 0) / c.length];
}
function mainFeatures() { return S.campus.buildings.features.filter((f) => f.properties.main); }
function mainCoords() { return mainFeatures().flatMap(featCoords); }
function buildingName(f) {
  const n = f.properties.name || "Unnamed building";
  return f.properties.part_of && f.properties.part_of !== n && !n.includes(f.properties.part_of) ? `${n} (${f.properties.part_of})` : n;
}
function marker(lngLat, color, text) {
  const e = el("div", { class: "pin-mk" });
  const dot = el("i");
  dot.style.background = color;
  e.append(dot, el("span", {}, text));
  return new maplibregl.Marker({ element: e, anchor: "left", offset: [-8, 0] }).setLngLat(lngLat);
}

function initMap() {
  return new Promise((resolve) => {
    const campus = S.campus;
    map = new maplibregl.Map({
      container: "outdoor",
      style: STYLE,
      center: campus.center,
      zoom: 16.6,
      pitch: 55,
      bearing: -25,
      maxPitch: 70,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: false, customAttribution: "Campus data © OpenStreetMap contributors (ODbL)" }), "bottom-left");
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      document.body.append(el("p", { class: "offline" }, "The street map needs internet. Search and the floor plans still work."));
      resolve();
    };
    const timer = setTimeout(fail, 15000);
    map.on("error", (e) => console.warn("map", e && e.error && e.error.message));
    map.on("load", () => {
      const ring = campus.campus.geometry;
      for (const layer of map.getStyle().layers) {
        if (layer["source-layer"] === "building") {
          const f = map.getFilter(layer.id);
          const notCampus = ["!", ["within", ring]];
          map.setFilter(layer.id, f ? ["all", f, notCampus] : notCampus);
          // The basemap's own 3D buildings ignore the campus filter at tile edges (its Main Building is 41 m), so keep the basemap flat.
          if (layer.type === "fill-extrusion") map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }
      map.addSource("pup-campus", { type: "geojson", data: campus.campus });
      map.addSource("pup-buildings", { type: "geojson", data: campus.buildings, promoteId: "osm" });
      map.addSource("pup-walk", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "pup-campus-fill", type: "fill", source: "pup-campus", paint: { "fill-color": "#f6e9e9", "fill-opacity": 0.55 } });
      map.addLayer({ id: "pup-campus-line", type: "line", source: "pup-campus", paint: { "line-color": "#880000", "line-width": 2, "line-dasharray": [2, 1.5] } });
      map.addLayer({
        id: "pup-3d",
        type: "fill-extrusion",
        source: "pup-buildings",
        paint: {
          "fill-extrusion-color": "#C9BFB7",
          "fill-extrusion-height": ["-", ["get", "height"], 0.3],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.95,
          "fill-extrusion-vertical-gradient": true,
        },
      });
      // Roof caps: a thin slab on top so roofs read lighter than walls.
      map.addLayer({ id: "pup-roof", type: "fill-extrusion", source: "pup-buildings", paint: { "fill-extrusion-color": "#E9E2DC", "fill-extrusion-base": ["-", ["get", "height"], 0.3], "fill-extrusion-height": ["get", "height"], "fill-extrusion-opacity": 1, "fill-extrusion-vertical-gradient": false } });
      map.addLayer({ id: "pup-roof-sel", type: "fill-extrusion", source: "pup-buildings", filter: ["==", ["get", "osm"], ""], paint: { "fill-extrusion-color": "#8B0000", "fill-extrusion-base": ["-", ["get", "height"], 0.29], "fill-extrusion-height": ["+", ["get", "height"], 0.02], "fill-extrusion-opacity": 0.8, "fill-extrusion-vertical-gradient": false } });
      map.addLayer({ id: "pup-walk-case", type: "line", source: "pup-walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 12 } });
      map.addLayer({ id: "pup-walk", type: "line", source: "pup-walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#8B0000", "line-width": 6 } });
      map.addSource("pup-wings", { type: "geojson", data: campus.wingLabels });
      map.addLayer({ id: "pup-wings", type: "symbol", source: "pup-wings", minzoom: 17.6, layout: { "text-field": ["upcase", ["get", "name"]], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-letter-spacing": 0.08, "text-padding": 16 }, paint: { "text-color": "#6B5E57", "text-halo-color": "#ffffff", "text-halo-width": 1.5 } });
      map.addLayer({
        id: "pup-names",
        type: "symbol",
        source: "pup-buildings",
        filter: ["!=", ["get", "name"], null],
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["case", ["get", "main"], 14, 11], "text-max-width": 8, "text-allow-overlap": false, "symbol-z-order": "source" },
        paint: { "text-color": ["case", ["get", "main"], "#5c0000", "#1f1a1a"], "text-halo-color": "#ffffff", "text-halo-width": 2 },
      });
      map.on("click", "pup-3d", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const full = S.campus.buildings.features.find((x) => x.properties.osm === f.properties.osm);
        if (full) selectBuilding(full);
      });
      map.on("mouseenter", "pup-3d", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "pup-3d", () => (map.getCanvas().style.cursor = ""));
      map.on("rotate", syncCompass);
      syncCompass();
      marker(campus.gate.lngLat, "#1b6e3f", "Main gate").addTo(map);
      // Entrance: dot plus a label below it that gives way to the building names (6px collision margin).
      map.addSource("pup-entrance", { type: "geojson", data: { type: "Feature", properties: { label: "Main entrance ?" }, geometry: { type: "Point", coordinates: campus.entrance.lngLat } } });
      map.addLayer({ id: "pup-entrance-dot", type: "circle", source: "pup-entrance", paint: { "circle-radius": 6, "circle-color": "#FFC72C", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 } }, "pup-names");
      map.addLayer({ id: "pup-entrance-label", type: "symbol", source: "pup-entrance", layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-variable-anchor": ["top", "bottom", "right", "left"], "text-radial-offset": 0.9, "text-padding": 6, "text-allow-overlap": false, "text-optional": true }, paint: { "text-color": "#1f1a1a", "text-halo-color": "#ffffff", "text-halo-width": 2 } }, "pup-names");
      map.once("idle", () => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve();
        }
      });
    });
  });
}
function highlight(f) {
  if (!map || !map.getLayer("pup-roof-sel")) return;
  const id = f ? f.properties.osm : "";
  map.setFilter("pup-roof-sel", ["==", ["get", "osm"], id]);
  map.setFilter("pup-roof", ["!=", ["get", "osm"], id]);
}
function syncCompass() {
  const b = map ? map.getBearing() : 0;
  const c = $("compass");
  c.hidden = S.inside || Math.abs(b) < 0.5;
  c.firstElementChild.style.transform = `rotate(${-b}deg)`;
  const fl = $("floors");
  c.style.top = fl.hidden ? "" : `${fl.getBoundingClientRect().bottom + 10}px`;
}
function drawOutdoor() {
  if (!map || !map.getSource("pup-walk")) return;
  const leg = S.route && S.route.legs.find((l) => l.floorId === "outdoor");
  const cur = S.route && S.step >= 0 && S.route.steps[S.step].floorId === "outdoor";
  map.setPaintProperty("pup-walk", "line-opacity", cur ? 1 : 0.35);
  map.setPaintProperty("pup-walk-case", "line-opacity", cur ? 1 : 0.35);
  map.getSource("pup-walk").setData({
    type: "FeatureCollection",
    features: leg ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: leg.points.map((p) => [p.x, p.y]) } }] : [],
  });
}

// Route line in screen pixels: 6px brand red over a 3px white casing.
function drawLine(root, pts, current) {
  const p = pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const g = svg("g", { opacity: current ? 1 : 0.35 });
  const base = { points: p, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" };
  g.append(svg("polyline", { ...base, stroke: "#fff", "stroke-width": 12 }), svg("polyline", { ...base, stroke: "#8B0000", "stroke-width": 6, class: "route-line" }));
  root.append(g);
}

// ---------- indoor ----------
function tf(floorId) {
  const a = S.paths.floors[floorId].aspect;
  return (x, y) => {
    const X = x * 1000;
    const Y = (y * 1000) / a;
    return ROTATE[floorId] ? { x: Y, y: -X } : { x: X, y: Y };
  };
}
function untf(floorId, X, Y) {
  const a = S.paths.floors[floorId].aspect;
  const [x, y] = ROTATE[floorId] ? [-Y, X] : [X, Y];
  return { x: x / 1000, y: (y * a) / 1000 };
}
function floorBox(floorId) {
  const t = tf(floorId);
  return bbox(S.paths.floors[floorId].nodes.map((n) => t(n.x, n.y)), 50);
}
function shortLabel(r) {
  const m = /\(([A-Z]+\d+[A-Z]?\??)\)$/.exec(r.label);
  if (m) return m[1];
  const c = /^Classroom (\d+)$/.exec(r.label);
  if (c) return c[1];
  if (/Dome/.test(r.label)) return "Dome";
  const t = r.label.replace(/\s*\(.*\)$/, "");
  return t.length > 14 ? t.slice(0, 13) + "…" : t;
}

function drawIndoor(floorId) {
  const root = $("indoor");
  root.replaceChildren();
  const f = S.paths.floors[floorId];
  const t = tf(floorId);
  const N = new Map(f.nodes.map((n) => [n.id, { ...n, ...t(n.x, n.y) }]));
  // Building mass: corridors drawn wide enough to cover the rooms beside them.
  const offs = f.rooms.map((r) => { const a = N.get(r.id); const b = N.get(r.node); return Math.hypot(a.x - b.x, a.y - b.y); }).sort((x, y) => x - y);
  const reach = Math.min(70, offs.length ? offs[Math.floor(offs.length * 0.9)] : 30);
  const width = 2 * reach + 34;
  const mass = svg("g");
  const halls = svg("g");
  for (const [a, b] of f.edges) {
    const A = N.get(a);
    const B = N.get(b);
    if (A.kind !== "corridor" || B.kind !== "corridor") continue;
    const seg = { x1: A.x, y1: A.y, x2: B.x, y2: B.y, "stroke-linecap": "round" };
    mass.append(svg("line", { ...seg, stroke: "#D9CFC8", "stroke-width": width + 2 }));
    halls.append(svg("line", { ...seg, stroke: "#F3EDE8", "stroke-width": width }));
  }
  const corr = svg("g");
  for (const [a, b] of f.edges) {
    const A = N.get(a);
    const B = N.get(b);
    if (A.kind === "corridor" && B.kind === "corridor") corr.append(svg("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: "#efe6e1", "stroke-width": 18, "stroke-linecap": "round" }));
  }
  root.append(mass, halls, corr);

  const st = S.stairs.floors[floorId].stairs;
  const wings = [];
  for (const [name, ids] of WINGS) {
    const ps = ids.filter((id) => st[id]).map((id) => t(st[id].x, st[id].y));
    if (ps.length < 2) continue;
    wings.push({ text: name.toUpperCase(), p: { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 } });
  }

  const leg = S.route ? S.route.legs.find((l) => l.floorId === floorId) : null;
  const onLeg = new Set(leg ? leg.points.map((q) => `${q.x.toFixed(5)},${q.y.toFixed(5)}`) : []);
  const labels = [];
  const destId = S.sel && S.sel.room ? S.sel.room.id : null;
  const rooms = svg("g");
  const seen = new Set();
  let dest = null;
  for (const r of f.rooms) {
    const key = `${r.x},${r.y}`;
    const isDest = r.id === destId;
    if (seen.has(key) && !isDest) continue;
    seen.add(key);
    const p = t(r.x, r.y);
    const lab = shortLabel(r);
    const w = lab.length > 5 ? Math.max(44, lab.length * 4.6) : 34;
    const g = svg("g", { class: "room" });
    g.append(svg("rect", { x: p.x - w / 2, y: p.y - 9, width: w, height: 18, rx: 4, class: `r-tile${r.flag ? " unsure" : ""}${isDest ? " dest" : ""}` }));
    const n = f.nodes.find((x) => x.id === r.node);
    const route = n && onLeg.has(`${n.x.toFixed(5)},${n.y.toFixed(5)}`);
    labels.push({ text: lab, p, prio: isDest ? 0 : route ? 2 : 3 });
    g.append(svg("title", {}, roomName(r)));
    g.addEventListener("click", (e) => {
      if (EDIT) return;
      e.stopPropagation();
      selectRoom({ ...r, floorId });
    });
    rooms.append(g);
    if (isDest) dest = p;
  }
  root.append(rooms);
  const stairs = Object.entries(st).map(([id, q]) => ({ id, p: t(q.x, q.y), name: (S.stairs.stairs.find((s) => s.id === id) || {}).name || id }));
  if (leg) {
    const cur = S.step >= 0 && S.route.steps[S.step].floorId === floorId;
    drawLine(root, leg.points.map((q) => t(q.x, q.y)), cur);
  }
  const indoorLegs = S.route ? S.route.legs.filter((l) => l.floorId !== "outdoor") : [];
  const startFloor = indoorLegs.length ? indoorLegs[0].floorId : S.floors[0].id;
  const start = f.start && floorId === startFloor ? N.get(f.start) : null;
  const arrive = leg && leg.arrive && floorId !== startFloor ? { p: t(leg.points[0].x, leg.points[0].y), text: `Arrive ${floorShort(S.floors.find((x) => x.id === floorId))} · ${leg.arrive}` } : null;
  const lab = svg("g", { id: "labs" });
  // icons and labels sit under the route line so a short leg is never hidden by its own stairs icon
  const line = root.querySelector("g[opacity]");
  if (line) root.insertBefore(lab, line);
  else root.append(lab);
  root.append(svg("g", { id: "over" }));
  S.ix = { floorId, wings, labels, stairs, start, startText: floorId === S.floors[0].id ? "You are here (entrance)" : "You are here", legStart: leg && !arrive ? t(leg.points[0].x, leg.points[0].y) : null, arrive, dest, destText: S.sel && S.sel.room ? shortLabel(S.sel.room) : "" };
  queueLabels();
}

// Indoor zoom: 18 when the whole floor fits, plus one per doubling, so "zoom 19" means 2x the fit.
function indoorZoom() {
  if (!S.floorId || !S.cam.indoor) return 18;
  return 18 + Math.log2(fitCam(floorBox(S.floorId)).w / S.cam.indoor.w);
}
let labelQueued = false;
function queueLabels() {
  if (labelQueued) return;
  labelQueued = true;
  requestAnimationFrame(() => {
    labelQueued = false;
    drawLabels();
  });
}
function drawLabels() {
  const g = document.getElementById("labs");
  const pin = $("pin");
  if (!g || !S.ix || !S.cam.indoor) {
    pin.hidden = true;
    return;
  }
  g.replaceChildren();
  const c = S.cam.indoor;
  const u = c.w / innerWidth; // units per screen px
  const scr = (p) => ({ x: (p.x - c.x) / u, y: (p.y - c.y) / u });
  const z = indoorZoom();
  document.body.dataset.izoom = z.toFixed(2);
  const taken = [];
  const free = (b) => !taken.some((o) => b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h);
  const ix = S.ix;
  if (ix.dest) {
    const d = scr(ix.dest);
    taken.push({ x: d.x - 14, y: d.y - 40, w: 28, h: 40 });
    if (z >= 19 && ix.destText) {
      const w = ix.destText.length * 8 + 4;
      taken.push({ x: d.x + 16, y: d.y - 34, w, h: 18 });
      g.append(svg("text", { x: ix.dest.x + 18 * u, y: ix.dest.y - 25 * u, class: "r-lab dest", style: `font-size:${13 * u}px;font-weight:800;text-anchor:start;stroke-width:${3 * u}px` }, ix.destText));
    }
  }
  const arr = $("arrive");
  arr.hidden = !(S.inside && ix.arrive);
  if (ix.arrive) {
    const a = scr(ix.arrive.p);
    arr.querySelector("span").textContent = ix.arrive.text;
    // desktop: keep the chip clear of the side panel (panel width plus 16px)
    const panel = innerWidth >= 900 && !$("sheet").hidden ? $("sheet").getBoundingClientRect().right + 16 : 0;
    a.x = Math.max(a.x, panel - 8);
    arr.style.transform = `translate(${a.x + 8}px, ${a.y + 8}px)`;
    const r = arr.getBoundingClientRect();
    taken.push({ x: a.x + 8, y: a.y + 8, w: r.width || 160, h: r.height || 26 });
  }
  // stairs icons, fixed 20px, drawn above the route line
  const over = document.getElementById("over");
  if (over) over.replaceChildren();
  for (const s of ix.stairs) {
    const q = scr(s.p);
    const b = { x: q.x - 9, y: q.y - 9, w: 18, h: 18 };
    if (z >= 19 && !free(b)) continue;
    taken.push(b);
    let k = u;
    const sg = svg("g", { class: "stair" });
    k *= 20 / 18;
    sg.append(svg("rect", { x: s.p.x - 9 * k, y: s.p.y - 9 * k, width: 18 * k, height: 18 * k, rx: 3 * k, fill: "#1f1a1a" }));
    sg.append(svg("path", { d: `M${s.p.x - 5 * k} ${s.p.y + 5 * k} h${4 * k} v${-4 * k} h${4 * k} v${-4 * k} h${3 * k}`, fill: "none", stroke: "#fff", "stroke-width": 1.8 * k }));
    sg.append(svg("title", {}, s.name));
    (over || g).append(sg);
  }
  const dot = (p, color) => g.append(svg("circle", { cx: p.x, cy: p.y, r: 8 * u, fill: color, stroke: "#fff", "stroke-width": 3 * u }));
  if (ix.start) {
    dot(ix.start, "#1b6e3f");
    const q = scr(ix.start);
    taken.push({ x: q.x - 9, y: q.y - 9, w: 18, h: 18 });
  }
  if (ix.legStart) dot(ix.legStart, "#1b6e3f");
  if (z < 19) {
    for (const w of ix.wings) {
      const q = scr(w.p);
      const bw = w.text.length * 9;
      const box = { x: q.x - bw / 2, y: q.y - 9, w: bw, h: 18 };
      // nudge below a stair icon instead of drawing over it
      const y = free(box) ? w.p.y : w.p.y + 22 * u;
      // text padding 16px: keep the whole label on screen
      const half = bw / 2 + 16;
      const sx = Math.max(half, Math.min(innerWidth - half, q.x));
      g.append(svg("text", { x: c.x + sx * u, y, class: "w-name", style: `font-size:${13 * u}px;letter-spacing:${0.08 * 13 * u}px` }, w.text));
    }
  } else {
    const order = [...ix.labels].sort((a, b) => a.prio - b.prio);
    for (const l of order) {
      if (l.prio === 0 && ix.destText) continue;
      const q = scr(l.p);
      const w = l.text.length * 6.4 + 6;
      const b = { x: q.x - w / 2, y: q.y - 8, w, h: 16 };
      if (!free(b)) continue;
      taken.push(b);
      g.append(svg("text", { x: l.p.x, y: l.p.y, class: `r-lab${l.prio === 0 ? " dest" : ""}`, style: `font-size:${11 * u}px;stroke-width:${3 * u}px` }, l.text));
    }
  }
  if (ix.start) {
    const q = scr(ix.start);
    // label goes left when the nearest stairs are to the right
    const near = ix.stairs.reduce((m, s) => (!m || Math.hypot(s.p.x - ix.start.x, s.p.y - ix.start.y) < Math.hypot(m.p.x - ix.start.x, m.p.y - ix.start.y) ? s : m), null);
    const left = near && near.p.x > ix.start.x;
    const w = ix.startText.length * 6.4;
    const b = { x: left ? q.x - 12 - w : q.x + 12, y: q.y - 8, w, h: 16 };
    if (free(b)) g.append(svg("text", { x: ix.start.x + (left ? -13 : 13) * u, y: ix.start.y + 4 * u, class: "b-lab", style: `font-size:${11 * u}px;fill:#1b6e3f;stroke-width:${3 * u}px;text-anchor:${left ? "end" : "start"}` }, ix.startText));
  }
  pin.hidden = !(S.inside && ix.dest);
  if (ix.dest) {
    const d = scr(ix.dest);
    pin.style.transform = `translate(${d.x}px, ${d.y}px)`;
  }
}

function drawFloorTabs() {
  const nav = $("floors");
  nav.replaceChildren();
  for (const f of [...S.floors].reverse()) {
    if (!S.paths.floors[f.id]) continue;
    const b = el("button", { type: "button", "aria-pressed": String(f.id === S.floorId) }, floorShort(f));
    if (S.route) {
      const indoor = S.route.legs.filter((l) => l.floorId !== "outdoor");
      const cap = indoor[0] && indoor[0].floorId === f.id ? "Start" : indoor.at(-1) && indoor.at(-1).floorId === f.id ? "Goal" : "";
      if (cap) b.append(el("small", {}, cap));
    }
    b.addEventListener("click", () => showFloor(f.id));
    nav.append(b);
  }
}

// ---------- transitions ----------
function axisBearing() {
  // Long axis of the Main Building: up the screen on a phone, across on a wide screen.
  const az = S.campus.mainBearing || 0;
  let b = innerWidth < innerHeight ? az : az - 90;
  while (b > 90) b -= 180;
  while (b < -90) b += 180;
  return b;
}
const FLY_IN = 1400;
async function enterBuilding(floorId) {
  const prev = S.floorId;
  S.floorId = floorId;
  if (!S.inside) {
    stage("zooming");
    highlight(mainFeatures()[0]);
    const fade = async () => {
      stage("crossfade");
      const chip = $("where");
      // selected roof red fades out over the first 200ms of the crossfade
      if (map && map.getLayer("pup-roof-sel")) {
        map.setPaintProperty("pup-roof-sel", "fill-extrusion-opacity-transition", { duration: RM ? 0 : 200 * SLOW, delay: 0 });
        map.setPaintProperty("pup-roof-sel", "fill-extrusion-opacity", 0);
      }
      if (!RM) await chip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 * SLOW, fill: "forwards" }).finished;
      drawIndoor(floorId);
      setCam("indoor", fitCam(floorBox(floorId)));
      S.inside = true;
      document.body.classList.add("inside");
      $("back").hidden = false;
      $("floors").hidden = false;
      syncCompass();
      await wait(350);
      const f0 = S.floors.find((x) => x.id === floorId);
      chip.textContent = `PUP Main Building · ${floorShort(f0)}`;
      if (!RM) await chip.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 * SLOW, fill: "forwards" }).finished;
    };
    if (map && !RM) {
      const [[w, so], [e, n]] = lngLatBox(mainCoords());
      const flight = flyTo({ center: [(w + e) / 2, (so + n) / 2], zoom: 18.6, pitch: 0, bearing: axisBearing(), duration: FLY_IN, curve: 1.4 });
      await wait(FLY_IN * 0.7);
      await Promise.all([flight, fade()]);
    } else {
      await fade();
    }
  } else {
    drawIndoor(floorId);
    if (prev && prev !== floorId && !RM) {
      const order = S.floors.map((x) => x.id);
      const dir = order.indexOf(floorId) > order.indexOf(prev) ? 1 : -1;
      $("indoor").animate([{ opacity: 0, transform: `translateY(${8 * dir}px)` }, { opacity: 1, transform: "none" }], { duration: 220 * SLOW, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }
  drawFloorTabs();
  const f = S.floors.find((x) => x.id === floorId);
  $("where").textContent = `PUP Main Building · ${floorShort(f)}`;
  stage("indoor");
}
async function exitBuilding() {
  if (map && map.getLayer("pup-roof-sel")) map.setPaintProperty("pup-roof-sel", "fill-extrusion-opacity", 0.8);
  if (!S.inside) return;
  stage("leaving");
  drawOutdoor();
  S.inside = false;
  document.body.classList.remove("inside");
  $("back").hidden = true;
  $("floors").hidden = true;
  $("pin").hidden = true;
  $("arrive").hidden = true;
  $("where").textContent = "PUP Main · Sta. Mesa";
  if (map) await fitTo(featCoords(S.campus.campus), { pitch: 55, maxZoom: 17.2, duration: 900 });
  syncCompass();
  stage("outdoor");
}
async function showFloor(floorId) {
  await enterBuilding(floorId);
  focusIndoor();
}
function focusIndoor() {
  const t = tf(S.floorId);
  const leg = S.route ? S.route.legs.find((l) => l.floorId === S.floorId) : null;
  if (leg && leg.points.length) {
    const pts = leg.points.map((q) => t(q.x, q.y));
    const last = S.route.steps.length - 1;
    if (S.step === last && S.floorId === S.route.legs.at(-1).floorId && S.sel && S.sel.room) {
      // goal: the destination wing at about zoom 20.5, pin in the middle of the free area
      const d = t(S.sel.room.x, S.sel.room.y);
      return tween("indoor", fitCamPad({ x: d.x - 1, y: d.y - 1, w: 2, h: 2 }, legPad(), GOAL_ZOOM), 600, EASE_IO);
    }
    return tween("indoor", fitCamPad(bbox(pts, 0), legPad(), LEG_MAX_ZOOM), 600, EASE_IO);
  }
  if (S.sel && S.sel.room && S.sel.room.floorId === S.floorId) {
    const p = t(S.sel.room.x, S.sel.room.y);
    return tween("indoor", fitCam({ x: p.x - 150, y: p.y - 150, w: 300, h: 300 }), 500);
  }
  return tween("indoor", fitCam(floorBox(S.floorId)), 400);
}

// ---------- sheet ----------
function openSheet({ crumb, title, sub, flag, inside }) {
  $("crumb").textContent = crumb;
  $("title").textContent = title;
  $("sub").textContent = sub;
  $("flag").hidden = !flag;
  $("flag").textContent = flag || "";
  $("inside").hidden = !inside;
  $("dir").hidden = false;
  $("steps").hidden = true;
  $("stepnav").hidden = true;
  $("sheet").hidden = false;
  setSnap("half");
}
// Bottom sheet snaps: peek 132px, half 50vh, full 88vh.
const SNAPS = ["peek", "half", "full"];
function snapPx(name = $("sheet").dataset.snap) {
  return name === "peek" ? PEEK : name === "full" ? innerHeight * 0.88 : innerHeight * 0.5;
}
function setSnap(name) {
  $("sheet").dataset.snap = name;
  syncSheet();
}
function syncSheet() {
  const h = $("sheet").hidden ? 0 : snapPx();
  document.documentElement.style.setProperty("--sheet-h", innerWidth >= 900 ? "0px" : `${h}px`);
}
function setupSheet() {
  const sh = $("sheet");
  let y0 = null;
  sh.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button:not(.handle)") || (sh.scrollTop > 0 && !e.target.closest(".handle"))) return;
    y0 = e.clientY;
  });
  const end = (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0;
    y0 = null;
    const i = SNAPS.indexOf(sh.dataset.snap);
    if (dy > 40) setSnap(SNAPS[Math.max(0, i - 1)]);
    else if (dy < -40) setSnap(SNAPS[Math.min(2, i + 1)]);
  };
  sh.addEventListener("pointerup", end);
  sh.addEventListener("pointercancel", () => (y0 = null));
  $("handle").addEventListener("click", () => setSnap(SNAPS[(SNAPS.indexOf(sh.dataset.snap) + 1) % 3]));
}
function closeSheet() {
  $("sheet").hidden = true;
  S.sel = null;
  S.route = null;
  S.step = -1;
  syncSheet();
  highlight(null);
  if (S.inside) drawIndoor(S.floorId);
  else drawOutdoor();
  if (S.inside) drawFloorTabs();
}

async function selectRoom(room) {
  S.sel = { room };
  S.route = null;
  const f = S.floors.find((x) => x.id === room.floorId);
  openSheet({
    crumb: "PUP Main Building",
    title: roomName(room).replace(/^Classroom (\d+) \((.*)\)$/, "Room $1"),
    sub: `${floorShort(f)}${room.wing ? " · " + room.wing : ""} · PUP Main Building`,
    flag: room.flag ? "This label has a ? on the directory poster. Not confirmed." : "",
  });
  await enterBuilding(room.floorId);
  await focusIndoor();
}
async function selectBuilding(f) {
  S.sel = { building: f };
  S.route = null;
  drawOutdoor();
  const p = f.properties;
  if (p.main) openSheet({ crumb: "PUP Main · Sta. Mesa", title: "PUP Main Building", sub: "Floors 1F, 4F, 5F mapped inside", inside: true, flag: `Main entrance ? ${S.campus.entrance.note.replace(/^\?\s*/, "")}` });
  else openSheet({ crumb: "PUP Main · Sta. Mesa", title: p.name || "Unnamed building ?", sub: "No floor plan yet" });
  $("dir").hidden = true;
  if (S.inside) await exitBuilding();
  highlight(f);
  if (map) await fitTo(p.main ? mainCoords() : featCoords(f), { maxZoom: 18.6 });
}

function directions() {
  if (!S.sel || !S.sel.room) return;
  const r = planCampusRoute(S.paths, S.stairs, S.floors, S.campus, S.sel.room.id);
  const list = $("steps");
  list.replaceChildren();
  if (!r.ok) {
    $("flag").hidden = false;
    $("flag").textContent = r.message;
    return;
  }
  S.route = r;
  r.steps.forEach((s, i) => {
    const f = S.floors.find((x) => x.id === s.floorId);
    const b = el("button", { type: "button", "data-n": String(i + 1) });
    b.append(document.createTextNode(s.text), el("span", { class: "fl" }, s.floorId === "outdoor" ? "Campus" : floorShort(f)));
    b.addEventListener("click", () => goStep(i));
    const li = el("li");
    li.append(b);
    list.append(li);
  });
  list.hidden = false;
  $("stepnav").hidden = false;
  $("dir").hidden = true;
  setSnap("peek");
  return goStep(0);
}
async function goStep(i) {
  if (!S.route) return;
  const n = S.route.steps.length;
  S.step = Math.max(0, Math.min(n - 1, i));
  document.querySelectorAll("#steps button").forEach((b, j) => (j === S.step ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
  $("prev").disabled = S.step === 0;
  $("next").textContent = S.step === n - 1 ? "Done" : "Next step";
  const cur = document.querySelector('#steps button[aria-current="step"]');
  if (cur) cur.scrollIntoView({ block: "nearest" });
  const s = S.route.steps[S.step];
  if (s.floorId === "outdoor") {
    if (S.inside) await exitBuilding();
    drawOutdoor();
    const leg = S.route.legs[0];
    if (map) await fitLeg(leg.points.map((q) => [q.x, q.y]));
    return;
  }
  await enterBuilding(s.floorId);
  drawIndoor(s.floorId);
  await focusIndoor();
}

// ---------- search ----------
function searchAll(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const rooms = S.rooms.filter((r) => roomName(r).toLowerCase().includes(s)).map((r) => ({ type: "room", r }));
  const bs = S.campus.buildings.features.filter((f) => f.properties.name && buildingName(f).toLowerCase().includes(s)).map((b) => ({ type: "building", b }));
  if (!bs.some((x) => x.b.properties.main) && S.campus.wingLabels.features.some((w) => w.properties.name.toLowerCase().includes(s))) bs.unshift({ type: "building", b: mainFeatures()[0] });
  return [...rooms, ...bs].slice(0, 40);
}
function renderResults() {
  const q = $("q").value;
  $("clear").hidden = !q;
  const list = $("results");
  list.replaceChildren();
  if (!q.trim()) {
    list.hidden = true;
    return;
  }
  const hits = searchAll(q);
  list.hidden = false;
  if (!hits.length) {
    list.append(el("li", { class: "empty" }, `"${q.trim()}" is not on the map yet.`));
    return;
  }
  for (const h of hits) {
    const b = el("button", { type: "button" });
    const box = el("span");
    if (h.type === "room") {
      const f = S.floors.find((x) => x.id === h.r.floorId);
      b.append(el("span", { class: "ic" }, floorShort(f)));
      box.append(el("b", {}, roomName(h.r)), el("small", {}, `PUP Main Building · ${floorShort(f)}${h.r.flag ? " · not confirmed" : ""}`));
      b.addEventListener("click", () => pick(() => selectRoom(h.r)));
    } else {
      b.append(el("span", { class: "ic b" }, "B"));
      box.append(el("b", {}, buildingName(h.b)), el("small", {}, h.b.properties.main ? "PUP Main Building · floor plans" : "Building · OpenStreetMap"));
      b.addEventListener("click", () => pick(() => selectBuilding(h.b)));
    }
    b.append(box);
    const li = el("li");
    li.append(b);
    list.append(li);
  }
}
function pick(fn) {
  $("results").hidden = true;
  $("q").blur();
  fn();
}

// ---------- pan and zoom ----------
function zoomBy(k, cx, cy) {
  if (!S.inside) {
    if (map) map.zoomTo(map.getZoom() + Math.log2(k), { duration: 250 });
    return;
  }
  const name = "indoor";
  const c = S.cam[name];
  const px = cx === undefined ? 0.5 : cx / innerWidth;
  const py = cy === undefined ? 0.5 : cy / innerHeight;
  const w = c.w / k;
  const h = c.h / k;
  setCam(name, { x: c.x + (c.w - w) * px, y: c.y + (c.h - h) * py, w, h });
}
function setupGestures() {
  const vp = $("indoor");
  const pts = new Map();
  let last = null;
  let moved = false;
  vp.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    last = null;
  });
  vp.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const name = "indoor";
    const c = S.cam[name];
    if (pts.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 0) moved = moved || Math.hypot(dx, dy) > 3;
      if (!moved) return;
      const s = c.w / innerWidth;
      setCam(name, { ...c, x: c.x - dx * s, y: c.y - dy * s });
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (last) zoomBy(d / last, (a.x + b.x) / 2, (a.y + b.y) / 2);
      last = d;
      moved = true;
    }
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) last = null;
  };
  vp.addEventListener("pointerup", up);
  vp.addEventListener("pointercancel", up);
  vp.addEventListener("click", (e) => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }, { passive: false });
  if (EDIT) {
    $("indoor").addEventListener("click", (e) => {
      const c = S.cam.indoor;
      const X = c.x + (e.clientX / innerWidth) * c.w;
      const Y = c.y + (e.clientY / innerHeight) * c.h;
      const p = untf(S.floorId, X, Y);
      console.log(`${S.floorId} x=${p.x.toFixed(4)} y=${p.y.toFixed(4)}`);
    });
  }
}

// ---------- boot ----------
async function load() {
  const [floors, paths, stairs, campus] = await Promise.all(
    ["data/floors.json", "data/paths.json", "data/stairs.json", "data/campus-osm.json"].map((u) => fetch(u).then((r) => r.json()))
  );
  Object.assign(S, { floors, paths, stairs, campus, rooms: allRooms(paths) });
  setCam("indoor", { x: 0, y: 0, w: 1000, h: 1000 });
  if (window.maplibregl) await initMap();
  if (SLOW > 1) document.body.classList.add("slow");

  $("q").addEventListener("input", renderResults);
  $("q").addEventListener("focus", renderResults);
  $("clear").addEventListener("click", () => {
    $("q").value = "";
    renderResults();
    $("q").focus();
  });
  $("back").addEventListener("click", () => {
    if (S.route && S.step > 0) return goStep(0);
    return exitBuilding();
  });
  $("close").addEventListener("click", closeSheet);
  setupSheet();
  $("compass").addEventListener("click", () => map && (RM ? map.jumpTo({ bearing: 0 }) : map.easeTo({ bearing: 0, duration: 300 * SLOW })));
  $("dir").addEventListener("click", directions);
  $("inside").addEventListener("click", () => showFloor(floors[0].id));
  $("prev").addEventListener("click", () => goStep(S.step - 1));
  $("next").addEventListener("click", () => (S.step === S.route.steps.length - 1 ? closeSheet() : goStep(S.step + 1)));
  $("zoomIn").addEventListener("click", () => zoomBy(1.4));
  $("zoomOut").addEventListener("click", () => {
    const c = S.cam.indoor;
    if (S.inside && c.w > floorBox(S.floorId).w * 1.6) return exitBuilding();
    zoomBy(1 / 1.4);
  });
  addEventListener("resize", () => {
    syncSheet();
    syncCompass();
    if (S.inside) setCam("indoor", fitCam(floorBox(S.floorId)));
  });
  setupGestures();

  if (params.get("q")) {
    $("q").value = params.get("q");
    renderResults();
  }
  const to = params.get("to");
  if (to) {
    const r = S.rooms.find((x) => x.id === to);
    if (r) {
      await selectRoom(r);
      if (params.get("dir") === "1") {
        await directions();
        if (params.get("step")) await goStep(Number(params.get("step")) - 1);
      }
    }
  } else if (params.get("floor")) {
    await showFloor(params.get("floor"));
  } else if (params.get("b")) {
    const f = S.campus.buildings.features.find((x) => x.properties.osm === params.get("b"));
    if (f) await selectBuilding(f);
  }
  document.body.dataset.ready = "1";
}
load();
