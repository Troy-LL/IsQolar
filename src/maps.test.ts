import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { projectFloor, unprojectFloor } from "../public/floor-geo.js";

const MAX_BYTES = 1024 * 1024;

async function assertFloorImage(path: string): Promise<void> {
  const info = await stat(path);
  assert.equal(info.isFile(), true);
  assert.ok(info.size < MAX_BYTES, `${path} is ${info.size} bytes`);
}

// Poster images keep a transparent margin around the drawn building, so a fitted image box reaches past the footprint.
const CORNER_TOL_DEG = 0.001;

function footprintBbox(osm: string): { west: number; south: number; east: number; north: number } {
  const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as {
    buildings: { features: { properties: { osm: string }; geometry: { coordinates: number[][][] } }[] };
  };
  const feature = campus.buildings.features.find((row) => row.properties.osm === osm);
  assert.ok(feature, osm);
  const ring = feature.geometry.coordinates[0];
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return { west: Math.min(...lngs), south: Math.min(...lats), east: Math.max(...lngs), north: Math.max(...lats) };
}

describe("floor overlay corners", () => {
  const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as {
    id: string;
    osm?: string;
    corners?: number[][];
  }[];

  it("every floor with corners lies in its footprint and round-trips 0..1", () => {
    for (const floor of floors.filter((row) => row.id.startsWith("main-"))) {
      assert.equal(floor.osm, "relation/6752508");
      assert.ok(floor.corners, floor.id);
    }
    const placed = floors.filter((floor) => floor.corners);
    assert.ok(placed.length >= 4);
    for (const floor of placed) {
      const corners = floor.corners;
      const osm = floor.osm;
      assert.ok(osm, floor.id);
      assert.ok(corners && corners.length === 4, floor.id);
      const box = footprintBbox(osm);
      for (const [lng, lat] of corners) {
        assert.ok(lng >= box.west - CORNER_TOL_DEG && lng <= box.east + CORNER_TOL_DEG, `${floor.id} lng`);
        assert.ok(lat >= box.south - CORNER_TOL_DEG && lat <= box.north + CORNER_TOL_DEG, `${floor.id} lat`);
      }
      const [midLng, midLat] = projectFloor(corners, 0.5, 0.5);
      assert.ok(midLng >= box.west && midLng <= box.east && midLat >= box.south && midLat <= box.north, `${floor.id} center`);
      const units: [number, number][] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0.25, 0.5],
        [0.5, 0.25],
      ];
      for (const [u, v] of units) {
        const [lng, lat] = projectFloor(corners, u, v);
        const [backU, backV] = unprojectFloor(corners, lng, lat);
        assert.ok(Math.abs(backU - u) < 1e-6, `${floor.id} u`);
        assert.ok(Math.abs(backV - v) < 1e-6, `${floor.id} v`);
      }
    }
  });
});

describe("tonight floor images", () => {
  it("public/maps/main-1f-lobby.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-1f-lobby.jpg");
  });

  it("public/maps/main-4f.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-4f.jpg");
  });

  it("public/maps/main-5f.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-5f.jpg");
  });
});
