// Floor-by-floor routing for the Room TBA map.
// Plain ES module: the map page loads it in the browser and src/route.test.ts imports it in Node.
// Data comes from data/paths.json (walk graph per floor) and data/stairs.json (shared stairwell ids).

export const NOT_ON_MAP = "not on the map yet";

export function floorShort(floor) {
  const m = /^(\d+F|GF|LG|B\d)/.exec(floor && floor.floor ? floor.floor : String(floor || ""));
  return m ? m[1] : String(floor && floor.id ? floor.id : floor);
}

export function roomName(room) {
  return room.wing ? `${room.label} (${room.wing})` : room.label;
}

const WING_LETTER = { "north wing": "N", "south wing": "S", "east wing": "E", "west wing": "W" };
const WING_NAME = { N: "North wing", S: "South wing", E: "East wing", W: "West wing" };

export function wingLetter(wing) {
  if (!wing || wing === "?") return null;
  return WING_LETTER[String(wing).toLowerCase()] || null;
}

export function wingName(letter) {
  return WING_NAME[letter] || null;
}

// Canonical PUP classroom code: wing letter + floor digit + two digits, e.g. E402, S508, N412.
// Optional trailing letter for split rooms (S512A). Codes come from the floor posters in public/maps/
// (5F prints S508; 4F prints "Class Room 412" inside the North/East/West wing, stored as N412).
// Lobby codes like (W2) and (S7) are 1F office directory labels, not classroom codes.
export function isValidRoomCode(code) {
  return /^[NESW]\d{3}[A-Z]?$/.test(String(code || "").replace(/\?$/, "").toUpperCase());
}

function packCode(letter, number, unsure) {
  const code = letter.toUpperCase() + String(number).toUpperCase();
  if (!isValidRoomCode(code)) return null;
  return { code: code + (unsure ? "?" : ""), unsure: !!unsure, letter: letter.toUpperCase(), number: String(number).toUpperCase() };
}

export function roomCode(room) {
  if (!room) return null;
  const label = room.label || "";
  const flagged = !!room.flag || /\?/.test(label) || /\?/.test(room.code || "");
  if (room.code && isValidRoomCode(room.code)) {
    const m = /^([NESW])(\d{3}[A-Z]?)/i.exec(room.code);
    return packCode(m[1], m[2], flagged);
  }
  // 5F posters print the code on the room (S513, E501, …)
  let m = /^([NESW])(\d{3}[A-Z]?)\??$/i.exec(label.trim());
  if (m) return packCode(m[1], m[2], flagged);
  // 4F posters print "Class Room 412" inside a named wing
  m = /^Classroom (\d{3}[A-Z]?)$/i.exec(label);
  if (m) {
    const letter = wingLetter(room.wing);
    if (!letter) return { code: m[1] + "?", unsure: true, letter: null, number: m[1] };
    return packCode(letter, m[1], flagged);
  }
  return null;
}

export function isClassroom(room) {
  if (!room) return false;
  if (/^Classroom\s/i.test(room.label || "")) return true;
  return !!roomCode(room);
}

export const SEARCH_LIMIT = 8;

export function roomDisplay(room) {
  const c = roomCode(room);
  return c ? c.code : roomName(room);
}

export function roomListed(room) {
  if (!room || typeof room.label !== "string" || room.label.includes("?")) return false;
  return !roomDisplay(room).includes("?");
}

