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
const wait = (ms) => new Promise((r) => setTimeout(r, ms * SLOW));
const stage = (s) => (document.body.dataset.stage = s);

// ---------- camera ----------
function layerOf(name) { return $(name); }
function setCam(name, c) {
  S.cam[name] = c;
  layerOf(name).setAttribute("viewBox", `${c.x} ${c.y} ${c.w} ${c.h}`);
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
  const bottom = !desk && open ? sheet.offsetHeight + 12 : 16;
  return { W, H, top, left, right, bottom };
}
function fitCam(box) {
  const { W, H, top, left, right, bottom } = insets();
  const aw = Math.max(80, W - left - right);
  const ah = Math.max(80, H - top - bottom);
  const s = Math.min(aw / box.w, ah / box.h);
  return { x: box.x + box.w / 2 - (left + aw / 2) / s, y: box.y + box.h / 2 - (top + ah / 2) / s, w: W / s, h: H / s };
}
function tween(name, to, ms) {
  const from = S.cam[name] || to;
  const dur = ms * SLOW;
  return new Promise((done) => {
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
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
const flyDur = (ms) => ms * SLOW;
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
    const t = setTimeout(r, flyDur(ms) + 400);
    map.once("moveend", () => {
      clearTimeout(t);
      r();
    });
  });
}
async function flyTo(opts) {
  const done = moveDone(opts.duration || 1400);
  const p = mapPadding();
  map.flyTo({ ...opts, padding: { top: p.top, left: p.left, right: p.right, bottom: p.bottom }, duration: flyDur(opts.duration || 1400), curve: 1.3, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), essential: true });
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
          "fill-extrusion-color": ["case", ["boolean", ["feature-state", "sel"], false], "#ffcc00", ["get", "main"], "#a32626", ["==", ["get", "name"], null], "#d8d0cb", "#e3d5cc"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.92,
        },
      });
      map.addLayer({ id: "pup-walk-case", type: "line", source: "pup-walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 9 } });
      map.addLayer({ id: "pup-walk", type: "line", source: "pup-walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#880000", "line-width": 5, "line-dasharray": [1.4, 1] } });
      map.addLayer({
        id: "pup-names",
        type: "symbol",
        source: "pup-buildings",
        filter: ["!=", ["get", "name"], null],
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["case", ["get", "main"], 14, 11], "text-max-width": 8, "text-allow-overlap": false },
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
      marker(campus.gate.lngLat, "#1b6e3f", "Main gate").addTo(map);
      marker(campus.entrance.lngLat, "#ffcc00", "Entrance ?").addTo(map);
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
let selId = null;
function highlight(f) {
  if (!map || !map.getSource("pup-buildings")) return;
  if (selId) map.setFeatureState({ source: "pup-buildings", id: selId }, { sel: false });
  selId = f ? f.properties.osm : null;
  if (selId) map.setFeatureState({ source: "pup-buildings", id: selId }, { sel: true });
}
function drawOutdoor() {
  if (!map || !map.getSource("pup-walk")) return;
  const leg = S.route && S.route.legs.find((l) => l.floorId === "outdoor");
  map.getSource("pup-walk").setData({
    type: "FeatureCollection",
    features: leg ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: leg.points.map((p) => [p.x, p.y]) } }] : [],
  });
}

