import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planRoute, type Paths, type Stairs, type Floor } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const lobby = { floorId: "main-1f-lobby", node: paths.floors["main-1f-lobby"].start as string };
const building = (id: string) => (floors.find((f) => f.id === id) as Floor & { building: string }).building;
const main = building("main-1f-lobby");

describe("every room from the Main lobby", () => {
  for (const floorId of Object.keys(paths.floors)) {
    const rooms = paths.floors[floorId].rooms;
    if (building(floorId) === main) {
      it(`routes to all ${rooms.length} rooms on ${floorId} with no zero-length step`, () => {
        for (const room of rooms) {
          const route = planRoute(paths, stairs, floors, lobby, room.id);
          assert.equal(route.ok, true, `${room.id}: ${route.ok ? "" : route.message}`);
          if (!route.ok) continue;
          for (const leg of route.legs) {
            for (let i = 1; i < leg.points.length; i++) {
              const a = leg.points[i - 1];
              const b = leg.points[i];
              assert.ok(a.x !== b.x || a.y !== b.y, `${room.id} ${leg.floorId} point ${i} repeats`);
            }
          }
        }
      });
    } else {
      it(`says ${floorId} is another building instead of inventing a stair`, () => {
        for (const room of rooms) {
          const route = planRoute(paths, stairs, floors, lobby, room.id);
          assert.equal(route.ok, false, room.id);
          if (route.ok) continue;
          assert.match(route.message, new RegExp(building(floorId).replace(/[()]/g, "\\$&")));
        }
      });
    }
  }
});