// "N412", "N 412", "north 412" → letter + number. Bare "412" → which-wing chooser.
// A lone wing letter ("S") is letterOnly: show a hint, do not list rooms yet.
export function parseRoomQuery(query) {
  const s = String(query || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (/^[nsew]$/.test(s)) return { letter: s.toUpperCase(), number: null, bare: false, letterOnly: true };
  const named = /^(north|south|east|west)\s+(\d+[a-z]?)\??$/.exec(s);
  if (named) return { letter: named[1][0].toUpperCase(), number: named[2].toUpperCase(), bare: false, letterOnly: false };
  const coded = /^([nsew])\s*(\d+[a-z]?)\??$/.exec(s);
  if (coded) return { letter: coded[1].toUpperCase(), number: coded[2].toUpperCase(), bare: false, letterOnly: false };
  const bare = /^(\d+[a-z]?)\??$/.exec(s);
  if (bare) return { letter: null, number: bare[1].toUpperCase(), bare: true, letterOnly: false };
  return null;
}

function floorRank(floorId) {
  const m = /(\d+)f/i.exec(floorId || "");
  return m ? Number(m[1]) : 99;
}

function numberRank(room) {
  const c = roomCode(room);
  if (!c) return 1e9;
  const n = parseInt(c.number, 10);
  return Number.isFinite(n) ? n : 1e9;
}

export function sortSearchHits(hits) {
  return hits.slice().sort((a, b) => {
    const ca = isClassroom(a) ? 0 : 1;
    const cb = isClassroom(b) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    const fa = floorRank(a.floorId);
    const fb = floorRank(b.floorId);
    if (fa !== fb) return fa - fb;
    const na = numberRank(a);
    const nb = numberRank(b);
    if (na !== nb) return na - nb;
    return roomDisplay(a).localeCompare(roomDisplay(b));
  });
}

function graphFor(paths, floorId) {
  const floor = paths.floors[floorId];
  if (!floor) return null;
  const aspect = floor.aspect || 1;
  const nodes = new Map(floor.nodes.map((n) => [n.id, n]));
  const adj = new Map();
  for (const [a, b] of floor.edges) {
    const na = nodes.get(a);
    const nb = nodes.get(b);
    if (!na || !nb) continue;
    const w = Math.hypot((na.x - nb.x) * aspect, na.y - nb.y);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push([b, w]);
    adj.get(b).push([a, w]);
  }
  return { nodes, adj };
}

// Dijkstra on one floor. Rooms, stairs and the start point are leaves, so a route never cuts through a room.
export function shortestPath(paths, floorId, from, to) {
  const g = graphFor(paths, floorId);
  if (!g || !g.nodes.has(from) || !g.nodes.has(to)) return null;
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const done = new Set();
  while (true) {
    let cur = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!done.has(id) && d < best) {
        best = d;
        cur = id;
      }
    }
    if (cur === null) return null;
    if (cur === to) break;
    done.add(cur);
    for (const [next, w] of g.adj.get(cur) || []) {
      const nd = best + w;
      if (nd < (dist.get(next) ?? Infinity)) {
        dist.set(next, nd);
        prev.set(next, cur);
      }
    }
  }
  const ids = [to];
  while (ids[0] !== from) ids.unshift(prev.get(ids[0]));
  return { distance: dist.get(to), ids, points: snapLeg(g, ids, paths.floors[floorId].aspect || 1) };
}

// Draw a leg on the corridors: leaves (start, stairs, rooms) join the corridor at their foot point, not at the
// corridor vertex, so the line never runs out to a vertex and doubles back.
function snapLeg(g, ids, aspect) {
  const P = (id) => g.nodes.get(id);
  const isLeaf = (id) => P(id).kind !== "corridor";
  const foot = (p, a, b) => {
    const ax = a.x, ay = a.y / aspect, bx = b.x, by = b.y / aspect, px = p.x, py = p.y / aspect;
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    return { x: ax + dx * t, y: (ay + dy * t) * aspect, t, d: Math.hypot(px - ax - dx * t, py - ay - dy * t) };
  };
  const corrNbrs = (c) => (g.adj.get(c) || []).map(([n]) => n).filter((n) => !isLeaf(n));
  const pts = ids.map((id) => ({ x: P(id).x, y: P(id).y }));
  const n = ids.length;
  if (n === 3 && isLeaf(ids[0]) && isLeaf(ids[2])) {
    // leaf, corridor vertex, leaf: put both feet on the corridor segment that suits them best
    const c = ids[1];
    let best = null;
    for (const m of corrNbrs(c)) {
      const a = foot(P(ids[0]), P(c), P(m));
      const b = foot(P(ids[2]), P(c), P(m));
      if (!best || a.d + b.d < best.a.d + best.b.d) best = { a, b };
    }
    if (best) return [pts[0], { x: best.a.x, y: best.a.y }, { x: best.b.x, y: best.b.y }, pts[2]];
    return pts;
  }
  const out = pts.slice();
  if (n >= 3 && isLeaf(ids[0]) && !isLeaf(ids[1]) && !isLeaf(ids[2])) {
    const f = foot(P(ids[0]), P(ids[1]), P(ids[2]));
    out[1] = { x: f.x, y: f.y };
  }
  if (n >= 3 && isLeaf(ids[n - 1]) && !isLeaf(ids[n - 2]) && !isLeaf(ids[n - 3])) {
    const f = foot(P(ids[n - 1]), P(ids[n - 2]), P(ids[n - 3]));
    out[n - 2] = { x: f.x, y: f.y };
  }
  return out;
}