function drawLine(root, pts, width, dash) {
  const p = pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  root.append(
    svg("polyline", { points: p, fill: "none", stroke: "#fff", "stroke-width": width * 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    svg("polyline", { points: p, fill: "none", stroke: "#880000", "stroke-width": width, "stroke-dasharray": `${dash * 2.4} ${dash * 1.4}`, "stroke-linecap": "round", "stroke-linejoin": "round", class: "route-line" })
  );
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
    mass.append(svg("line", { ...seg, stroke: "#cdbfb8", "stroke-width": width + 6 }));
    halls.append(svg("line", { ...seg, stroke: "#fffdfb", "stroke-width": width }));
  }
  const corr = svg("g");
  for (const [a, b] of f.edges) {
    const A = N.get(a);
    const B = N.get(b);
    if (A.kind === "corridor" && B.kind === "corridor") corr.append(svg("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: "#efe6e1", "stroke-width": 18, "stroke-linecap": "round" }));
  }
  root.append(mass, halls, corr);

  const st = S.stairs.floors[floorId].stairs;
  const names = svg("g");
  for (const [name, ids] of WINGS) {
    const ps = ids.filter((id) => st[id]).map((id) => t(st[id].x, st[id].y));
    if (ps.length < 2) continue;
    const mx = (ps[0].x + ps[1].x) / 2;
    const my = (ps[0].y + ps[1].y) / 2;
    names.append(svg("text", { x: mx, y: my, class: "w-name" }, name.toUpperCase()));
  }
  root.append(names);

  const leg = S.route ? S.route.legs.find((l) => l.floorId === floorId) : null;
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
    const long = lab.length > 5;
    const w = long ? Math.max(44, lab.length * 4.6) : 34;
    const g = svg("g", { class: "room" });
    g.append(svg("rect", { x: p.x - w / 2, y: p.y - 9, width: w, height: 18, rx: 4, class: `r-tile${r.flag ? " unsure" : ""}${isDest ? " dest" : ""}` }));
    g.append(svg("text", { x: p.x, y: p.y, class: `r-lab${long ? " long" : ""}${isDest ? " dest" : ""}` }, lab));
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
  for (const [id, q] of Object.entries(st)) {
    const p = t(q.x, q.y);
    const g = svg("g");
    g.append(svg("rect", { x: p.x - 9, y: p.y - 9, width: 18, height: 18, rx: 3, fill: "#1f1a1a" }));
    g.append(svg("path", { d: `M${p.x - 5} ${p.y + 5} h4 v-4 h4 v-4 h3`, fill: "none", stroke: "#fff", "stroke-width": 1.8 }));
    g.append(svg("title", {}, (S.stairs.stairs.find((s) => s.id === id) || {}).name || id));
    root.append(g);
  }
  if (f.start) {
    const s = N.get(f.start);
    root.append(svg("circle", { cx: s.x, cy: s.y, r: 9, fill: "#1b6e3f", stroke: "#fff", "stroke-width": 3 }));
    root.append(svg("text", { x: s.x + 13, y: s.y + 4, class: "b-lab", style: "font-size:11px;fill:#1b6e3f" }, floorId === S.floors[0].id ? "You are here (entrance)" : "You are here"));
  }
  if (leg) {
    const pts = leg.points.map((q) => t(q.x, q.y));
    drawLine(root, pts, 7, 6);
    const a = pts[0];
    root.append(svg("circle", { cx: a.x, cy: a.y, r: 8, fill: "#1b6e3f", stroke: "#fff", "stroke-width": 3 }));
  }
  if (dest) {
    root.append(
      svg("path", { d: `M${dest.x} ${dest.y - 12} c-9 -10 -14 -16 -14 -24 a14 14 0 1 1 28 0 c0 8 -5 14 -14 24z`, fill: "#880000", stroke: "#fff", "stroke-width": 2.5 }),
      svg("circle", { cx: dest.x, cy: dest.y - 36, r: 5.5, fill: "#ffcc00" })
    );
  }
}

function drawFloorTabs() {
  const nav = $("floors");
  nav.replaceChildren();
  for (const f of [...S.floors].reverse()) {
    if (!S.paths.floors[f.id]) continue;
    const b = el("button", { type: "button", "aria-pressed": String(f.id === S.floorId) }, floorShort(f));
    if (S.route && S.route.legs.some((l) => l.floorId === f.id)) b.classList.add("on-route");
    b.addEventListener("click", () => showFloor(f.id));
    nav.append(b);
  }
}

// ---------- transitions ----------
async function enterBuilding(floorId) {
  S.floorId = floorId;
  if (!S.inside) {
    stage("zooming");
    highlight(null);
    if (map) {
      const c = mainCoords();
      const [[w, so], [e, n]] = lngLatBox(c);
      await flyTo({ center: [(w + e) / 2, (so + n) / 2], zoom: 18.4, pitch: 62, bearing: -25, duration: 1600 });
    }
    stage("crossfade");
    drawIndoor(floorId);
    setCam("indoor", fitCam(floorBox(floorId)));
    S.inside = true;
    document.body.classList.add("inside");
    $("back").hidden = false;
    $("floors").hidden = false;
    await wait(650);
  } else {
    drawIndoor(floorId);
  }
  drawFloorTabs();
  const f = S.floors.find((x) => x.id === floorId);
  $("where").textContent = `PUP Main Building · ${floorShort(f)}`;
  stage("indoor");
}
async function exitBuilding() {
  if (!S.inside) return;
  stage("leaving");
  drawOutdoor();
  S.inside = false;
  document.body.classList.remove("inside");
  $("back").hidden = true;
  $("floors").hidden = true;
  $("where").textContent = "PUP Main · Sta. Mesa";
  await wait(300);
  if (map) await fitTo(featCoords(S.campus.campus), { pitch: 55, maxZoom: 17.2 });
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
    return tween("indoor", fitCam(bbox(pts, 70)), 500);
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
  $("sheet").classList.remove("expanded");
  syncSheet();
}
function syncSheet() {
  const h = $("sheet").hidden ? 0 : $("sheet").offsetHeight;
  document.documentElement.style.setProperty("--sheet-h", innerWidth >= 900 ? "0px" : `${h}px`);
}
function closeSheet() {
  $("sheet").hidden = true;
  S.sel = null;
  S.route = null;
  S.step = -1;
  syncSheet();
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
  if (p.main) {
    openSheet({ crumb: "PUP Main · Sta. Mesa", title: "PUP Main Building", sub: `${p.name} · floors 1F, 4F, 5F mapped inside`, inside: true, flag: `Height: ${p.heightSource}.` });
  } else {
    openSheet({ crumb: "PUP Main · Sta. Mesa", title: p.name || "Unnamed building ?", sub: `OpenStreetMap ${p.osm}`, flag: `No floor plan for this building yet. Height: ${p.heightSource}.` });
  }
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
    const b = el("button", { type: "button" });
    b.append(document.createTextNode(s.text), el("span", { class: "fl" }, s.floorId === "outdoor" ? "Campus" : floorShort(f)));
    b.addEventListener("click", () => goStep(i));
    const li = el("li");
    li.append(b);
    list.append(li);
  });
  list.hidden = false;
  $("stepnav").hidden = false;
  $("dir").hidden = true;
  syncSheet();
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
    if (map) await fitTo(leg.points.map((q) => [q.x, q.y]), { maxZoom: 18, pitch: 35 });
    return;
  }
  await enterBuilding(s.floorId);
  if (S.step === 1) {
    const f = S.paths.floors[s.floorId];
    const st = f.nodes.find((x) => x.id === f.start);
    const p = tf(s.floorId)(st.x, st.y);
    await tween("indoor", fitCam({ x: p.x - 160, y: p.y - 160, w: 320, h: 320 }), 500);
    return;
  }
  await focusIndoor();
}

// ---------- search ----------
function searchAll(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const rooms = S.rooms.filter((r) => roomName(r).toLowerCase().includes(s)).map((r) => ({ type: "room", r }));
  const bs = S.campus.buildings.features.filter((f) => f.properties.name && buildingName(f).toLowerCase().includes(s)).map((b) => ({ type: "building", b }));
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
  $("handle").addEventListener("click", () => {
    $("sheet").classList.toggle("expanded");
    syncSheet();
  });
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
