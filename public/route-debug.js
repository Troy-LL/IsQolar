import { planCampusRoute, campusStarts, searchRooms, roomDisplay, floorShort, allRooms, GATE_START, SEARCH_LIMIT } from "./route.js";

const NS = "http://www.w3.org/2000/svg";
const M_PER_DEG_LAT = 110540;

const state = { from: GATE_START, to: "main-5f-s508", paths: null, stairs: null, floors: null, campus: null };

function $(id) {
  return document.getElementById(id);
}

function svg(tag, attrs, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function hav(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.y - a.y);
  const dLng = rad(b.x - a.x);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatMeters(meters) {
  if (meters > 0 && meters < 0.5) return "< 1 m";
  return `${Math.round(meters)} m`;
}

function projectFactory(campus) {
  const lat0 = campus.center[1];
  const lng0 = campus.center[0];
  const mx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return (lng, lat) => [(lng - lng0) * mx, (lat0 - lat) * M_PER_DEG_LAT];
}

function buildingForFloor(floorId) {
  const campus = state.campus;
  if (floorId.startsWith("gym-")) return campus.buildings.features.find((f) => f.properties.name === "PUP Gymnasium");
  if (floorId.startsWith("library-")) {
    return campus.buildings.features.find((f) => f.properties.name === "Ninoy Aquino Library and Learning Resource Center");
  }
  return campus.buildings.features.find((f) => f.properties.main);
}

function metersPerUnit(floorId) {
  const feature = buildingForFloor(floorId);
  const floor = state.paths.floors[floorId];
  if (!feature || !floor) return 1;
  const ring = feature.geometry.coordinates[0];
  const project = projectFactory(state.campus);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [lng, lat] of ring) {
    const [x, y] = project(lng, lat);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const geoW = Math.max(maxX - minX, 1);
  const geoH = Math.max(maxY - minY, 1);
  const aspect = floor.aspect || 1;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const node of floor.nodes) {
    left = Math.min(left, node.x);
    right = Math.max(right, node.x);
    top = Math.min(top, node.y);
    bottom = Math.max(bottom, node.y);
  }
  const planW = Math.max((right - left) * aspect, 1e-6);
  const planH = Math.max(bottom - top, 1e-6);
  const geoLong = Math.max(geoW, geoH);
  const geoShort = Math.min(geoW, geoH);
  const planLong = Math.max(planW, planH);
  const planShort = Math.min(planW, planH);
  return (geoLong / planLong + geoShort / planShort) / 2;
}

function legMeters(leg) {
  if (leg.floorId === "outdoor") {
    let meters = 0;
    for (let i = 1; i < leg.points.length; i++) meters += hav(leg.points[i - 1], leg.points[i]);
    return meters;
  }
  const floor = state.paths.floors[leg.floorId];
  const aspect = floor ? floor.aspect || 1 : 1;
  const scale = metersPerUnit(leg.floorId);
  let units = 0;
  for (let i = 1; i < leg.points.length; i++) {
    const a = leg.points[i - 1];
    const b = leg.points[i];
    units += Math.hypot((a.x - b.x) * aspect, a.y - b.y);
  }
  return units * scale;
}

function stepMeters(route, step) {
  if (step.floorId === "outdoor") {
    const leg = route.legs.find((row) => row.floorId === "outdoor");
    return leg ? legMeters(leg) : 0;
  }
  if (/^Enter |^Go /.test(step.text)) return 0;
  const leg = route.legs.find((row) => row.floorId === step.floorId);
  return leg ? legMeters(leg) : 0;
}

function startById(id) {
  return campusStarts(state.campus).find((row) => row.id === id) || null;
}

function roomById(id) {
  return allRooms(state.paths).find((row) => row.id === id) || null;
}

function queryOf(input, selectedLabel) {
  const text = input.value.trim().toLowerCase();
  if (!text || text === selectedLabel.toLowerCase()) return "";
  return text;
}