export function allRooms(paths) {
  const out = [];
  for (const [floorId, floor] of Object.entries(paths.floors)) {
    for (const r of floor.rooms) out.push({ ...r, floorId });
  }
  return out;
}

export function searchRooms(paths, query) {
  const rooms = allRooms(paths);
  const parsed = parseRoomQuery(query);
  if (parsed && parsed.letterOnly) return [];
  if (parsed && parsed.number) {
    const hits = rooms.filter((r) => {
      if (!roomListed(r)) return false;
      const c = roomCode(r);
      if (!c) return false;
      // Wing prefix must match exactly: S never returns W rooms.
      if (parsed.letter && c.letter !== parsed.letter) return false;
      // Digits are a prefix so typing S5 lists S501, S513, …
      return c.number.startsWith(parsed.number);
    });
    return sortSearchHits(hits);
  }
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Free-text: match real names and ids, not a lone letter inside a code.
  const hits = rooms.filter((r) => roomListed(r) && (roomName(r).toLowerCase().includes(q) || r.id.toLowerCase().includes(q)));
  return sortSearchHits(hits);
}

function findRoom(paths, roomId) {
  return allRooms(paths).find((r) => r.id === roomId) || null;
}

// Plan a route from a start (floorId + node id) to a room id.
// Returns { ok: true, legs, steps } or { ok: false, message }.
export function planRoute(paths, stairs, floors, start, roomId) {
  const room = findRoom(paths, roomId);
  if (!room) {
    return { ok: false, message: `${roomId} is ${NOT_ON_MAP}.` };
  }
  const label = (id) => floorShort(floors.find((f) => f.id === id) || id);
  const stairName = (id) => (stairs.stairs.find((s) => s.id === id) || { name: id }).name;
  const target = roomDisplay(room);

  if (start.floorId === room.floorId) {
    const p = shortestPath(paths, room.floorId, start.node, room.id);
    if (!p) return { ok: false, message: `No walking path to ${target} yet.` };
    return {
      ok: true,
      room,
      legs: [{ floorId: room.floorId, ids: p.ids, points: p.points }],
      steps: [{ floorId: room.floorId, text: `Walk to ${target}` }],
    };
  }

  const fromStairs = (stairs.floors[start.floorId] || { stairs: {} }).stairs;
  const toStairs = (stairs.floors[room.floorId] || { stairs: {} }).stairs;
  let best = null;
  for (const id of Object.keys(fromStairs)) {
    if (!toStairs[id]) continue;
    const a = shortestPath(paths, start.floorId, start.node, id);
    if (!a) continue;
    if (!best || a.distance < best.a.distance) best = { id, a };
  }
  if (!best) return { ok: false, message: `No shared stairs between ${label(start.floorId)} and ${label(room.floorId)} yet.` };
  const b = shortestPath(paths, room.floorId, best.id, room.id);
  if (!b) return { ok: false, message: `No walking path to ${target} yet.` };
  const fromN = parseInt(label(start.floorId), 10);
  const toN = parseInt(label(room.floorId), 10);
  const dir = toN > fromN ? "up" : "down";
  return {
    ok: true,
    room,
    stair: best.id,
    legs: [
      { floorId: start.floorId, ids: best.a.ids, points: best.a.points },
      { floorId: room.floorId, ids: b.ids, points: b.points, arrive: stairName(best.id) },
    ],
    steps: [
      { floorId: start.floorId, text: `Walk to the ${stairName(best.id)}` },
      { floorId: room.floorId, text: `Go ${dir} to ${label(room.floorId)}` },
      { floorId: room.floorId, text: `Walk to ${target}` },
    ],
  };
}

const M_PER_DEG_LAT = 110540;

function mPerDegLng(lat) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

