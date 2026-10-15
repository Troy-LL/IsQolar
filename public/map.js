import { planRoute, searchRooms, roomName, floorShort } from "./route.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const EDIT = params.get("edit") === "1";
const SVG = "http://www.w3.org/2000/svg";

const state = { floors: [], paths: null, stairs: null, floorId: null, route: null, zoom: 1, dest: null };

function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

function shortLabel(r) {
  const m = /\(([A-Z]+\d+[A-Z]?\??)\)$/.exec(r.label);
  if (m) return m[1];
  const c = /^Classroom (\d+)$/.exec(r.label);
  if (c) return c[1];
  if (/Dome/.test(r.label)) return "Dome";
  const t = r.label.replace(/\s*\(.*\)$/, "");
  return t.length > 16 ? t.slice(0, 15) + "…" : t;
}

async function load() {
  const [floors, paths, stairs] = await Promise.all(
    ["data/floors.json", "data/paths.json", "data/stairs.json"].map((u) => fetch(u).then((r) => r.json()))
  );
  Object.assign(state, { floors, paths, stairs });
  state.zoom = window.innerWidth < 600 ? 2 : 1;

  const from = $("from");
  for (const f of floors) {
    if (paths.floors[f.id] && paths.floors[f.id].start) from.append(el("option", { value: `${f.id}|start` }, `You Are Here (${floorShort(f)} lobby)`));
  }
  for (const f of floors) {
    for (const s of stairs.stairs) {
      if (stairs.floors[f.id] && stairs.floors[f.id].stairs[s.id]) from.append(el("option", { value: `${f.id}|${s.id}` }, `${floorShort(f)} · ${s.name}`));
    }
  }
  if (params.get("from")) from.value = params.get("from");
  from.addEventListener("change", () => state.dest && go(state.dest));

  const tabs = $("tabs");
  for (const f of floors) {
    const b = el("button", { type: "button", role: "tab", "data-floor": f.id }, floorShort(f));
    b.addEventListener("click", () => show(f.id));
    tabs.append(b);
  }

  $("q").addEventListener("input", onSearch);
  $("zoomIn").addEventListener("click", () => setZoom(state.zoom + 0.5));
  $("zoomOut").addEventListener("click", () => setZoom(state.zoom - 0.5));
  $("showLabels").addEventListener("change", (e) => $("stage").classList.toggle("hide-labels", !e.target.checked));
  if (EDIT) {
    $("stage").addEventListener("click", (e) => {
      const r = $("plan").getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width).toFixed(4);
      const y = ((e.clientY - r.top) / r.height).toFixed(4);
      console.log(`${state.floorId} x=${x} y=${y}`);
    });
  }

  setZoom(state.zoom, true);
  const to = params.get("to");
  if (to) go(to);
  else show(params.get("floor") || floors[0].id);
  if (params.get("step")) showStep(Number(params.get("step")) - 1);
}

function setZoom(z, quiet) {
  state.zoom = Math.min(4, Math.max(1, z));
  $("stage").style.width = `${state.zoom * 100}%`;
  $("zoomLabel").textContent = `${Math.round(state.zoom * 100)}%`;
  if (!quiet) focusRoute();
}

function onSearch() {
  const list = $("results");
  list.replaceChildren();
  const hits = searchRooms(state.paths, $("q").value).slice(0, 30);
  list.hidden = hits.length === 0;
  $("msg").textContent = $("q").value.trim() && !hits.length ? `"${$("q").value.trim()}" is not on the map yet.` : "";
  for (const r of hits) {
    const f = state.floors.find((x) => x.id === r.floorId);
    const b = el("button", { type: "button" });
    b.append(document.createTextNode(roomName(r) + " "), el("small", {}, `${floorShort(f)}${r.flag ? " · not confirmed" : ""}`));
    b.addEventListener("click", () => {
      $("q").value = roomName(r);
      list.hidden = true;
      go(r.id);
    });
    const li = el("li");
    li.append(b);
    list.append(li);
  }
}

function go(roomId) {
  state.dest = roomId;
  const [floorId, node] = $("from").value.split("|");
  const r = planRoute(state.paths, state.stairs, state.floors, { floorId, node }, roomId);
  const steps = $("steps");
  steps.replaceChildren();
  if (!r.ok) {
    state.route = null;
    steps.hidden = true;
    $("msg").textContent = r.message;
    show(state.floorId || state.floors[0].id);
    return;
  }
  state.route = r;
  $("msg").textContent = "";
  r.steps.forEach((s, i) => {
    const f = state.floors.find((x) => x.id === s.floorId);
    const b = el("button", { type: "button" });
    b.append(document.createTextNode(s.text), el("span", { class: "fl" }, floorShort(f)));
    b.addEventListener("click", () => showStep(i));
    const li = el("li");
    li.append(b);
    steps.append(li);
  });
  steps.hidden = false;
  showStep(0);
}

