import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

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

  return { ok: errors.length === 0, errors, verifiedFalse, questionLabels };
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
  const report = checkMap({ floors, paths, stairs, fileExists: existsSync });
  console.log(formatMapReport(report));
  return report.ok ? 0 : 1;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  process.exit(runCli());
}
