import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planCampusRoute, campusStarts, allRooms, type Paths, type Stairs, type Floor, type Campus, type Point } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as Campus;

const M_PER_DEG_LAT = 110540;

interface Pair {
  start: string;
  room: string;
  skip?: string;
}

function mPerDegLng(lat: number): number {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

function hav(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distToLine(p: [number, number], line: [number, number][]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const mx = mPerDegLng(lat);
    const ax = a[0] * mx;
    const ay = a[1] * M_PER_DEG_LAT;
    const bx = b[0] * mx;
    const by = b[1] * M_PER_DEG_LAT;
    const px = p[0] * mx;
    const py = p[1] * M_PER_DEG_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    best = Math.min(best, Math.hypot(px - ax - dx * t, py - ay - dy * t));
  }
  return best;
}

function closestMeters(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): number {
  const lat = (a[1] + b[1] + c[1] + d[1]) / 4;
  const mx = mPerDegLng(lat);
  const xy = (p: [number, number]) => [p[0] * mx, p[1] * M_PER_DEG_LAT] as [number, number];
  const A = xy(a);
  const B = xy(b);
  const C = xy(c);
  const D = xy(d);
  const d1x = B[0] - A[0];
  const d1y = B[1] - A[1];
  const d2x = D[0] - C[0];
  const d2y = D[1] - C[1];
  const rx = A[0] - C[0];
  const ry = A[1] - C[1];
  const ab2 = d1x * d1x + d1y * d1y;
  const cd2 = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  const eps = 1e-12;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  let s = 0;
  let t = 0;
  if (ab2 <= eps && cd2 <= eps) {
    s = 0;
    t = 0;
  } else if (ab2 <= eps) {
    s = 0;
    t = clamp(f / cd2);
  } else {
    const dot = d1x * rx + d1y * ry;
    if (cd2 <= eps) {
      t = 0;
      s = clamp(-dot / ab2);
    } else {
      const along = d1x * d2x + d1y * d2y;
      const denom = ab2 * cd2 - along * along;
      s = denom > eps ? clamp((along * f - dot * cd2) / denom) : 0;
      t = (along * s + f) / cd2;
      if (t < 0) {
        t = 0;
        s = clamp(-dot / ab2);
      } else if (t > 1) {
        t = 1;
        s = clamp((along - dot) / ab2);
      }
    }
  }
  return Math.hypot(A[0] + d1x * s - (C[0] + d2x * t), A[1] + d1y * s - (C[1] + d2y * t));
}

function approachMeters(fromId: string): number {
  if (fromId === "gate") return 0;
  const feature = campus.buildings.features.find((f) => f.properties.osm === fromId);
  if (!feature) return 0;
  const ring = feature.geometry.coordinates[0];
  const walk = campus.walk.coordinates;
  let best = Infinity;
  for (let edge = 0; edge < ring.length - 1; edge++) {
    for (let i = 0; i < walk.length - 1; i++) {
      best = Math.min(best, closestMeters(ring[edge], ring[edge + 1], walk[i], walk[i + 1]));
    }
  }
  return best;
}

function edgeLengths(floorId: string): number[] {
  const floor = paths.floors[floorId];
  const aspect = floor.aspect || 1;
  const nodes = new Map(floor.nodes.map((n) => [n.id, n]));
  const lens: number[] = [];
  for (const [a, b] of floor.edges) {
    const na = nodes.get(a);
    const nb = nodes.get(b);
    if (!na || !nb) continue;
    const d = Math.hypot((na.x - nb.x) * aspect, na.y - nb.y);
    if (d > 0) lens.push(d);
  }
  return lens;
}

interface Limits {
  indoorZero: number;
  shortestEdge: number;
  shortestFloor: string;
  floorMax: { floorId: string; max: number }[];
  outdoorZero: number;
  onWalk: number;
  shortestWalk: number;
  longestWalk: number;
  longestApproach: number;
}

function deriveLimits(): Limits {
  let shortestEdge = Infinity;
  let shortestFloor = "";
  const floorMax: { floorId: string; max: number }[] = [];
  for (const floorId of Object.keys(paths.floors)) {
    const lens = edgeLengths(floorId);
    const min = Math.min(...lens);
    const max = Math.max(...lens);
    if (min < shortestEdge) {
      shortestEdge = min;
      shortestFloor = floorId;
    }
    floorMax.push({ floorId, max });
  }
  const walkLens: number[] = [];
  for (let i = 1; i < campus.walk.coordinates.length; i++) {
    const d = hav(campus.walk.coordinates[i - 1], campus.walk.coordinates[i]);
    if (d > 0) walkLens.push(d);
  }
  const shortestWalk = Math.min(...walkLens);
  const longestWalk = Math.max(...walkLens);
  let longestApproach = 0;
  for (const start of campusStarts(campus)) longestApproach = Math.max(longestApproach, approachMeters(start.id));
  return {
    indoorZero: shortestEdge * 1e-4,
    shortestEdge,
    shortestFloor,
    floorMax,
    outdoorZero: shortestWalk * 0.5,
    onWalk: shortestWalk * 0.5,
    shortestWalk,
    longestWalk,
    longestApproach,
  };
}

function formatLimits(limits: Limits): string {
  const floors = limits.floorMax.map((f) => `  ${f.floorId} ${f.max.toFixed(6)}`).join("\n");
  return [
    "route length limits",
    `indoor zero-length below ${limits.indoorZero.toExponential(3)} (1e-4 of the shortest edge ${limits.shortestEdge.toExponential(3)} on ${limits.shortestFloor})`,
    "indoor teleport above the longest edge on that floor",
    floors,
    `outdoor zero-length below ${limits.outdoorZero.toFixed(3)} m (half the shortest walk segment ${limits.shortestWalk.toFixed(3)} m)`,
    `outdoor on-walk tolerance ${limits.onWalk.toFixed(3)} m`,
    `outdoor teleport above ${limits.longestWalk.toFixed(3)} m when the segment stays on the walk`,
    `longest building approach ${limits.longestApproach.toFixed(3)} m`,
  ].join("\n");
}

function xy(p: Point): [number, number] {
  return [p.x, p.y];
}

function onStart(p: Point, fromId: string, limits: Limits): boolean {
  if (fromId === "gate") {
    return hav(xy(p), campus.gate.lngLat) <= limits.onWalk || distToLine(xy(p), campus.walk.coordinates) <= limits.onWalk;
  }
  const feature = campus.buildings.features.find((f) => f.properties.osm === fromId);
  if (!feature) return false;
  return distToLine(xy(p), feature.geometry.coordinates[0]) <= limits.onWalk;
}

function problemsFor(pair: Pair, limits: Limits): string[] {
  const found: string[] = [];
  const route = planCampusRoute(paths, stairs, floors, campus, pair.room, pair.start);
  if (!route.ok) return [`route is not ok: ${route.message}`];
  const outdoor = route.legs.find((leg) => leg.floorId === "outdoor");
  if (!outdoor || outdoor.points.length === 0) found.push("graph walk is not connected outdoors");
  else if (outdoor.points.length === 1) {
    if (hav(xy(outdoor.points[0]), campus.entrance.lngLat) > limits.onWalk) found.push("graph walk is not connected outdoors");
  } else {
    const cap = approachMeters(pair.start) + limits.longestWalk;
    for (let i = 1; i < outdoor.points.length; i++) {
      const a = outdoor.points[i - 1];
      const b = outdoor.points[i];
      const len = hav(xy(a), xy(b));
      if (len < limits.outdoorZero) found.push("zero-length segment outdoors");
      const aOn = distToLine(xy(a), campus.walk.coordinates) <= limits.onWalk;
      const bOn = distToLine(xy(b), campus.walk.coordinates) <= limits.onWalk;
      if (aOn && bOn) {
        if (len > limits.longestWalk * (1 + 1e-6)) found.push("teleport segment outdoors");
      } else if (i === 1 && bOn && onStart(a, pair.start, limits)) {
        if (len > cap + limits.onWalk) found.push("teleport segment outdoors");
      } else found.push("graph walk is not connected outdoors");
    }
  }
  const indoor = route.legs.filter((leg) => leg.floorId !== "outdoor");
  for (let i = 1; i < indoor.length; i++) {
    const prev = indoor[i - 1];
    const next = indoor[i];
    if (prev.floorId === next.floorId) continue;
    const stairId = prev.ids.at(-1);
    const listed = !!stairId
      && !!stairs.floors[prev.floorId]?.stairs[stairId]
      && !!stairs.floors[next.floorId]?.stairs[stairId];
    if (!stairId || stairId !== next.ids[0] || !listed) {
      found.push(`floor change is not a shared stair (${prev.floorId} to ${next.floorId})`);
    }
  }
  const zeroFloors = new Set<string>();
  const teleFloors = new Set<string>();
  for (const leg of indoor) {
    const floor = paths.floors[leg.floorId];
    if (!floor) {
      found.push("graph walk is not connected");
      continue;
    }
    const nodes = new Set(floor.nodes.map((n) => n.id));
    const edges = new Set(floor.edges.map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)));
    if (leg.ids.length === 0) found.push(`graph walk is not connected on ${leg.floorId}`);
    for (let i = 0; i < leg.ids.length; i++) {
      if (!nodes.has(leg.ids[i])) found.push(`graph walk is not connected on ${leg.floorId}`);
      if (i === 0) continue;
      const left = leg.ids[i - 1];
      const right = leg.ids[i];
      const key = left < right ? `${left}|${right}` : `${right}|${left}`;
      if (!edges.has(key)) found.push(`graph walk is not connected on ${leg.floorId}`);
    }
    const aspect = floor.aspect || 1;
    const maxEdge = Math.max(...edgeLengths(leg.floorId));
    for (let i = 1; i < leg.points.length; i++) {
      const a = leg.points[i - 1];
      const b = leg.points[i];
      const d = Math.hypot((a.x - b.x) * aspect, a.y - b.y);
      if (d < limits.indoorZero) zeroFloors.add(leg.floorId);
      if (d > maxEdge * (1 + 1e-6)) teleFloors.add(leg.floorId);
    }
  }
  if (zeroFloors.size) found.push(`zero-length segment on ${[...zeroFloors].join(", ")}`);
  if (teleFloors.size) found.push(`teleport segment on ${[...teleFloors].join(", ")}`);
  return [...new Set(found)];
}

