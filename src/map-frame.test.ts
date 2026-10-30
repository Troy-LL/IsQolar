import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { controlRects, firstClearChip, framePad, freeRect, isStacked, legCamera, overlaps, placeChip, routeFrame, strokeBoxes } from "../public/map-frame.js";

function rectOf(bounds: { left: number; top: number; right: number; bottom: number }) {
  return { x: bounds.left, y: bounds.top, w: bounds.right - bounds.left, h: bounds.bottom - bounds.top };
}

function assertClear(
  chip: { x: number; y: number; w: number; h: number },
  free: { left: number; top: number; right: number; bottom: number },
  blocked: { x: number; y: number; w: number; h: number }[],
) {
  assert.ok(chip.x >= free.left - 0.5);
  assert.ok(chip.y >= free.top - 0.5);
  assert.ok(chip.x + chip.w <= free.right + 0.5);
  assert.ok(chip.y + chip.h <= free.bottom + 0.5);
  for (const box of blocked) assert.equal(overlaps(chip, box), false);
}

describe("map frame", () => {
  it("keeps a phone directions leg above the sheet and clear of zoom and floor tabs", () => {
    const pad = framePad({ width: 390, height: 844, desk: false, stacked: true, panelRight: 0, sheetCover: 477 });
    assert.ok(pad.top >= 180);
    assert.ok(pad.left >= 60);
    assert.ok(pad.right >= 64);
    assert.equal(pad.bottom, 497);
    const free = freeRect(pad, 390, 844);
    assert.ok(free.bottom <= 844 - 477);
    assert.ok(free.right <= 390 - 24);
    assert.ok(free.left >= 60);
  });

  it("keeps a desktop chip inside the viewport, to the right of the sheet", () => {
    const pad = framePad({ width: 1280, height: 800, desk: true, stacked: true, panelRight: 428, sheetCover: 0 });
    const bounds = freeRect(pad, 1280, 800);
    assert.ok(bounds.left >= 428);
    const placed = placeChip({ x: 1200, y: 420 }, { w: 260, h: 32 }, bounds, []);
    assert.ok(placed);
    assert.ok(placed.x >= bounds.left);
    assert.ok(placed.y >= bounds.top);
    assert.ok(placed.x + 260 <= bounds.right + 0.5);
    assert.ok(placed.y + 32 <= bounds.bottom + 0.5);
    assert.ok(placed.x + 260 <= 1280);
  });

  it("places the arrive chip above the phone sheet and off the room pin", () => {
    const bounds = { left: 72, top: 164, right: 300, bottom: 360 };
    const pin = { x: 180, y: 220, w: 44, h: 44 };
    const placed = placeChip({ x: 200, y: 250 }, { w: 180, h: 36 }, bounds, [pin]);
    assert.ok(placed);
    assert.ok(placed.y + 36 <= bounds.bottom);
    assert.ok(placed.x >= bounds.left);
    assert.ok(placed.x + 180 <= bounds.right + 0.5);
    assert.equal(overlaps({ x: placed.x, y: placed.y, w: 180, h: 36 }, pin), false);
  });

  it("grows a short lobby leg and still contains the original points", () => {
    const points = [
      { x: 0.4, y: 0.5 },
      { x: 0.407, y: 0.521 },
    ];
    const frame = routeFrame(points);
    const w = frame[1].x - frame[0].x;
    const h = frame[1].y - frame[0].y;
    assert.ok(w >= 0.05);
    assert.ok(h >= 0.05);
    assert.ok(w < 0.12);
    assert.ok(h < 0.12);
    for (const p of points) {
      assert.ok(p.x >= frame[0].x && p.x <= frame[1].x);
      assert.ok(p.y >= frame[0].y && p.y <= frame[1].y);
    }
    const wide = routeFrame([{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.25 }]);
    assert.ok(wide[1].x - wide[0].x >= 0.4);
  });

  it("keeps phone controls, the free rect, and a route chip from covering each other at 390x844", () => {
    const width = 390;
    const height = 844;
    const sheetCover = 477;
    const pad = framePad({ width, height, desk: false, stacked: true, panelRight: 0, sheetCover });
    const free = freeRect(pad, width, height);
    const controls = controlRects({ width, height, sheetCover, floors: 4, desk: false });
    const zones = [controls.zoom, controls.floors, controls.compass];
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) assert.equal(overlaps(zones[i], zones[j]), false);
      assert.equal(overlaps(zones[i], rectOf(free)), false);
    }
    const pin = { x: 168, y: 250, w: 36, h: 48 };
    const route = strokeBoxes([
      { x: 150, y: 270 },
      { x: 210, y: 300 },
    ], 18, 10);
    const size = { w: 150, h: 32 };
    const placed = placeChip({ x: 186, y: 274 }, size, free, [pin, ...route]);
    assert.ok(placed);
    assertClear({ x: placed.x, y: placed.y, ...size }, free, [pin, ...route, ...zones]);
    const n412 = [
      { x: 179, y: 311 }, { x: 173, y: 299 }, { x: 180, y: 289 }, { x: 186, y: 278 }, { x: 192, y: 267 },
      { x: 198, y: 257 }, { x: 204, y: 247 }, { x: 210, y: 237 }, { x: 216, y: 226 }, { x: 211, y: 224 },
    ];
    const n412route = strokeBoxes(n412, 18, 10);
    const n412pin = { x: 189, y: 180, w: 45, h: 62 };
    assert.equal(placeChip(n412[0], { w: 246, h: 42 }, free, [...n412route, n412pin]), null);
    const fitted = firstClearChip(n412[0], [{ w: 246, h: 42 }, { w: 200, h: 48 }, { w: 120, h: 68 }], free, [...n412route, n412pin]);
    assert.ok(fitted);
    assert.equal(fitted.w <= 160, true);
    assertClear(fitted, free, [...n412route, n412pin, ...zones]);
  });

  it("keeps desktop controls and a route chip inside the free rect at 1280x800", () => {
    const width = 1280;
    const height = 800;
    const pad = framePad({ width, height, desk: true, stacked: true, panelRight: 428, sheetCover: 0 });
    const free = freeRect(pad, width, height);
    const controls = controlRects({ width, height, sheetCover: 0, floors: 4, desk: true });
    const zones = [controls.zoom, controls.floors, controls.compass];
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) assert.equal(overlaps(zones[i], zones[j]), false);
      assert.equal(overlaps(zones[i], rectOf(free)), false);
    }
    assert.ok(free.left >= 428);
    const pin = { x: 900, y: 420, w: 36, h: 56 };
    const route = strokeBoxes([
      { x: 700, y: 360 },
      { x: 980, y: 520 },
    ], 18, 10);
    const size = { w: 240, h: 32 };
    const placed = placeChip({ x: 860, y: 440 }, size, free, [pin, ...route]);
    assert.ok(placed);
    assertClear({ x: placed.x, y: placed.y, ...size }, free, [pin, ...route, ...zones]);
    assert.ok(placed.x + size.w <= width);
  });

  it("treats the indoor plan and the visible floor tabs as the same stacked state", () => {
    const root = (inside: boolean, hidden: boolean) => ({
      body: { classList: { contains: (name: string) => inside && name === "inside" } },
      getElementById: (id: string) => (id === "floors" ? { hidden } : null),
    });
    assert.equal(isStacked(root(true, true)), true);
    assert.equal(isStacked(root(false, false)), true);
    assert.equal(isStacked(root(false, true)), false);
    assert.equal(isStacked(null), false);
  });

  it("keeps the desktop leg camera tilted and the phone leg camera flat", () => {
    assert.deepEqual(legCamera(true), { pitch: 30, maxZoom: 18.4, zoomTrim: 0.2, usePadding: false });
    assert.deepEqual(legCamera(false), { pitch: 0, maxZoom: 21.4, zoomTrim: 0, usePadding: true });
  });
});
