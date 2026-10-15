import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Pt = [number, number];

// Wing outline = the single footprint path; rooms = polygons inside <g class="rooms">.
function parse(svg: string): { wing: Pt[]; rooms: { id: string; pts: Pt[] }[] } {
  const d = /<path class="wing"[^>]*\sd="([^"]+)"/.exec(svg);
  assert.ok(d, "floor SVG has a wing outline path");
  const nums = (d[1].match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const wing: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) wing.push([nums[i], nums[i + 1]]);
  const start = svg.indexOf('<g class="rooms">');
  const block = svg.slice(start, svg.indexOf("</g>", start));
  const rooms = [...block.matchAll(/<polygon([^>]*)points="([^"]+)"/g)].map((m, i) => ({
    id: (/data-room="([^"]+)"/.exec(m[1]) || [])[1] || `cell#${i}`,
    pts: m[2].trim().split(/\s+/).map((p) => p.split(",").map(Number) as Pt),
  }));
  return { wing, rooms };
}

function inside([x, y]: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function distToEdge([x, y]: Pt, poly: Pt[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

describe("floor plan geometry", () => {
  for (const floor of ["main-1f-lobby", "main-4f", "main-5f"]) {
    it(`every room polygon on ${floor} sits inside its wing outline`, () => {
      const { wing, rooms } = parse(readFileSync(`public/maps/${floor}.svg`, "utf8"));
      assert.ok(rooms.length > 0);
      const out = rooms.filter((r) => r.pts.some((p) => !inside(p, wing) && distToEdge(p, wing) > 1.5)).map((r) => r.id);
      assert.deepEqual(out, [], `rooms outside the wing outline: ${out.join(", ")}`);
    });
  }
});
