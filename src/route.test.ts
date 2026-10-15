import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planRoute, planCampusRoute, NOT_ON_MAP, type Paths, type Stairs, type Floor, type Campus } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const campus = JSON.parse(readFileSync("data/campus.json", "utf8")) as Campus;
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
    assert.equal(r.steps[2].text, "Walk to Classroom 412 (North wing)");
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
      "Walk from the Guard House to the Main Building entrance",
      "Enter the lobby (1F)",
      "Walk to the East wing stairs by the dome",
      "Go up to 4F",
      "Walk to Classroom 412 (North wing)",
    ]);
  });

  it("says a missing room is not on the map yet", () => {
    const r = planRoute(paths, stairs, floors, lobby, "main-9f-room-999");
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.message, new RegExp(NOT_ON_MAP));
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

  it("every room label comes from docs/floorplans/rooms.json", () => {
    const labels = new Set((JSON.parse(readFileSync("docs/floorplans/rooms.json", "utf8")) as { label: string }[]).map((r) => r.label));
    for (const floor of Object.values(paths.floors)) {
      for (const r of floor.rooms) assert.ok(labels.has(r.label), `${r.label} is not in rooms.json`);
    }
  });
});
