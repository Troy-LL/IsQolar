// Screen padding and chip placement for the phone sheet, floor tabs, and zoom buttons.

export function framePad({ width, height, desk, stacked, panelRight, sheetCover }) {
  // Phone floor tabs are a row under the search, so the right side stays open for room numbers.
  const side = stacked ? (desk ? 104 : 72) : 20;
  // Phone floor tabs occupy y=128–172. Keep the framed plan below that row.
  const top = desk ? 88 : stacked ? 188 : 96;
  const zoomGutter = stacked && !desk ? 60 : 16;
  const left = Math.max(12, panelRight || 0) + zoomGutter;
  const bottom = sheetCover > 0 ? sheetCover + 20 : desk ? 28 : 20;
  return { top, left, right: side, bottom, width, height };
}

export function freeRect(pad, width, height) {
  const left = pad.left;
  const top = pad.top;
  const right = Math.max(left + 48, width - pad.right);
  const bottom = Math.max(top + 48, height - pad.bottom);
  return { left, top, right, bottom };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Keep a chip inside the free map. Prefer a spot beside the anchor that misses the pin.
export function placeChip(anchor, size, bounds, avoid = []) {
  const maxX = Math.max(bounds.left, bounds.right - size.w);
  const maxY = Math.max(bounds.top, bounds.bottom - size.h);
  const clamp = (x, y) => ({
    x: Math.min(Math.max(x, bounds.left), maxX),
    y: Math.min(Math.max(y, bounds.top), maxY),
  });
  const fits = (p) => p.x >= bounds.left - 0.5
    && p.y >= bounds.top - 0.5
    && p.x + size.w <= bounds.right + 0.5
    && p.y + size.h <= bounds.bottom + 0.5;
  const clear = (p) => !avoid.some((o) => overlaps({ x: p.x, y: p.y, w: size.w, h: size.h }, o));
  const tries = [
    [anchor.x + 12, anchor.y - size.h - 12],
    [anchor.x - size.w - 12, anchor.y - size.h - 12],
    [anchor.x + 12, anchor.y + 16],
    [anchor.x - size.w - 12, anchor.y + 16],
    [bounds.left + 4, bounds.top + 4],
  ];
  for (const [x, y] of tries) {
    const p = clamp(x, y);
    if (fits(p) && clear(p)) return p;
  }
  return clamp(anchor.x + 12, anchor.y + 16);
}

// Grow a short lobby leg so the camera shows the line plus the dome, not a few pixels of corridor.
export function routeFrame(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const minSpan = 0.05;
  if (x1 - x0 < minSpan) {
    x0 = cx - minSpan / 2;
    x1 = cx + minSpan / 2;
  }
  if (y1 - y0 < minSpan) {
    y0 = cy - minSpan / 2;
    y1 = cy + minSpan / 2;
  }
  const px = (x1 - x0) * 0.08;
  const py = (y1 - y0) * 0.08;
  return [
    { x: x0 - px, y: y0 - py },
    { x: x1 + px, y: y1 + py },
  ];
}
