import type { Ticket, Stall, Station } from "./contract.js";

export interface StoredTicket extends Ticket {
  previous: Ticket | null;
  completedAt: string | null;
}

interface Store {
  tickets: Map<string, StoredTicket>;
  stalls: Map<string, Stall>;
  ticketCounter: number;
  completionTimes: Map<string, number[]>;
}

const store: Store = {
  tickets: new Map(),
  stalls: new Map(),
  ticketCounter: 0,
  completionTimes: new Map(),
};

export function reset(): void {
  store.tickets.clear();
  store.stalls.clear();
  store.ticketCounter = 0;
  store.completionTimes.clear();
}

export function nextCode(): string {
  store.ticketCounter += 1;
  return store.ticketCounter.toString().padStart(4, "0");
}

export function getTickets(): StoredTicket[] {
  return Array.from(store.tickets.values());
}

export function getTicket(id: string): StoredTicket | undefined {
  return store.tickets.get(id);
}

export function setTicket(ticket: StoredTicket): void {
  store.tickets.set(ticket.id, ticket);
}

export function getStalls(): Stall[] {
  return Array.from(store.stalls.values());
}

export function getStall(id: string): Stall | undefined {
  return store.stalls.get(id);
}

export function setStall(stall: Stall): void {
  store.stalls.set(stall.id, stall);
}

export const STATIONS: Station[] = [
  "checkin",
  "docs",
  "validation",
  "main",
  "stall",
  "enrolled",
];

export function nextStation(current: Station): Station | null {
  const idx = STATIONS.indexOf(current);
  if (idx === -1 || idx === STATIONS.length - 1) return null;
  return STATIONS[idx + 1];
}

export function recordCompletion(stallId: string, durationMs: number): void {
  const list = store.completionTimes.get(stallId) ?? [];
  list.push(durationMs);
  if (list.length > 10) list.shift();
  store.completionTimes.set(stallId, list);
}

export function avgServiceMin(stallId: string): number {
  const list = store.completionTimes.get(stallId);
  if (!list || list.length === 0) return 3;
  const avgMs = list.reduce((a, b) => a + b, 0) / list.length;
  return Math.ceil(avgMs / 60000);
}

export function stallQueueLength(stallId: string): number {
  let count = 0;
  for (const t of store.tickets.values()) {
    if (t.stall === stallId && t.station === "stall" && t.status === "waiting") {
      count++;
    }
  }
  return count;
}

export function ticketPositionAtStall(ticketId: string): number {
  const ticket = store.tickets.get(ticketId);
  if (!ticket || !ticket.stall) return 1;
  const waiting = Array.from(store.tickets.values())
    .filter(
      (t) =>
        t.stall === ticket.stall &&
        t.station === "stall" &&
        t.status === "waiting"
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  const idx = waiting.findIndex((t) => t.id === ticketId);
  return idx === -1 ? 1 : idx + 1;
}

export function pickStallForCourse(course: string): Stall | null {
  const candidates = Array.from(store.stalls.values()).filter((s) =>
    s.id.startsWith(course + "-")
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, s) =>
    stallQueueLength(s.id) < stallQueueLength(best.id) ? s : best
  );
}