function renderStartList() {
  const list = $("start-list");
  const selected = startById(state.from);
  const q = queryOf($("start-q"), selected ? selected.label : "");
  list.replaceChildren();
  if (document.activeElement !== $("start-q")) return;
  const rows = campusStarts(state.campus).filter((row) => !q || row.label.toLowerCase().includes(q));
  for (const row of rows) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    button.textContent = row.label;
    if (row.id === state.from) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      state.from = row.id;
      $("start-q").value = row.label;
      list.replaceChildren();
      draw();
    });
    li.append(button);
    list.append(li);
  }
}

function renderEndList() {
  const list = $("end-list");
  const selected = roomById(state.to);
  const selectedLabel = selected ? roomDisplay(selected) : "";
  const q = queryOf($("end-q"), selectedLabel);
  list.replaceChildren();
  if (document.activeElement !== $("end-q")) return;
  if (!q) {
    const hint = document.createElement("li");
    hint.className = "hint";
    hint.textContent = "Type a room code, for example S508.";
    list.append(hint);
    return;
  }
  const hits = searchRooms(state.paths, q);
  const shown = hits.slice(0, SEARCH_LIMIT);
  for (const room of shown) {
    const floor = state.floors.find((row) => row.id === room.floorId);
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    const name = document.createElement("span");
    name.textContent = roomDisplay(room);
    const where = document.createElement("span");
    where.textContent = floor ? ` - ${floorShort(floor)}` : "";
    button.append(name, where);
    if (room.id === state.to) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      state.to = room.id;
      $("end-q").value = roomDisplay(room);
      list.replaceChildren();
      draw();
    });
    li.append(button);
    list.append(li);
  }
  if (hits.length > shown.length) {
    const more = document.createElement("li");
    more.className = "hint";
    more.textContent = "Keep typing to narrow the list.";
    list.append(more);
  }
  if (!shown.length) {
    const empty = document.createElement("li");
    empty.className = "hint";
    empty.textContent = "No room matches.";
    list.append(empty);
  }
}

function ringPoints(ring, project) {
  return ring.map(([lng, lat]) => project(lng, lat));
}

function pointsAttr(points) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function expand(box, x, y) {
  box.minX = Math.min(box.minX, x);
  box.maxX = Math.max(box.maxX, x);
  box.minY = Math.min(box.minY, y);
  box.maxY = Math.max(box.maxY, y);
}

function viewBoxOf(box) {
  const width = Math.max(box.maxX - box.minX, 80);
  const height = Math.max(box.maxY - box.minY, 80);
  const padX = width * 0.12;
  const padY = height * 0.12;
  return `${(box.minX - padX).toFixed(2)} ${(box.minY - padY).toFixed(2)} ${(width + padX * 2).toFixed(2)} ${(height + padY * 2).toFixed(2)}`;
}

