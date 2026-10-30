// Screen padding and chip placement for the sheet, floor tabs, and zoom buttons.

// Floor chrome is up when the indoor plan is open or the floor tabs are showing.
export function isStacked(root) {
  const body = root && root.body;
  if (!body || !body.classList) return false;
  const floors = typeof root.getElementById === "function" ? root.getElementById("floors") : null;
  return body.classList.contains("inside") || !!(floors && !floors.hidden);
}

// Phone stays flat and close so a short lobby leg is a line in the free area.
// Desktop keeps the tilted leg camera from before that phone framing.
export function legCamera(desk) {
  if (desk) return { pitch: 30, maxZoom: 18.4, zoomTrim: 0.2, usePadding: false };
  return { pitch: 0, maxZoom: 21.4, zoomTrim: 0, usePadding: true };
}

// Zoom, floor tabs, and compass. Phone zoom is on the left; the floor tabs are a column on the right.
export function controlRects({ width, height, sheetCover = 0, floors = 4, desk = width >= 900 }) {
  const n = Math.max(1, floors);
  if (!desk) {
    const zoom = { x: 12, y: height - sheetCover - 20 - 96, w: 44, h: 96 };
    const floorsW = 52;
    const floorsH = n * 36 + (n - 1) * 4 + 8;
    return {
      zoom,
      floors: { x: width - 12 - floorsW, y: 128, w: floorsW, h: floorsH },
      compass: { x: 12, y: 128, w: 44, h: 44 },
    };
  }
  const floorsW = 60;
  const floorsH = n * 44 + (n - 1) * 6 + 12;
  return {
    zoom: { x: width - 12 - 44, y: height - 24 - 96, w: 44, h: 96 },
    floors: { x: width - 12 - floorsW, y: height - 132 - floorsH, w: floorsW, h: floorsH },
    compass: { x: width - 16 - 44, y: 24, w: 44, h: 44 },
  };
}

export function framePad({ width, height, desk, stacked, panelRight, sheetCover }) {
  // Phone: left gutter clears zoom and the compass. Right inset clears the floor-tab column.
  const side = stacked ? (desk ? 104 : 72) : 20;
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

// Small boxes along a screen polyline so a chip can sit beside the line.
export function strokeBoxes(points, thickness = 14, step = 12) {
  const boxes = [];
  const add = (x, y) => boxes.push({
    x: x - thickness / 2,
    y: y - thickness / 2,
    w: thickness,
    h: thickness,
  });
  if (!points.length) return boxes;
  if (points.length === 1) {
    add(points[0].x, points[0].y);
    return boxes;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      add(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
  }
  return boxes;
}

// Keep a chip inside the free map. Prefer a nearby spot that misses the pin and the route.
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
  const tries = [];
  for (const d of [12, 36, 64, 96, 140]) {
    tries.push([anchor.x + d, anchor.y - size.h - d]);
    tries.push([anchor.x - size.w - d, anchor.y - size.h - d]);
    tries.push([anchor.x + d, anchor.y + d]);
    tries.push([anchor.x - size.w - d, anchor.y + d]);
    tries.push([anchor.x - size.w / 2, anchor.y - size.h - d]);
    tries.push([anchor.x - size.w / 2, anchor.y + d]);
  }
  const spanX = Math.max(0, bounds.right - bounds.left - size.w);
  const spanY = Math.max(0, bounds.bottom - bounds.top - size.h);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      tries.push([
        bounds.left + spanX * (col / 3),
        bounds.top + spanY * (row / 3),
      ]);
    }
  }
  let best = null;
  let bestD = Infinity;
  for (const [x, y] of tries) {
    const p = clamp(x, y);
    if (!fits(p) || !clear(p)) continue;
    const d = (p.x - anchor.x) ** 2 + (p.y - anchor.y) ** 2;
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

// Largest size that fits in the free area without covering the route or the pin.
export function firstClearChip(anchor, sizes, bounds, avoid = []) {
  for (const size of sizes) {
    const at = placeChip(anchor, size, bounds, avoid);
    if (at) return { x: at.x, y: at.y, w: size.w, h: size.h };
  }
  return null;
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
