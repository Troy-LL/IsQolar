import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planRoute, planCampusRoute, NOT_ON_MAP, roomCode, roomDisplay, parseRoomQuery, searchRooms, isClassroom, isValidRoomCode, SEARCH_LIMIT, type Paths, type Stairs, type Floor, type Campus } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as Campus;
const lobby = { floorId: "main-1f-lobby", node: "start" };

describe("route", () => {
  it("routes on one floor (5F, You Are Here to N519)", () => {
    const r = planRoute(paths, stairs, floors, { floorId: "main-5f", node: "start" }, "main-5f-n519");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.legs.length, 1);
    assert.equal(r.legs[0].ids[0], "start");
    assert.equal(r.legs[0].ids.at(-1), "main-5f-n519");
    assert.deepEqual(r.steps.map((s) => s.text), ["Walk to N519"]);
  });

  it("routes across floors through one shared stairwell (lobby to 4F)", () => {
    const r = planRoute(paths, stairs, floors, lobby, "main-4f-north-412");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.legs.length, 2);
    assert.equal(r.legs[0].floorId, "main-1f-lobby");
    assert.equal(r.legs[1].floorId, "main-4f");
    assert.ok(r.stair);
    assert.equal(r.legs[0].ids.at(-1), r.stair);
    assert.equal(r.legs[1].ids[0], r.stair);
    assert.equal(r.steps[1].text, "Go up to 4F");
    assert.equal(r.steps[2].text, "Walk to N412");
  });

  it("routes lobby to 5F", () => {
    const r = planRoute(paths, stairs, floors, lobby, "main-5f-e501");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.stair, "stair-east-dome");
    assert.equal(r.steps[1].text, "Go up to 5F");
  });

  it("continues from outdoors: entrance, lobby, stairs, floor", () => {
    const r = planCampusRoute(paths, stairs, floors, campus, "main-4f-north-412");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.legs.map((l) => l.floorId), ["outdoor", "main-1f-lobby", "main-4f"]);
    assert.deepEqual(r.steps.map((s) => s.text), [
      `Walk from the main gate to the Main Building entrance (${campus.walk.meters} m)`,
      "Enter the lobby (1F)",
      "Walk to the East wing stairs by the dome",
      "Go up to 4F",
      "Walk to N412",
    ]);
  });

  it("says a missing room is not on the map yet", () => {
    const r = planRoute(paths, stairs, floors, lobby, "main-9f-room-999");
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.message, new RegExp(NOT_ON_MAP));
  });
});


describe("room codes", () => {
  it("uses poster classroom codes in the letter + 3-digit format", () => {
    const n = paths.floors["main-4f"].rooms.find((r) => r.id === "main-4f-north-412")!;
    const e = paths.floors["main-4f"].rooms.find((r) => r.id === "main-4f-east-412")!;
    const s = paths.floors["main-5f"].rooms.find((r) => r.id === "main-5f-s513")!;
    assert.equal(n.code, "N412");
    assert.equal(roomCode(n)!.code, "N412");
    assert.equal(roomCode(e)!.code, "E412");
    assert.equal(roomCode(s)!.code, "S513");
    assert.equal(roomDisplay(n), "N412");
  });

  it("rejects codes that are not wing letter + 3 digits", () => {
    assert.equal(isValidRoomCode("S7"), false);
    assert.equal(isValidRoomCode("W2"), false);
    assert.equal(isValidRoomCode("W51"), false);
    assert.equal(isValidRoomCode("N41"), false);
    assert.equal(isValidRoomCode("412"), false);
    assert.equal(isValidRoomCode("S513"), true);
    assert.equal(isValidRoomCode("S512A"), true);
    assert.equal(isValidRoomCode("N412"), true);
    assert.equal(roomCode({ label: "Accounting Office (S7)", kind: "office", id: "x", x: 0, y: 0, node: "c" }), null);
    assert.equal(roomCode({ label: "S7", kind: "office", id: "x", x: 0, y: 0, node: "c" }), null);
    assert.equal(roomCode({ label: "W51?", kind: "office", id: "x", x: 0, y: 0, node: "c", flag: "?" }), null);
  });

  it("parses N412, 'N 412' and 'north 412', and treats bare 412 as a chooser", () => {
    assert.deepEqual(parseRoomQuery("N412"), { letter: "N", number: "412", bare: false, letterOnly: false });
    assert.deepEqual(parseRoomQuery("N 412"), { letter: "N", number: "412", bare: false, letterOnly: false });
    assert.deepEqual(parseRoomQuery("north 412"), { letter: "N", number: "412", bare: false, letterOnly: false });
    assert.deepEqual(parseRoomQuery("412"), { letter: null, number: "412", bare: true, letterOnly: false });
    assert.deepEqual(parseRoomQuery("S"), { letter: "S", number: null, bare: false, letterOnly: true });
  });

  it("bare-number search lists each wing; a coded query goes to that room", () => {
    const bare = searchRooms(paths, "412");
    assert.equal(bare.length, 3);
    assert.deepEqual(bare.map((r) => roomCode(r)!.code).sort(), ["E412", "N412", "W412"]);
    const coded = searchRooms(paths, "N412");
    assert.equal(coded.length, 1);
    assert.equal(coded[0].id, "main-4f-north-412");
    assert.equal(searchRooms(paths, "north 412")[0].id, "main-4f-north-412");
    assert.equal(searchRooms(paths, "N 412")[0].id, "main-4f-north-412");
  });

  it("keeps 1F east, west, and north doors off the south corridor", () => {
    const southX = 0.165;
    const wing = /-(?:e|w|n)\d+$/i;
    const doors = paths.floors["main-1f-lobby"].nodes.filter((n) => wing.test(n.id));
    assert.ok(doors.length >= 6);
    for (const door of doors) {
      assert.ok(Math.abs(door.x - southX) > 0.05, door.id);
    }
  });
});


