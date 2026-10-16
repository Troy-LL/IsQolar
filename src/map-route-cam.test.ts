import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { planCampusRoute, GATE_START } from "../public/route.js";

const paths = JSON.parse(readFileSync(new URL("../data/paths.json", import.meta.url), "utf8"));
const stairs = JSON.parse(readFileSync(new URL("../data/stairs.json", import.meta.url), "utf8"));
const floors = JSON.parse(readFileSync(new URL("../data/floors.json", import.meta.url), "utf8"));
const campus = JSON.parse(readFileSync(new URL("../data/campus-osm.json", import.meta.url), "utf8"));

describe("RT38 outdoor step camera", () => {
  it("S501 gate walk has a multi-point outdoor leg", () => {
    const r = planCampusRoute(paths, stairs, floors, campus, "main-5f-s501", GATE_START);
    assert.equal(r.ok, true);
    assert.equal(r.steps[0].floorId, "outdoor");
    const leg = r.legs.find((l: { floorId: string }) => l.floorId === "outdoor");
    assert.ok(leg);
    assert.ok(leg.points.length >= 4);
    const xs = leg.points.map((p: { x: number }) => p.x);
    const ys = leg.points.map((p: { y: number }) => p.y);
    assert.ok(Math.max(...xs) - Math.min(...xs) > 0.0003 || Math.max(...ys) - Math.min(...ys) > 0.0003);
  });

  it("map.js outdoor fitLeg uses uniform padding fallback", () => {
    const src = readFileSync(new URL("../public/map.js", import.meta.url), "utf8");
    assert.match(src, /padding: 56/);
    assert.match(src, /cameraForBounds returns null for object padding/);
    assert.match(src, /FLY_IN \* 0\.55/);
    assert.match(src, /skipFit: true/);
    assert.match(src, /params\.has\("room"\)/);
    assert.match(src, /function roomFromLink/);
  });
});