function questioned(room: { label: string; flag?: string }): boolean {
  return room.label.includes("?") || (room.flag ?? "").includes("?");
}

const PAIRS: Pair[] = [
  { start: "gate", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772152", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/131706201", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772144", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772153", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/126342422", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781658", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772178", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/562503761", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/176463920", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/1039554051", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/961977252", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/1462058116", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/1039682259", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772143", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/583440438", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330772142", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/1178535808", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "relation/6752508", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781634", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/176463919", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/1462058112", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/131706215", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781650", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781651", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/561446416", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/741077558", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781628", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781626", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781659", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/131706205", room: "main-1f-lobby-admission-and-registration-office-w2" },
  { start: "way/330781640", room: "main-1f-lobby-admission-and-registration-office-w2" },
  // TODO way/330772152 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772152", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/131706201 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/131706201", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330772144 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772144", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330772153 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772153", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/126342422 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/126342422", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781658 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781658", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330772178 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772178", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/562503761 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/562503761", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/176463920 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/176463920", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/1039554051 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/1039554051", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/961977252 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/961977252", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/1462058116 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/1462058116", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/1039682259 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/1039682259", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330772143 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772143", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/583440438 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/583440438", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330772142 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330772142", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/1178535808 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/1178535808", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO relation/6752508 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "relation/6752508", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781634 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781634", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/176463919 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/176463919", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/1462058112 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/1462058112", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/131706215 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/131706215", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781650 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781650", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781651 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781651", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/561446416 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/561446416", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/741077558 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/741077558", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781628 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781628", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781626 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781626", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781659 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781659", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/131706205 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/131706205", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO way/330781640 -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "way/330781640", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  { start: "gate", room: "main-1f-lobby-office-for-scholarship-and-financial-assistance-w4" },
  // TODO gate -> main-1f-lobby-accounting-office-s7: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-accounting-office-s7", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-accounting-division-students-services-section-s8: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-accounting-division-students-services-section-s8", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-payroll-section-s9: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-payroll-section-s9", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-office-of-the-university-registrar-s1: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-office-of-the-university-registrar-s1", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-students-records-office-s2: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-students-records-office-s2", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-human-resource-management-division-s3: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-human-resource-management-division-s3", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-budget-services-s4: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-budget-services-s4", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-property-extension-office-s5: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-property-extension-office-s5", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-1f-lobby-cashier-s6: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-cashier-s6", skip: "zero-length segment on main-1f-lobby" },
  { start: "gate", room: "main-1f-lobby-procurement-office-n1" },
  { start: "gate", room: "main-1f-lobby-central-records-office-n2" },
  { start: "gate", room: "main-1f-lobby-commission-on-audit-office-n3" },
  { start: "gate", room: "main-1f-lobby-campus-ministry-office-n4" },
  { start: "gate", room: "main-1f-lobby-security-office-n5" },
  { start: "gate", room: "main-1f-lobby-free-pup-office-e1" },
  { start: "gate", room: "main-1f-lobby-hrd-records-office-e2" },
  { start: "gate", room: "main-1f-lobby-department-of-military-science-and-tactics-office-e3" },
  { start: "gate", room: "main-1f-lobby-corps-of-cadets-headquarters-e4" },
  { start: "gate", room: "main-1f-lobby-medical-clinic-services-e5" },
  { start: "gate", room: "main-1f-lobby-dental-clinic-services-e6" },
  { start: "gate", room: "main-1f-lobby-office-of-the-director-medical-health-services-e7" },
  { start: "gate", room: "main-1f-lobby-office-of-the-director-public-affairs-office-e8" },
  // TODO gate -> main-1f-lobby-university-consumers-cooperative-dome: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-1f-lobby-university-consumers-cooperative-dome", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-4f-inst-of-social-history: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-inst-of-social-history", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-speech-laboratory: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-speech-laboratory", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-training-center: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-training-center", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-extension-center: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-extension-center", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-student-center: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-student-center", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-student-lounge: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-student-lounge", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-institutional-planning-office: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-institutional-planning-office", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-vacant-room: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-vacant-room", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-office-north-wing: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-office-north-wing", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-4th-floor-dome: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-4th-floor-dome", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-401: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-401", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-403: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-403", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-405: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-405", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-407: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-407", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-409: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-409", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-411: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-411", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-413: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-413", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-415: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-415", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-417: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-417", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-402: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-402", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-404: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-404", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-406: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-406", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-408: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-408", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-410: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-410", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-412: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-412", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-414: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-414", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-416: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-416", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-north-418: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-north-418", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-417: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-417", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-415: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-415", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-413: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-413", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-411: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-411", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-409: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-409", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-407: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-407", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-405: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-405", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-403: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-403", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-401: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-401", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-418: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-418", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-416: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-416", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-414: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-414", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-412: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-412", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-410: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-410", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-408: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-408", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-406: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-406", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-404: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-404", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-east-402: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-east-402", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-418: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-418", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-416: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-416", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-414: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-414", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-412: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-412", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-410: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-410", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-408: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-408", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-406: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-406", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-404: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-404", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-417: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-417", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-415: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-415", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-413: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-413", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-411: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-411", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-409: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-409", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-407: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-407", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-405: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-405", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-403: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-403", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-4f-west-401: zero-length segment on main-1f-lobby, main-4f
  { start: "gate", room: "main-4f-west-401", skip: "zero-length segment on main-1f-lobby, main-4f" },
  // TODO gate -> main-5f-bayan-muna-nnara-gabriela-office-w51: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-bayan-muna-nnara-gabriela-office-w51", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-comfort-room-west: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-comfort-room-west", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s506: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s506", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s505: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s505", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s504: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s504", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s507: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s507", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s508: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s503a: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s503a", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s509: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s509", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s502: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s502", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s510: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s510", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s501: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s501", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s511: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s511", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s512a: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s512a", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s518: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s518", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s517: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s517", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s512b: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s512b", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s516: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s516", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s513: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s513", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s514: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s514", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-s515: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-s515", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n500: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n500", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n502: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n502", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n504: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n504", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n506: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n506", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n508: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n510: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n510", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n512: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n512", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n514: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n514", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n516: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n516", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n518: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n518", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n501: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n501", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n503: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n503", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n505: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n505", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n507: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n507", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n509: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n509", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n511: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n511", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n513: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n513", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n515: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n515", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n517: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n517", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-n519: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-n519", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-comfort-room-north: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-comfort-room-north", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e501: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e501", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e503: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e503", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e505: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e505", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e507: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e507", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e509: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e509", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e511: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e511", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e513: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e513", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e515: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e515", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e517: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e517", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e519: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e519", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e500: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e500", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e502: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e502", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e504: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e504", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e506: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e506", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e508: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e508", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e510: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e510", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e512: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e512", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e514: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e514", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e516: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e516", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-e518: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-e518", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-comfort-room-east: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-comfort-room-east", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-5th-floor-dome: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-5th-floor-dome", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-elevator-south-wing: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-elevator-south-wing", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-ccmit-server-room-s507: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-ccmit-server-room-s507", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-college-of-accountancy-faculty-room-n500: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-college-of-accountancy-faculty-room-n500", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-college-of-accountancy-student-council-office-e519: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-college-of-accountancy-student-council-office-e519", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-college-of-science-accreditation-center-s516: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-college-of-science-accreditation-center-s516", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-college-of-science-faculty-room-s514: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-college-of-science-faculty-room-s514", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-curriculum-planning-and-development-office-s506: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-curriculum-planning-and-development-office-s506", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-jpia-office-e500: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-jpia-office-e500", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-samasa-coa-n519: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-samasa-coa-n519", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-5f-sci-tech-research-and-development-center-s512a: zero-length segment on main-1f-lobby, main-5f
  { start: "gate", room: "main-5f-sci-tech-research-and-development-center-s512a", skip: "zero-length segment on main-1f-lobby, main-5f" },
  // TODO gate -> main-2f-w220: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w220", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w218: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w218", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w216: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w216", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w214: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w214", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w212: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w212", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w210: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w210", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w208: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w208", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w206: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w206", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w204: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w204", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w202: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w202", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w219: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w219", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w217: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w217", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w215: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w215", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w213: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w213", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-faculty-circle-w211: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-faculty-circle-w211", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w209: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w209", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w207: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w207", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w205: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w205", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-pupffai-office-w203: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-pupffai-office-w203", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-research-center-w201: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-research-center-w201", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-w200: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-w200", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-cooperatives-office-e201: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-cooperatives-office-e201", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-cc-extension-services-office-e203: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-cc-extension-services-office-e203", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-cc-academic-research-and-administration-office-e205: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-cc-academic-research-and-administration-office-e205", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e207: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e207", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e209: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e209", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e211: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e211", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e213: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e213", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e215: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e215", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e217: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e217", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e219: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e219", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-unyon-ng-mga-guro-sa-pup-e200: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-unyon-ng-mga-guro-sa-pup-e200", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-national-service-training-program-office-e202: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-national-service-training-program-office-e202", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-income-generating-project-office-e204: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-income-generating-project-office-e204", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e206: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e206", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e208: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e208", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e210: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e210", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e212: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e212", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e214: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e214", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e216: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e216", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e218: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e218", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-e220: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-e220", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-vp-for-academic-affairs-s14: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-vp-for-academic-affairs-s14", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-vp-for-research-extension-and-dev-t-s13: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-vp-for-research-extension-and-dev-t-s13", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-dr-ofelia-m-carague-conference-room-s12: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-dr-ofelia-m-carague-conference-room-s12", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-vp-for-administration-s11: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-vp-for-administration-s11", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-vp-for-student-services-s10: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-vp-for-student-services-s10", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-university-board-secretary-s1: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-university-board-secretary-s1", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-dr-pablo-t-mateo-jr-conference-room-s2: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-dr-pablo-t-mateo-jr-conference-room-s2", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-president-s3: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-president-s3", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-university-info-system-network-operations-center-s9: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-university-info-system-network-operations-center-s9", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-network-operations-center-server-room-s8: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-network-operations-center-server-room-s8", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-vp-for-finance-s7: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-vp-for-finance-s7", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-executive-director-s4: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-executive-director-s4", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-dr-zenaida-a-olonan-conference-room-s5: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-dr-zenaida-a-olonan-conference-room-s5", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-office-of-the-executive-vice-president-s6: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-office-of-the-executive-vice-president-s6", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-science-office-n1: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-science-office-n1", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-cooperatives-and-social-dev-t-office-n2: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-cooperatives-and-social-dev-t-office-n2", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-computer-mgmt-and-info-tech-office-n3: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-computer-mgmt-and-info-tech-office-n3", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-business-office-n4: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-business-office-n4", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-education-office-n5: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-education-office-n5", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-function-room-n6: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-function-room-n6", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-economics-finance-and-politics-office-n7: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-economics-finance-and-politics-office-n7", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-languages-and-linguistics-office-n8: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-languages-and-linguistics-office-n8", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-arts-office-n9: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-arts-office-n9", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-college-of-accountancy-office-n10: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-college-of-accountancy-office-n10", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-dome: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-dome", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> main-2f-elevator: zero-length segment on main-1f-lobby
  { start: "gate", room: "main-2f-elevator", skip: "zero-length segment on main-1f-lobby" },
  // TODO gate -> gym-gf-drop-off-area: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-drop-off-area", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-stock-room-equipment-storage: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-stock-room-equipment-storage", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-he-male-cr-x2: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-he-male-cr-x2", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-lobby-porch: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-lobby-porch", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-elec-room: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-elec-room", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-she-female-cr-x2: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-she-female-cr-x2", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-porch: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-porch", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-badminton-court-x2: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-badminton-court-x2", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-basketball-court: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-basketball-court", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-bleachers-e-w: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-bleachers-e-w", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-lobby: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-lobby", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-stage: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-stage", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-male-dressing-room: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-male-dressing-room", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-female-dressing-room: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-female-dressing-room", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> gym-gf-fire-pump-room: route is not ok: No shared stairs between 1F and GF yet.
  { start: "gate", room: "gym-gf-fire-pump-room", skip: "route is not ok: No shared stairs between 1F and GF yet." },
  // TODO gate -> library-2f-computer-lab-2: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-computer-lab-2", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-computer-lab-1: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-computer-lab-1", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-it-project-management: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-it-project-management", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-conference-room: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-conference-room", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-phase-1-pantry: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-phase-1-pantry", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-icto-director: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-icto-director", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-quality-assurance-office: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-quality-assurance-office", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-icto-helpdesk: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-icto-helpdesk", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-nallrc-lobby: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-nallrc-lobby", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-operations-and-support-management: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-operations-and-support-management", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-administration-room: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-administration-room", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-assistant-director-x2: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-assistant-director-x2", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-icto-lobby: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-icto-lobby", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-phase-2-pantry: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-phase-2-pantry", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-research-lab-1: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-research-lab-1", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-research-lab-2: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-research-lab-2", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-building-admin: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-building-admin", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-fulltime-delivery-unit: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-fulltime-delivery-unit", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-icto-storage-room: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-icto-storage-room", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-pcari-conference-room: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-pcari-conference-room", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-network-and-systems-administration: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-network-and-systems-administration", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-information-systems-development: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-information-systems-development", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-2f-cr-male-female: route is not ok: No shared stairs between 1F and 2F yet.
  { start: "gate", room: "library-2f-cr-male-female", skip: "route is not ok: No shared stairs between 1F and 2F yet." },
  // TODO gate -> library-3f-chief-technical-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-chief-technical-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-staff: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-staff", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-director-s-office: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-director-s-office", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-materials-processing-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-materials-processing-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-silid-pulungan-board-room: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-silid-pulungan-board-room", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-technical-service-stock-rm: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-technical-service-stock-rm", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-silid-lakandayang: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-silid-lakandayang", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-nalrc-lounging-area: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-nalrc-lounging-area", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-pup-memorabilia: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-pup-memorabilia", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-archives-special-services-office: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-archives-special-services-office", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-rare-books-collection: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-rare-books-collection", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-elevator: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-elevator", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-third-floor-lobby: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-third-floor-lobby", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-chief-readers-services: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-chief-readers-services", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-reference-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-reference-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-reading-area-west: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-reading-area-west", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-circulation-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-circulation-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-computer-laboratory: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-computer-laboratory", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-male-cr: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-male-cr", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-female-cr: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-female-cr", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-open-below: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-open-below", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-discussion-room: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-discussion-room", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-disability-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-disability-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-filipiniana-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-filipiniana-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-reading-area-east: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-reading-area-east", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-serial-section: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-serial-section", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-stairs-up: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-stairs-up", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-fire-exit-west: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-fire-exit-west", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-fire-exit-east: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-fire-exit-east", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
  // TODO gate -> library-3f-exit-main-stairs: route is not ok: No shared stairs between 1F and 3F yet.
  { start: "gate", room: "library-3f-exit-main-stairs", skip: "route is not ok: No shared stairs between 1F and 3F yet." },
];

describe("route regression", () => {
  const limits = deriveLimits();

  it("derives length limits from the walk data", () => {
    console.log(formatLimits(limits));
    assert.ok(limits.indoorZero > 0);
    assert.ok(limits.indoorZero < limits.shortestEdge);
    assert.ok(limits.outdoorZero > 0);
    assert.ok(limits.outdoorZero < limits.shortestWalk);
    assert.ok(limits.longestWalk > limits.shortestWalk);
    assert.ok(limits.longestApproach > 0);
    const checking = PAIRS.filter((pair) => !pair.skip).length;
    console.log(`pairs ${PAIRS.length}, checking ${checking}, skipped ${PAIRS.length - checking}`);
  });

  it("covers every campus start and every room on every floor", () => {
    const startIds = new Set(PAIRS.map((pair) => pair.start));
    for (const start of campusStarts(campus)) assert.ok(startIds.has(start.id), start.id);
    const roomIds = new Set(PAIRS.map((pair) => pair.room));
    for (const floorId of Object.keys(paths.floors)) {
      const onFloor = allRooms(paths).filter((room) => room.floorId === floorId && !questioned(room));
      assert.ok(onFloor.length > 0, floorId);
      for (const room of onFloor) assert.ok(roomIds.has(room.id), room.id);
    }
    for (const pair of PAIRS) {
      const room = allRooms(paths).find((row) => row.id === pair.room);
      assert.ok(room, pair.room);
      if (!room) continue;
      assert.equal(questioned(room), false, pair.room);
      assert.ok(campusStarts(campus).some((start) => start.id === pair.start), pair.start);
    }
  });

  for (const pair of PAIRS) {
    const title = `${pair.start} -> ${pair.room}`;
    it(title, pair.skip ? { skip: pair.skip } : {}, () => {
      assert.deepEqual(problemsFor(pair, limits), []);
    });
  }
});