function showStep(i) {
  if (!state.route) return;
  const s = state.route.steps[i];
  if (!s) return;
  document.querySelectorAll("#steps button").forEach((b, j) => (j === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
  show(s.floorId);
}

function show(floorId) {
  const floor = state.floors.find((f) => f.id === floorId) || state.floors[0];
  state.floorId = floor.id;
  const data = state.paths.floors[floor.id];
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.setAttribute("aria-selected", String(b.dataset.floor === floor.id));
    b.classList.toggle("on-route", !!state.route && state.route.legs.some((l) => l.floorId === b.dataset.floor));
  });
  const img = $("plan");
  img.src = floor.image.replace(/^public\//, "");
  img.alt = `${floor.label} floor plan`;

  const leg = state.route ? state.route.legs.find((l) => l.floorId === floor.id) : null;
  const legIds = new Set(leg ? leg.ids : []);

  const pins = $("pins");
  pins.replaceChildren();
  const seen = new Map();
  for (const r of data.rooms) {
    const key = `${r.x},${r.y}`;
    if (seen.has(key)) {
      seen.get(key).title += `\n${roomName(r)}`;
      if (state.dest === r.id) seen.get(key).classList.add("dest");
      continue;
    }
    const b = el("button", { type: "button", class: "pin", title: roomName(r) });
    if (r.flag) b.classList.add("unsure");
    if (state.route && state.route.room.id === r.id) b.classList.add("dest");
    b.style.left = `${r.x * 100}%`;
    b.style.top = `${r.y * 100}%`;
    b.append(el("span", { class: "dot" }), el("span", { class: "lab" }, shortLabel(r)));
    b.addEventListener("click", (e) => {
      if (EDIT) return;
      e.stopPropagation();
      $("q").value = roomName(r);
      go(r.id);
    });
    seen.set(key, b);
    pins.append(b);
  }
  for (const [id, p] of Object.entries(state.stairs.floors[floor.id].stairs)) {
    const b = el("span", { class: "pin stair", title: (state.stairs.stairs.find((s) => s.id === id) || {}).name || id });
    b.style.left = `${p.x * 100}%`;
    b.style.top = `${p.y * 100}%`;
    b.append(el("span", { class: "dot" }));
    if (legIds.has(id)) b.append(el("span", { class: "lab" }, "Stairs"));
    pins.append(b);
  }

  const here = data.start ? data.nodes.find((n) => n.id === data.start) : null;
  if (here) {
    const b = el("span", { class: "pin start", title: "You Are Here" });
    b.style.left = `${here.x * 100}%`;
    b.style.top = `${here.y * 100}%`;
    b.append(el("span", { class: "dot" }), el("span", { class: "lab" }, "You are here"));
    pins.append(b);
  }
  drawRoute(data, leg);
  img.decode().then(focusRoute, focusRoute);
}

function drawRoute(data, leg) {
  const svg = $("route");
  svg.replaceChildren();
  const h = 1000 / data.aspect;
  svg.setAttribute("viewBox", `0 0 1000 ${h}`);
  if (!leg) return;
  const pts = leg.points.map((p) => `${(p.x * 1000).toFixed(1)},${(p.y * h).toFixed(1)}`).join(" ");
  const casing = document.createElementNS(SVG, "polyline");
  casing.setAttribute("points", pts);
  casing.setAttribute("style", "fill:none;stroke:#fff;stroke-width:13;stroke-linecap:round;stroke-linejoin:round;opacity:.9");
  const line = document.createElementNS(SVG, "polyline");
  line.setAttribute("points", pts);
  line.setAttribute("style", "fill:none;stroke:#880000;stroke-width:8;stroke-dasharray:16 10;stroke-linecap:round;stroke-linejoin:round");
  const s = leg.points[0];
  const start = document.createElementNS(SVG, "circle");
  start.setAttribute("cx", String(s.x * 1000));
  start.setAttribute("cy", String(s.y * h));
  start.setAttribute("r", "11");
  start.setAttribute("style", "fill:#1b6e3f;stroke:#fff;stroke-width:4");
  svg.append(casing, line, start);
}

function focusRoute() {
  const scroll = $("scroll");
  const leg = state.route ? state.route.legs.find((l) => l.floorId === state.floorId) : null;
  if (!leg) return;
  const xs = leg.points.map((p) => p.x);
  const ys = leg.points.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const stage = $("stage");
  scroll.scrollLeft = cx * stage.offsetWidth - scroll.clientWidth / 2;
  scroll.scrollTop = cy * stage.offsetHeight - scroll.clientHeight / 2;
}

load();