describe("search rules", () => {
  it("does not treat 1F lobby office codes (W2, S7) as classroom room codes", () => {
    const w2 = paths.floors["main-1f-lobby"].rooms.find((r) => r.id.endsWith("-w2"))!;
    const s7 = paths.floors["main-1f-lobby"].rooms.find((r) => r.id.endsWith("-s7"))!;
    assert.equal(w2.label, "Admission and Registration Office (W2)");
    assert.equal(s7.label, "Accounting Office (S7)");
    assert.equal(roomCode(w2), null);
    assert.equal(roomCode(s7), null);
    assert.equal(roomDisplay(w2), "Admission and Registration Office (W2)");
  });

  it("a lone wing letter returns no rooms (hint in the UI)", () => {
    assert.deepEqual(searchRooms(paths, "S"), []);
    assert.deepEqual(searchRooms(paths, "n"), []);
  });

  it("S never returns W rooms; S5 lists South-wing rooms by number", () => {
    const hits = searchRooms(paths, "S5");
    assert.ok(hits.length > 0);
    for (const r of hits) {
      const c = roomCode(r)!;
      assert.equal(c.letter, "S");
      assert.ok(c.number.startsWith("5"), c.code);
    }
    assert.equal(hits.some((r) => roomCode(r)?.letter === "W"), false);
  });

  it("results are sorted by floor, then numeric room number", () => {
    const hits = searchRooms(paths, "S5");
    for (let i = 1; i < hits.length; i++) {
      const a = hits[i - 1];
      const b = hits[i];
      const fa = Number(/(\d+)f/i.exec(a.floorId)![1]);
      const fb = Number(/(\d+)f/i.exec(b.floorId)![1]);
      assert.ok(fa <= fb, `${a.id} before ${b.id}`);
      if (fa === fb) {
        assert.ok(parseInt(roomCode(a)!.number, 10) <= parseInt(roomCode(b)!.number, 10));
      }
    }
  });

  it("classrooms rank above other place types", () => {
    // Free-text that hits both a classroom code-name and an office name.
    const hits = searchRooms(paths, "science");
    if (hits.length >= 2) {
      const firstClass = hits.findIndex((r) => isClassroom(r));
      const firstOther = hits.findIndex((r) => !isClassroom(r));
      if (firstClass >= 0 && firstOther >= 0) assert.ok(firstClass < firstOther);
    }
    assert.equal(SEARCH_LIMIT, 8);
  });
});

describe("route drawing", () => {
  it("never doubles back through a dead-end vertex", () => {
    for (const to of ["main-4f-north-412", "main-5f-e501", "main-5f-n519"]) {
      const r = planCampusRoute(paths, stairs, floors, campus, to);
      assert.ok(r.ok);
      for (const leg of r.legs.filter((l) => l.floorId !== "outdoor")) {
        const a = paths.floors[leg.floorId].aspect;
        const p = leg.points.map((q) => ({ x: q.x, y: q.y / a }));
        for (let i = 1; i < p.length - 1; i++) {
          const u = { x: p[i].x - p[i - 1].x, y: p[i].y - p[i - 1].y };
          const v = { x: p[i + 1].x - p[i].x, y: p[i + 1].y - p[i].y };
          const lu = Math.hypot(u.x, u.y);
          const lv = Math.hypot(v.x, v.y);
          if (lu < 1e-6 || lv < 1e-6) continue;
          assert.ok((u.x * v.x + u.y * v.y) / (lu * lv) > -0.95, `${to} ${leg.floorId} doubles back at point ${i}`);
        }
      }
    }
  });
  it("names the arrival stairs on the goal floor", () => {
    const r = planCampusRoute(paths, stairs, floors, campus, "main-4f-north-412");
    assert.ok(r.ok);
    assert.equal((r.legs.at(-1) as { arrive?: string }).arrive, "East wing stairs by the dome");
  });
});

