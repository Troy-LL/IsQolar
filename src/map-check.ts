import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { campusStarts, roomDisplay, roomListed, type Campus } from "../public/route.js";

export const ROOM_KINDS = ["room", "office", "cr", "stairs", "exit", "elevator", "assembly", "other"] as const;

export interface FloorRow {
  id: string;
  image?: string;
  imageWebp?: string;
  poster?: string;
}

export interface MapRoom {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  node: string;
  verified?: boolean;
  flag?: string;
}

export interface MapNode {
  id: string;
  x: number;
  y: number;
  kind: string;
}

export interface MapInput {
  floors: FloorRow[];
  paths: {
    floors: Record<string, { nodes: MapNode[]; rooms: MapRoom[] }>;
    unplaced: { floorId: string; label: string }[];
  };
  stairs: {
    stairs: { id: string }[];
    floors: Record<string, { stairs: Record<string, { x: number; y: number }> }>;
  };
  fileExists: (path: string) => boolean;
  campus?: {
    buildings: { features: { properties: { osm: string; name: string | null } }[] };
    entrance?: { label?: string };
  };
}

export interface MapReport {
  ok: boolean;
  errors: string[];
  verifiedFalse: number;
  questionLabels: number;
}

const IMAGE_FIELDS = ["image", "imageWebp", "poster"] as const;

function inRange(x: number, y: number): boolean {
  return typeof x === "number" && typeof y === "number" && x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

function duplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    seen.add(id);
  }
  return [...dups];
}

export function checkMap(input: MapInput): MapReport {
  const errors: string[] = [];
  const floorIds = new Set(input.floors.map((floor) => floor.id));

  for (const id of duplicateIds(input.floors.map((floor) => floor.id))) {
    errors.push(`duplicate id: ${id}`);
  }
  for (const id of duplicateIds(input.stairs.stairs.map((stair) => stair.id))) {
    errors.push(`duplicate id: ${id}`);
  }

  const roomIds: string[] = [];
  let verifiedFalse = 0;
  let questionLabels = 0;

  for (const [floorId, floor] of Object.entries(input.paths.floors)) {
    if (!floorIds.has(floorId)) errors.push(`unknown floorId: ${floorId}`);
    for (const id of duplicateIds(floor.nodes.map((node) => node.id))) {
      errors.push(`duplicate id: ${id}`);
    }
    for (const node of floor.nodes) {
      if (!inRange(node.x, node.y)) errors.push(`${node.id} x or y outside 0..1`);
    }
    for (const room of floor.rooms) {
      roomIds.push(room.id);
      if (!inRange(room.x, room.y)) errors.push(`${room.id} x or y outside 0..1`);
      if (!ROOM_KINDS.includes(room.kind as (typeof ROOM_KINDS)[number])) {
        errors.push(`unknown kind: ${room.kind} on ${room.id}`);
      }
      if (room.verified === false || (room.flag != null && room.flag !== "")) verifiedFalse += 1;
      if (room.label.includes("?")) questionLabels += 1;
    }
  }

  for (const id of duplicateIds(roomIds)) errors.push(`duplicate id: ${id}`);

  for (const row of input.paths.unplaced) {
    if (!floorIds.has(row.floorId)) errors.push(`unknown floorId: ${row.floorId}`);
    if (row.label.includes("?")) questionLabels += 1;
  }

  for (const [floorId, entry] of Object.entries(input.stairs.floors)) {
    if (!floorIds.has(floorId)) errors.push(`unknown floorId: ${floorId}`);
    for (const [id, point] of Object.entries(entry.stairs)) {
      if (!inRange(point.x, point.y)) errors.push(`${id} x or y outside 0..1`);
    }
  }

  for (const floor of input.floors) {
    for (const field of IMAGE_FIELDS) {
      const path = floor[field];
      if (path != null && !input.fileExists(path)) errors.push(`missing image file: ${path}`);
    }
  }

  for (const label of visibleLabels(input)) {
    if (shownMark(label)) errors.push(`visible label: ${label}`);
  }

  return { ok: errors.length === 0, errors, verifiedFalse, questionLabels };
}

function shownMark(label: string): boolean {
  return label.includes("?") || /(?:way|relation)\/\d+/.test(label);
}

function visibleLabels(input: MapInput): string[] {
  const labels: string[] = [];
  for (const floor of Object.values(input.paths.floors)) {
    for (const room of floor.rooms) {
      if (!roomListed(room)) continue;
      labels.push(room.label, roomDisplay(room));
    }
  }
  if (input.campus) {
    for (const start of campusStarts(input.campus as Campus)) labels.push(start.label);
    for (const feature of input.campus.buildings.features) {
      if (feature.properties.name) labels.push(feature.properties.name);
    }
    if (input.campus.entrance?.label) labels.push(input.campus.entrance.label);
  }
  return labels;
}

export function formatMapReport(report: MapReport): string {
  const lines = [
    `verified false: ${report.verifiedFalse}`,
    `labels with ?: ${report.questionLabels}`,
    ...report.errors,
  ];
  return lines.join("\n");
}

function runCli(): number {
  const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as FloorRow[];
  const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as MapInput["paths"];
  const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as MapInput["stairs"];
  const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as MapInput["campus"];
  const report = checkMap({ floors, paths, stairs, campus, fileExists: existsSync });
  console.log(formatMapReport(report));
  return report.ok ? 0 : 1;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  process.exit(runCli());
}
