// Types for public/route.js so src/route.test.ts can import it.
export interface Point { x: number; y: number }
export interface PathNode { id: string; x: number; y: number; kind: string; label?: string }
export interface PathRoom { id: string; label: string; kind: string; x: number; y: number; node: string; wing?: string; flag?: string }
export interface PathFloor { aspect: number; start: string | null; nodes: PathNode[]; edges: [string, string][]; rooms: PathRoom[] }
export interface Paths { floors: Record<string, PathFloor>; unplaced: { floorId: string; label: string; reason: string }[] }
export interface Stairs { stairs: { id: string; name: string }[]; floors: Record<string, { stairs: Record<string, Point>; notes: string }> }
export interface Floor { id: string; floor: string; label: string; image: string }
export interface Leg { floorId: string; ids: string[]; points: Point[]; arrive?: string }
export interface Step { floorId: string; text: string }
export type RouteResult =
  | { ok: true; room: PathRoom & { floorId: string }; stair?: string; legs: Leg[]; steps: Step[] }
  | { ok: false; message: string };
export const NOT_ON_MAP: string;
export function floorShort(floor: Floor | string): string;
export function roomName(room: PathRoom): string;
export function shortestPath(paths: Paths, floorId: string, from: string, to: string): { distance: number; ids: string[]; points: Point[] } | null;
export function allRooms(paths: Paths): (PathRoom & { floorId: string })[];
export function searchRooms(paths: Paths, query: string): (PathRoom & { floorId: string })[];
export function planRoute(paths: Paths, stairs: Stairs, floors: Floor[], start: { floorId: string; node: string }, roomId: string): RouteResult;
export interface Campus { walk: { coordinates: [number, number][]; meters: number } }
export function planCampusRoute(paths: Paths, stairs: Stairs, floors: Floor[], campus: Campus, roomId: string): RouteResult;
