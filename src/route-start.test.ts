import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planCampusRoute, campusStarts, GATE_START, searchRooms, type Paths, type Stairs, type Floor, type Campus } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as Campus;
const roomId = "main-4f-north-412";

function hav(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distToWalk(p: [number, number], line: [number, number][]) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const mx = 111320 * Math.cos(lat);
    const my = 110540;
    const ax = a[0] * mx, ay = a[1] * my, bx = b[0] * mx, by = b[1] * my, px = p[0] * mx, py = p[1] * my;
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    best = Math.min(best, Math.hypot(px - ax - dx * t, py - ay - dy * t));
  }
  return best;
}

function distToRing(p: [number, number], ring: [number, number][]) {
  return distToWalk(p, ring);
}

function arc(p: [number, number], line: [number, number][]) {
  let best = Infinity;
  let at = 0;
  let walked = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const seg = hav(a, b);
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const mx = 111320 * Math.cos(lat);
    const my = 110540;
    const ax = a[0] * mx, ay = a[1] * my, bx = b[0] * mx, by = b[1] * my, px = p[0] * mx, py = p[1] * my;
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    const d = Math.hypot(px - ax - dx * t, py - ay - dy * t);
    if (d < best) {
      best = d;
      at = walked + seg * t;
    }
    walked += seg;
  }
  return at;
}

describe("campus start", () => {
  it("defaults the outdoor leg to the main gate walk", () => {
    const plain = planCampusRoute(paths, stairs, floors, campus, roomId);
    const gated = planCampusRoute(paths, stairs, floors, campus, roomId, GATE_START);
    assert.equal(plain.ok, true);
    assert.equal(gated.ok, true);
    if (!plain.ok || !gated.ok) return;
    assert.equal(plain.steps[0].text, `Walk from the main gate to the ${campus.entrance.label} (${campus.walk.meters} m)`);
    assert.doesNotMatch(plain.steps[0].text, /\?/);
    assert.deepEqual(plain.legs[0].points, gated.legs[0].points);
    assert.deepEqual(plain.legs[0].points.map((p) => [p.x, p.y]), campus.walk.coordinates);
    assert.deepEqual(plain.steps.slice(1).map((s) => s.text), gated.steps.slice(1).map((s) => s.text));
  });

  it("lists the main gate and named buildings, with no question marks or OSM ids", () => {
    const starts = campusStarts(campus);
    const named = campus.buildings.features.filter((f) => f.properties.name && !f.properties.name.includes("?"));
    assert.equal(starts[0].id, GATE_START);
    assert.equal(starts[0].label, "Main gate");
    assert.equal(starts.length, named.length + 1);
    const labels = starts.slice(1).map((s) => s.label);
    assert.deepEqual(labels, labels.slice().sort((a, b) => a.localeCompare(b, "en") || 0));
    for (const s of starts) {
      assert.doesNotMatch(s.label, /\?/);
      assert.doesNotMatch(s.label, /way\/|relation\//);
    }
    for (const f of campus.buildings.features) {
      const row = starts.find((s) => s.id === f.properties.osm);
      if (!f.properties.name || f.properties.name.includes("?")) assert.equal(row, undefined);
      else assert.equal(row?.label, f.properties.name);
    }
  });

  it("walks from a building along the stored walkway to the entrance, then indoors", () => {
    const lib = campus.buildings.features.find((f) => f.properties.name === "Ninoy Aquino Library and Learning Resource Center");
    assert.ok(lib);
    const gate = planCampusRoute(paths, stairs, floors, campus, roomId);
    const r = planCampusRoute(paths, stairs, floors, campus, roomId, lib.properties.osm);
    assert.equal(r.ok, true);
    if (!r.ok || !gate.ok) return;
    const pts = r.legs[0].points.map((p) => [p.x, p.y] as [number, number]);
    const walk = campus.walk.coordinates;
    assert.deepEqual(pts.at(-1), campus.entrance.lngLat);
    assert.ok(distToRing(pts[0], lib.geometry.coordinates[0]) < 1);
    assert.ok(distToWalk(pts[0], walk) > 5);
    for (const p of pts.slice(1)) assert.ok(distToWalk(p, walk) < 1.5);
    let prev = -1;
    for (const p of pts.slice(1)) {
      const at = arc(p, walk);
      assert.ok(at + 0.5 >= prev);
      prev = at;
    }
    assert.equal(pts.some((p) => p[0] === walk[0][0] && p[1] === walk[0][1]), false);
    assert.match(r.steps[0].text, /Ninoy Aquino Library and Learning Resource Center to the East Wing entrance \(\d+ m\)/);
    assert.doesNotMatch(r.steps[0].text, /Resource Center \?/);
    assert.deepEqual(r.steps.slice(1).map((s) => s.text), gate.steps.slice(1).map((s) => s.text));
    assert.deepEqual(r.legs.slice(1).map((l) => l.floorId), gate.legs.slice(1).map((l) => l.floorId));
  });

  it("routes a named building without a question mark and leaves unnamed buildings off the From list", () => {
    const estimated = campus.buildings.features.find((f) => f.properties.name === "Community Building");
    const unnamed = campus.buildings.features.find((f) => !f.properties.name);
    assert.ok(estimated && unnamed);
    assert.match(estimated.properties.heightSource || "", /\?/);
    const row = campusStarts(campus).find((s) => s.id === estimated.properties.osm);
    assert.equal(row && row.label, "Community Building");
    const estimatedRoute = planCampusRoute(paths, stairs, floors, campus, roomId, estimated.properties.osm);
    const unnamedRoute = planCampusRoute(paths, stairs, floors, campus, roomId, unnamed.properties.osm);
    assert.equal(estimatedRoute.ok, true);
    assert.equal(unnamedRoute.ok, false);
    if (!estimatedRoute.ok || unnamedRoute.ok) return;
    assert.match(estimatedRoute.steps[0].text, /Walk from the Community Building to the East Wing entrance/);
    assert.doesNotMatch(estimatedRoute.steps[0].text, /\?/);
    assert.equal(unnamedRoute.message, "That building is not in the From list.");
    assert.doesNotMatch(unnamedRoute.message, /way\/|relation\//);
    assert.equal(searchRooms(paths, "Speech Laboratory").some((r) => r.label === "Speech Laboratory"), true);
    assert.equal(searchRooms(paths, "Maintenance").length, 0);
    assert.equal(searchRooms(paths, "PEM").length, 0);
  });

  it("rejects a start that is not a campus building", () => {
    const r = planCampusRoute(paths, stairs, floors, campus, roomId, "way/not-on-campus");
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.message, /not a campus building/);
  });
});