function drawCampus(route) {
  const campus = state.campus;
  const project = projectFactory(campus);
  const root = svg("svg", { class: "campus", role: "img", "aria-label": "Campus route at PUP Sta. Mesa", preserveAspectRatio: "xMidYMid meet" });
  const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const take = (pair) => expand(box, pair[0], pair[1]);

  const campusRing = campus.campus && campus.campus.geometry ? ringPoints(campus.campus.geometry.coordinates[0], project) : [];
  if (campusRing.length) root.append(svg("polygon", { points: pointsAttr(campusRing), fill: "#e7efe4", stroke: "#b7c7b4", "stroke-width": "1", "vector-effect": "non-scaling-stroke" }));

  const startFeature = campus.buildings.features.find((f) => f.properties.osm === state.from);
  for (const feature of campus.buildings.features) {
    const ring = ringPoints(feature.geometry.coordinates[0], project);
    const selected = feature === startFeature || feature.properties.main;
    root.append(svg("polygon", {
      points: pointsAttr(ring),
      fill: feature.properties.main ? "#f3dcdc" : "#e7dfda",
      stroke: selected ? "#880000" : "#b9aca5",
      "stroke-width": selected ? "2.4" : "1",
      "vector-effect": "non-scaling-stroke",
    }));
    if (selected) for (const pair of ring) take(pair);
  }

  const outdoor = route.legs.find((leg) => leg.floorId === "outdoor");
  if (outdoor) {
    const line = outdoor.points.map((p) => project(p.x, p.y));
    for (const pair of line) take(pair);
    if (line.length >= 2) {
      const attr = { points: pointsAttr(line), fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" };
      root.append(svg("polyline", { ...attr, stroke: "#ffffff", "stroke-width": "10" }));
      root.append(svg("polyline", { ...attr, id: "route-line", stroke: "#880000", "stroke-width": "5" }));
    } else if (line.length === 1) {
      root.append(svg("circle", { cx: line[0][0].toFixed(2), cy: line[0][1].toFixed(2), r: "6", fill: "#880000", stroke: "#ffffff", "stroke-width": "2", "vector-effect": "non-scaling-stroke" }));
    }
  }
  const gate = project(campus.gate.lngLat[0], campus.gate.lngLat[1]);
  root.append(svg("circle", { cx: gate[0].toFixed(2), cy: gate[1].toFixed(2), r: "5", fill: "#1b6e3f", stroke: "#ffffff", "stroke-width": "2", "vector-effect": "non-scaling-stroke" }));
  root.setAttribute("viewBox", viewBoxOf(box));
  return root;
}

function drawFloor(leg, route) {
  const floor = state.paths.floors[leg.floorId];
  const meta = state.floors.find((row) => row.id === leg.floorId);
  const label = meta ? floorShort(meta) : leg.floorId;
  const width = 1000;
  const height = Math.round(1000 / (floor.aspect || 1));
  const pad = 56;
  const root = svg("svg", {
    class: "floor",
    role: "img",
    "aria-label": `${label} route`,
    viewBox: `${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`,
    preserveAspectRatio: "xMidYMid meet",
  });
  const at = (x, y) => [x * width, y * height];
  const placed = state.stairs.floors[leg.floorId] ? state.stairs.floors[leg.floorId].stairs : {};
  const used = new Set(leg.ids.filter((id) => placed[id]));
  for (const [a, b] of floor.edges) {
    const na = floor.nodes.find((node) => node.id === a);
    const nb = floor.nodes.find((node) => node.id === b);
    if (!na || !nb || na.kind !== "corridor" || nb.kind !== "corridor") continue;
    const A = at(na.x, na.y);
    const B = at(nb.x, nb.y);
    root.append(svg("line", {
      x1: A[0].toFixed(1), y1: A[1].toFixed(1), x2: B[0].toFixed(1), y2: B[1].toFixed(1),
      stroke: "#c6b8b1", "stroke-width": "8", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke",
    }));
  }
  for (const [id, point] of Object.entries(placed)) {
    const [x, y] = at(point.x, point.y);
    const onRoute = used.has(id);
    root.append(svg("rect", {
      x: (x - (onRoute ? 11 : 7)).toFixed(1),
      y: (y - (onRoute ? 11 : 7)).toFixed(1),
      width: onRoute ? 22 : 14,
      height: onRoute ? 22 : 14,
      fill: onRoute ? "#ffcc00" : "#1f1a1a",
      stroke: onRoute ? "#880000" : "#1f1a1a",
      "stroke-width": "2",
      "vector-effect": "non-scaling-stroke",
    }));
  }
  if (leg.points.length >= 2) {
    const line = leg.points.map((p) => at(p.x, p.y));
    const attr = { points: pointsAttr(line), fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" };
    root.append(svg("polyline", { ...attr, stroke: "#ffffff", "stroke-width": "12" }));
    root.append(svg("polyline", { ...attr, stroke: "#880000", "stroke-width": "6", class: "route-line" }));
  }
  const room = route.room;
  if (room && room.floorId === leg.floorId) {
    const [x, y] = at(room.x, room.y);
    root.append(svg("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: "9", fill: "#880000", stroke: "#ffffff", "stroke-width": "3", "vector-effect": "non-scaling-stroke" }));
    const caption = svg("text", { x: (x + 14).toFixed(1), y: (y - 12).toFixed(1), fill: "#880000", "font-size": "28", "font-weight": "700" });
    caption.textContent = roomDisplay(room);
    root.append(caption);
  }
  if (leg.arrive && !leg.arrive.includes("?")) {
    const stair = leg.points[0];
    if (stair) {
      const [x, y] = at(stair.x, stair.y);
      const caption = svg("text", { x: (x + 16).toFixed(1), y: (y + 8).toFixed(1), fill: "#1f1a1a", "font-size": "22", "font-weight": "700" });
      caption.textContent = leg.arrive;
      root.append(caption);
    }
  }
  return root;
}

function fillLegs(route) {
  const list = $("legs");
  list.replaceChildren();
  for (const leg of route.legs) {
    const li = document.createElement("li");
    const meta = state.floors.find((row) => row.id === leg.floorId);
    const name = leg.floorId === "outdoor" ? "Campus" : meta ? floorShort(meta) : leg.floorId;
    li.append(document.createTextNode(name));
    if (leg.arrive && !String(leg.arrive).includes("?")) {
      li.append(document.createTextNode(" via "));
      const stair = document.createElement("span");
      stair.className = "stair";
      stair.textContent = leg.arrive;
      li.append(stair);
    }
    const meters = document.createElement("span");
    meters.className = "meters";
    meters.textContent = formatMeters(legMeters(leg));
    li.append(meters);
    list.append(li);
  }
}

function fillSteps(route) {
  const list = $("steps");
  list.replaceChildren();
  route.steps.forEach((step) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = step.text;
    const meters = document.createElement("span");
    meters.className = "meters";
    meters.textContent = formatMeters(stepMeters(route, step));
    li.append(text, meters);
    list.append(li);
  });
}

function draw() {
  const start = startById(state.from);
  const room = roomById(state.to);
  const status = $("status");
  const map = $("map");
  const url = new URL(location.href);
  url.searchParams.set("from", state.from);
  url.searchParams.set("to", state.to);
  history.replaceState(null, "", url);
  if (!start || !room) {
    status.textContent = "Choose a start and a room.";
    map.replaceChildren();
    $("legs").replaceChildren();
    $("steps").replaceChildren();
    return;
  }
  const route = planCampusRoute(state.paths, state.stairs, state.floors, state.campus, room.id, start.id);
  if (!route.ok) {
    status.textContent = route.message;
    map.replaceChildren();
    $("legs").replaceChildren();
    $("steps").replaceChildren();
    return;
  }
  const total = route.legs.reduce((sum, leg) => sum + legMeters(leg), 0);
  status.textContent = `${roomDisplay(room)} from ${start.label}, ${formatMeters(total)}`;
  const floors = document.createElement("div");
  floors.className = "floor-grid";
  for (const leg of route.legs) {
    if (leg.floorId === "outdoor") continue;
    floors.append(drawFloor(leg, route));
  }
  map.replaceChildren(drawCampus(route), floors);
  fillLegs(route);
  fillSteps(route);
}

function readQuery() {
  const params = new URLSearchParams(location.search);
  const from = params.get("from");
  const to = params.get("to");
  if (from && startById(from)) state.from = from;
  if (to && roomById(to)) state.to = to;
  const start = startById(state.from);
  const room = roomById(state.to);
  if (start) $("start-q").value = start.label;
  if (room) $("end-q").value = roomDisplay(room);
}

async function main() {
  const [paths, stairs, floors, campus] = await Promise.all([
    fetch("data/paths.json").then((res) => res.json()),
    fetch("data/stairs.json").then((res) => res.json()),
    fetch("data/floors.json").then((res) => res.json()),
    fetch("data/campus-osm.json").then((res) => res.json()),
  ]);
  state.paths = paths;
  state.stairs = stairs;
  state.floors = floors;
  state.campus = campus;
  readQuery();
  $("start-q").addEventListener("focus", renderStartList);
  $("start-q").addEventListener("input", renderStartList);
  $("end-q").addEventListener("focus", renderEndList);
  $("end-q").addEventListener("input", renderEndList);
  document.addEventListener("click", (event) => {
    if (!$("start-picker").contains(event.target)) $("start-list").replaceChildren();
    if (!$("end-picker").contains(event.target)) $("end-list").replaceChildren();
  });
  draw();
}

main().catch((error) => {
  $("status").textContent = error instanceof Error ? error.message : "The map data did not load.";
});
