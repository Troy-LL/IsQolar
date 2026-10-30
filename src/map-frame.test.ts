import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { framePad, freeRect, overlaps, placeChip, routeFrame } from "../public/map-frame.js";

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

  it("pins the overlay camera to the padded flat frame and parks phone zoom off the floor tabs", () => {
    const js = readFileSync(new URL("../public/map.js", import.meta.url), "utf8");
    assert.match(js, /routeFrame\(leg\.points\)/);
    assert.match(js, /pitch: 0, bearing, padding/);
    assert.match(js, /function placeArriveChip/);
    const css = readFileSync(new URL("../public/map.css", import.meta.url), "utf8");
    assert.match(css, /@media \(max-width: 899px\) \{\s*\.zoomctl \{ left: 12px; right: auto; \}/);
    assert.match(css, /\.floors \{ top: 128px; left: auto; right: 12px; flex-direction: column;/);
  });
});
