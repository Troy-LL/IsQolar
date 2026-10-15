// Floor-by-floor routing for the Room TBA map.
// Plain ES module: the map page loads it in the browser and src/route.test.ts imports it in Node.
// Data comes from data/paths.json (walk graph per floor) and data/stairs.json (shared stairwell ids).

export const NOT_ON_MAP = "not on the map yet";

export function floorShort(floor) {
  const m = /^(\d+F)/.exec(floor && floor.floor ? floor.floor : String(floor || ""));
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

// Wing-letter + number from data we already have (N412, E412, S513). Never invent a wing.
// If the wing is unknown ("?"), return the bare number with "?" and mark it unsure (grey in the UI).
export function roomCode(room) {
  const label = (room && room.label) || "";
  const flagged = !!(room && room.flag) || /\?/.test(label);
  let m = /^([NESW])(\d+[A-Z]?)\??$/i.exec(label.trim());
  if (m) {
    return { code: m[1].toUpperCase() + m[2].toUpperCase() + (flagged ? "?" : ""), unsure: flagged, letter: m[1].toUpperCase(), number: m[2].toUpperCase() };
  }
  m = /\(([NESW])(\d+[A-Z]?)\??\)\??$/i.exec(label);
  if (m) {
    return { code: m[1].toUpperCase() + m[2].toUpperCase() + (flagged ? "?" : ""), unsure: flagged, letter: m[1].toUpperCase(), number: m[2].toUpperCase() };
  }
  m = /^Classroom (\d+[A-Z]?)$/i.exec(label);
  if (m) {
    const letter = wingLetter(room.wing);
    if (!letter) return { code: m[1] + "?", unsure: true, letter: null, number: m[1] };
    return { code: letter + m[1], unsure: flagged, letter, number: m[1] };
  }
  return null;
}

export function roomDisplay(room) {
  const c = roomCode(room);
  return c ? c.code : roomName(room);
}

// "N412", "N 412", "north 412" → letter + number. Bare "412" → which-wing chooser.
export function parseRoomQuery(query) {
  const s = String(query || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  const named = /^(north|south|east|west)\s+(\d+[a-z]?)\??$/.exec(s);
  if (named) return { letter: named[1][0].toUpperCase(), number: named[2].toUpperCase(), bare: false };
  const coded = /^([nsew])\s*(\d+[a-z]?)\??$/.exec(s);
  if (coded) return { letter: coded[1].toUpperCase(), number: coded[2].toUpperCase(), bare: false };
  const bare = /^(\d+[a-z]?)\??$/.exec(s);
  if (bare) return { letter: null, number: bare[1].toUpperCase(), bare: true };
  return null;
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
  if (parsed) {
    const hits = rooms.filter((r) => {
      const c = roomCode(r);
      if (!c || c.number !== parsed.number) return false;
      if (parsed.letter) return c.letter === parsed.letter;
      return true;
    });
    // Bare numbers and coded queries prefer the code list (empty is fine: nothing matched).
    return hits;
  }
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return rooms.filter((r) => {
    const c = roomCode(r);
    return roomName(r).toLowerCase().includes(q) || (c && c.code.toLowerCase().includes(q)) || r.id.includes(q);
  });
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

// Full trip from the campus main gate: outdoor walk to the Main Building entrance, the lobby, then planRoute
// from the lobby You Are Here point. The outdoor leg is [lng, lat] from data/campus-osm.json (x = lng, y = lat).
export function planCampusRoute(paths, stairs, floors, campus, roomId) {
  const lobby = floors.find((f) => paths.floors[f.id] && paths.floors[f.id].start);
  if (!lobby) return { ok: false, message: "The lobby is not on the map yet." };
  const r = planRoute(paths, stairs, floors, { floorId: lobby.id, node: paths.floors[lobby.id].start }, roomId);
  if (!r.ok) return r;
  const outdoor = {
    floorId: "outdoor",
    ids: [],
    points: campus.walk.coordinates.map(([x, y]) => ({ x, y })),
  };
  return {
    ...r,
    legs: [outdoor, ...r.legs],
    steps: [
      { floorId: "outdoor", text: `Walk from the main gate to the Main Building entrance (${campus.walk.meters} m)` },
      { floorId: lobby.id, text: `Enter the lobby (${floorShort(lobby)})` },
      ...r.steps,
    ],
  };
}