function havMeters(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function closestSegs(a, b, c, d) {
  const lat = (a[1] + b[1] + c[1] + d[1]) / 4;
  const mx = mPerDegLng(lat);
  const xy = (p) => [p[0] * mx, p[1] * M_PER_DEG_LAT];
  const A = xy(a);
  const B = xy(b);
  const C = xy(c);
  const D = xy(d);
  const d1x = B[0] - A[0];
  const d1y = B[1] - A[1];
  const d2x = D[0] - C[0];
  const d2y = D[1] - C[1];
  const rx = A[0] - C[0];
  const ry = A[1] - C[1];
  const ab2 = d1x * d1x + d1y * d1y;
  const cd2 = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  const eps = 1e-12;
  let s = 0;
  let t = 0;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  if (ab2 <= eps && cd2 <= eps) {
    s = 0;
    t = 0;
  } else if (ab2 <= eps) {
    s = 0;
    t = clamp(f / cd2);
  } else {
    const dot = d1x * rx + d1y * ry;
    if (cd2 <= eps) {
      t = 0;
      s = clamp(-dot / ab2);
    } else {
      const along = d1x * d2x + d1y * d2y;
      const denom = ab2 * cd2 - along * along;
      s = denom > eps ? clamp((along * f - dot * cd2) / denom) : 0;
      t = (along * s + f) / cd2;
      if (t < 0) {
        t = 0;
        s = clamp(-dot / ab2);
      } else if (t > 1) {
        t = 1;
        s = clamp((along - dot) / ab2);
      }
    }
  }
  const onBuilding = [A[0] + d1x * s, A[1] + d1y * s];
  const onWalk = [C[0] + d2x * t, C[1] + d2y * t];
  return {
    building: [onBuilding[0] / mx, onBuilding[1] / M_PER_DEG_LAT],
    walk: [onWalk[0] / mx, onWalk[1] / M_PER_DEG_LAT],
    t,
    d: Math.hypot(onBuilding[0] - onWalk[0], onBuilding[1] - onWalk[1]),
  };
}

export const GATE_START = "gate";

export function campusStarts(campus) {
  const rows = campus.buildings.features
    .filter((f) => f.properties.name && !f.properties.name.includes("?"))
    .map((f) => ({ id: f.properties.osm, label: f.properties.name }));
  rows.sort((a, b) => a.label.localeCompare(b.label, "en") || a.id.localeCompare(b.id));
  return [{ id: GATE_START, label: "Main gate" }, ...rows];
}

function routeAlongWalk(campus, feature) {
  const walk = campus.walk.coordinates;
  const ring = feature.geometry.coordinates[0];
  let best = null;
  for (let edge = 0; edge < ring.length - 1; edge++) {
    for (let i = 0; i < walk.length - 1; i++) {
      const hit = closestSegs(ring[edge], ring[edge + 1], walk[i], walk[i + 1]);
      if (!best || hit.d < best.d) best = { ...hit, i };
    }
  }
  const coords = [];
  const push = (p) => {
    const last = coords[coords.length - 1];
    if (!last || havMeters(last, p) >= 0.4) coords.push([p[0], p[1]]);
  };
  push(best.building);
  if (best.t > 0 && best.t < 1) push(best.walk);
  else if (best.t <= 0) push(walk[best.i]);
  for (let k = best.i + 1; k < walk.length; k++) push(walk[k]);
  let meters = 0;
  for (let k = 1; k < coords.length; k++) meters += havMeters(coords[k - 1], coords[k]);
  return { coordinates: coords, meters: Math.round(meters) };
}

function outdoorFrom(campus, fromId) {
  const entrance = campus.entrance.label;
  if (!fromId || fromId === GATE_START) {
    return {
      ok: true,
      coordinates: campus.walk.coordinates,
      text: `Walk from the main gate to the ${entrance} (${campus.walk.meters} m)`,
    };
  }
  const feature = campus.buildings.features.find((f) => f.properties.osm === fromId);
  if (!feature) return { ok: false, message: `${fromId} is not a campus building.` };
  const start = campusStarts(campus).find((s) => s.id === fromId);
  if (!start) return { ok: false, message: "That building is not in the From list." };
  const walked = routeAlongWalk(campus, feature);
  return {
    ok: true,
    coordinates: walked.coordinates,
    text: `Walk from the ${start.label} to the ${entrance} (${walked.meters} m)`,
  };
}

// Outdoor points are [lng, lat] from data/campus-osm.json (x = lng, y = lat).
export function planCampusRoute(paths, stairs, floors, campus, roomId, fromId) {
  const lobby = floors.find((f) => paths.floors[f.id] && paths.floors[f.id].start);
  if (!lobby) return { ok: false, message: "The lobby is not on the map yet." };
  const outdoor = outdoorFrom(campus, fromId);
  if (!outdoor.ok) return outdoor;
  const r = planRoute(paths, stairs, floors, { floorId: lobby.id, node: paths.floors[lobby.id].start }, roomId);
  if (!r.ok) return r;
  return {
    ...r,
    legs: [
      { floorId: "outdoor", ids: [], points: outdoor.coordinates.map(([x, y]) => ({ x, y })) },
      ...r.legs,
    ],
    steps: [
      { floorId: "outdoor", text: outdoor.text },
      { floorId: lobby.id, text: `Enter the lobby (${floorShort(lobby)})` },
      ...r.steps,
    ],
  };
}
