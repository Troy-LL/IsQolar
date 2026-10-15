import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { checkMap, type MapInput } from "./map-check.js";

function map(over: Partial<MapInput> = {}): MapInput {
  const base: MapInput = {
    floors: [{ id: "main-1f-lobby", image: "public/maps/main-1f-lobby.png" }],
    paths: {
      floors: {
        "main-1f-lobby": {
          nodes: [
            { id: "room-a", x: 0.1, y: 0.2, kind: "room" },
            { id: "c-1", x: 0, y: 1, kind: "corridor" },
            { id: "start", x: 0.5, y: 0.5, kind: "start" },
          ],
          rooms: [{ id: "room-a", label: "Office A", kind: "office", x: 0.1, y: 0.2, node: "c-1" }],
        },
      },
      unplaced: [],
    },
    stairs: {
      stairs: [{ id: "stair-east-dome" }],
      floors: {
        "main-1f-lobby": { stairs: { "stair-east-dome": { x: 0.4, y: 0.4 } } },
      },
    },
    fileExists: () => true,
  };
  return { ...base, ...over, paths: over.paths ?? base.paths, stairs: over.stairs ?? base.stairs };
}

describe("map check", () => {
  it("accepts a floor whose room id is also its node id", () => {
    const report = checkMap(map());
    assert.equal(report.ok, true, report.errors.join("\n"));
    assert.equal(report.verifiedFalse, 0);
    assert.equal(report.questionLabels, 0);
  });

  it("fails on a duplicate floor id, room id, node id, or stair id", () => {
    const floorDup = checkMap(map({
      floors: [
        { id: "main-1f-lobby", image: "public/maps/a.png" },
        { id: "main-1f-lobby", image: "public/maps/a.png" },
      ],
    }));
    assert.equal(floorDup.ok, false);
    assert.ok(floorDup.errors.some((e) => e.includes("duplicate id")));

    const input = map();
    input.paths.floors["main-4f"] = {
      nodes: [{ id: "room-a", x: 0.2, y: 0.2, kind: "room" }],
      rooms: [{ id: "room-a", label: "Other", kind: "room", x: 0.2, y: 0.2, node: "room-a" }],
    };
    input.floors.push({ id: "main-4f", image: "public/maps/b.png" });
    const roomDup = checkMap(input);
    assert.equal(roomDup.ok, false);
    assert.ok(roomDup.errors.some((e) => e.includes("room-a")));

    const nodeDup = map();
    nodeDup.paths.floors["main-1f-lobby"].nodes.push({ id: "c-1", x: 0.3, y: 0.3, kind: "corridor" });
    const nodeReport = checkMap(nodeDup);
    assert.equal(nodeReport.ok, false);
    assert.ok(nodeReport.errors.some((e) => e.includes("c-1")));

    const stairDup = map();
    stairDup.stairs.stairs.push({ id: "stair-east-dome" });
    const stairReport = checkMap(stairDup);
    assert.equal(stairReport.ok, false);
    assert.ok(stairReport.errors.some((e) => e.includes("stair-east-dome")));
  });

  it("allows the same stair id on two floors", () => {
    const input = map();
    input.floors.push({ id: "main-4f", image: "public/maps/b.png" });
    input.paths.floors["main-4f"] = {
      nodes: [{ id: "stair-east-dome", x: 0.2, y: 0.3, kind: "stairs" }],
      rooms: [],
    };
    input.stairs.floors["main-4f"] = { stairs: { "stair-east-dome": { x: 0.2, y: 0.3 } } };
    const report = checkMap(input);
    assert.equal(report.ok, true, report.errors.join("\n"));
  });

  it("fails on an unknown floorId", () => {
    const input = map();
    input.paths.floors["no-such-floor"] = { nodes: [], rooms: [] };
    input.paths.unplaced = [{ floorId: "also-missing", label: "Lost" }];
    input.stairs.floors["stair-missing"] = { stairs: {} };
    const report = checkMap(input);
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("no-such-floor")));
    assert.ok(report.errors.some((e) => e.includes("also-missing")));
    assert.ok(report.errors.some((e) => e.includes("stair-missing")));
  });

  it("fails when x or y is outside 0..1", () => {
    const room = map();
    room.paths.floors["main-1f-lobby"].rooms[0].y = 1.01;
    assert.equal(checkMap(room).ok, false);

    const node = map();
    node.paths.floors["main-1f-lobby"].nodes[0].x = -0.01;
    assert.equal(checkMap(node).ok, false);

    const stair = map();
    stair.stairs.floors["main-1f-lobby"].stairs["stair-east-dome"].x = 2;
    assert.equal(checkMap(stair).ok, false);
  });

  it("fails on an unknown room kind and allows the known set", () => {
    const bad = map();
    bad.paths.floors["main-1f-lobby"].rooms[0].kind = "corridor";
    const report = checkMap(bad);
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("unknown kind")));

    for (const kind of ["room", "office", "cr", "stairs", "exit", "elevator", "assembly", "other"]) {
      const ok = map();
      ok.paths.floors["main-1f-lobby"].rooms[0].kind = kind;
      assert.equal(checkMap(ok).ok, true, kind);
    }
  });

  it("fails when an image path is not a file", () => {
    const report = checkMap(map({
      floors: [{
        id: "main-1f-lobby",
        image: "public/maps/missing.png",
        imageWebp: "public/maps/missing.webp",
        poster: "public/maps/missing.jpg",
      }],
      fileExists: (path) => path === "public/maps/missing.webp",
    }));
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("public/maps/missing.png")));
    assert.ok(report.errors.some((e) => e.includes("public/maps/missing.jpg")));
    assert.equal(report.errors.some((e) => e.includes("missing.webp")), false);
  });

  it("prints verified false rows and labels that contain ?", () => {
    const input = map();
    const floor = input.paths.floors["main-1f-lobby"];
    floor.rooms.push({ id: "q", label: "W51?", kind: "room", x: 0.2, y: 0.2, node: "c-1", flag: "?" });
    floor.rooms.push({ id: "flagged", label: "Storage Room", kind: "room", x: 0.3, y: 0.3, node: "c-1", flag: "?" });
    floor.rooms.push({ id: "explicit", label: "Desk", kind: "office", x: 0.4, y: 0.4, node: "c-1", verified: false });
    floor.nodes.push({ id: "q", x: 0.2, y: 0.2, kind: "room" });
    floor.nodes.push({ id: "flagged", x: 0.3, y: 0.3, kind: "room" });
    floor.nodes.push({ id: "explicit", x: 0.4, y: 0.4, kind: "room" });
    const report = checkMap(input);
    assert.equal(report.ok, true, report.errors.join("\n"));
    assert.equal(report.verifiedFalse, 3);
    assert.equal(report.questionLabels, 1);
  });

  it("fails when a visible list contains ? or an OSM id", () => {
    const input = map();
    input.campus = {
      buildings: {
        features: [
          { properties: { osm: "way/1", name: "Hall?" } },
          { properties: { osm: "way/2", name: "Block (way/2)" } },
          { properties: { osm: "way/3", name: null } },
        ],
      },
      entrance: { label: "Door ?" },
    };
    const report = checkMap(input);
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("Hall?")));
    assert.ok(report.errors.some((e) => e.includes("way/2")));
    assert.ok(report.errors.some((e) => e.includes("Door ?")));
    assert.equal(report.errors.some((e) => e.includes("way/3")), false);
  });

  it("accepts the floors, paths, and images on main", () => {
    const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as MapInput["floors"];
    const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as MapInput["paths"];
    const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as MapInput["stairs"];
    const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as MapInput["campus"];
    const report = checkMap({ floors, paths, stairs, campus, fileExists: existsSync });
    assert.equal(report.ok, true, report.errors.join("\n"));
    let verified = 0;
    let questions = 0;
    for (const floor of Object.values(paths.floors)) {
      for (const room of floor.rooms) {
        if (room.verified === false || (room.flag != null && room.flag !== "")) verified += 1;
        if (room.label.includes("?")) questions += 1;
      }
    }
    for (const row of paths.unplaced) {
      if (row.label.includes("?")) questions += 1;
    }
    assert.equal(report.verifiedFalse, verified);
    assert.equal(report.questionLabels, questions);
    assert.ok(verified > 0);
    assert.ok(questions > 0);
  });
});