describe("campus OSM data", () => {
  it("has PUP Main Building wings from OSM and a walk that starts at the gate", () => {
    const c = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as {
      buildings: { features: { properties: { name: string | null; main: boolean; height: number } }[] };
      gate: { lngLat: [number, number] };
      walk: { coordinates: [number, number][] };
    };
    const main = c.buildings.features.filter((f) => f.properties.main);
    assert.equal(main.length, 1, "Main Building should be one unioned shape");
    assert.equal(main[0].properties.height, 19.2, "design override: 6 floors x 3.2 m");
    const wings = (c as unknown as { wingLabels: { features: { properties: { name: string } }[] } }).wingLabels.features.map((f) => f.properties.name);
    for (const w of ["North Wing", "South Wing", "East Wing", "West Wing"]) assert.ok(wings.includes(w), `${w} missing`);
    const walk = (c as unknown as { walk: { coordinates: number[][] }; entrance: { lngLat: number[] } });
    assert.deepEqual(walk.walk.coordinates.at(-1), walk.entrance.lngLat, "walk ends on the entrance");
    for (const f of c.buildings.features) assert.ok(f.properties.height > 0);
    assert.deepEqual(c.walk.coordinates[0], c.gate.lngLat);
  });
});

describe("map routing data", () => {
  it("every node, room and stair is inside 0..1 and every edge points at real nodes", () => {
    for (const [floorId, floor] of Object.entries(paths.floors)) {
      const ids = new Set<string>();
      for (const n of floor.nodes) {
        assert.ok(!ids.has(n.id), `${floorId} duplicate node ${n.id}`);
        ids.add(n.id);
        assert.ok(n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1, `${floorId} ${n.id} out of 0..1`);
      }
      for (const [a, b] of floor.edges) {
        assert.ok(ids.has(a) && ids.has(b), `${floorId} edge ${a}-${b} has an unknown node`);
      }
      for (const r of floor.rooms) {
        assert.ok(ids.has(r.id) && ids.has(r.node), `${floorId} room ${r.id} not linked`);
        assert.ok(r.x >= 0 && r.x <= 1 && r.y >= 0 && r.y <= 1, `${floorId} room ${r.id} out of 0..1`);
      }
      for (const [id, p] of Object.entries(stairs.floors[floorId].stairs)) {
        assert.ok(ids.has(id), `${floorId} stair ${id} missing from paths`);
        assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1, `${floorId} stair ${id} out of 0..1`);
        assert.ok(stairs.stairs.some((s) => s.id === id), `${floorId} stair ${id} not in the shared list`);
      }
    }
  });

  it("every floor is one connected walk graph", () => {
    for (const [floorId, floor] of Object.entries(paths.floors)) {
      const adj = new Map<string, string[]>(floor.nodes.map((n) => [n.id, []]));
      for (const [a, b] of floor.edges) {
        adj.get(a)?.push(b);
        adj.get(b)?.push(a);
      }
      const seen = new Set<string>();
      const stack = [floor.nodes[0].id];
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(adj.get(id) ?? []));
      }
      assert.equal(seen.size, floor.nodes.length, `${floorId} has nodes no route can reach`);
    }
  });

  it("every floor has stairs and a connected path graph", () => {
    for (const floor of floors) {
      const graph = paths.floors[floor.id];
      assert.ok(graph, `${floor.id} has no path graph`);
      const entry = stairs.floors[floor.id];
      assert.ok(entry, `${floor.id} has no stairs entry`);
      const placed = Object.entries(entry.stairs);
      if (placed.length === 0) assert.match(entry.notes, /\?/, `${floor.id} has no stairs`);
      const ids = new Set(graph.nodes.map((n) => n.id));
      for (const [id, p] of placed) {
        assert.ok(ids.has(id), `${floor.id} stair ${id} is not on the path graph`);
        const node = graph.nodes.find((n) => n.id === id);
        assert.equal(node?.x, p.x, `${floor.id} ${id} x`);
        assert.equal(node?.y, p.y, `${floor.id} ${id} y`);
      }
      const adj = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));
      for (const [a, b] of graph.edges) {
        adj.get(a)?.push(b);
        adj.get(b)?.push(a);
      }
      const seen = new Set<string>();
      const stack = [graph.nodes[0].id];
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(adj.get(id) ?? []));
      }
      assert.equal(seen.size, graph.nodes.length, `${floor.id} path graph is not connected`);
    }
  });

  it("every room label comes from docs/floorplans/rooms.json", () => {
    const labels = new Set((JSON.parse(readFileSync("docs/floorplans/rooms.json", "utf8")) as { label: string }[]).map((r) => r.label));
    for (const floor of Object.values(paths.floors)) {
      for (const r of floor.rooms) assert.ok(labels.has(r.label), `${r.label} is not in rooms.json`);
    }
  });
});
