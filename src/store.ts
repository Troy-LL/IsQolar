import { randomUUID } from "node:crypto";
import type { Ticket, Stall, Station } from "./contract.js";

export interface StoredTicket extends Ticket {
  previous: Ticket | null;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Store interface — every operation server.ts needs.
// Async so a remote store (Redis, day 2) fits without changing callers.
// ---------------------------------------------------------------------------

export interface Store {
  reset(): Promise<void>;
  seed(): Promise<void>;

  nextCode(): Promise<string>;

  getTickets(): Promise<StoredTicket[]>;
  getTicket(id: string): Promise<StoredTicket | undefined>;
  setTicket(ticket: StoredTicket): Promise<void>;

  getStalls(): Promise<Stall[]>;
  getStall(id: string): Promise<Stall | undefined>;
  setStall(stall: Stall): Promise<void>;

  nextStation(current: Station): Station | null;
  recordCompletion(stallId: string, durationMs: number): Promise<void>;
  avgServiceMin(stallId: string): Promise<number>;
  stallQueueLength(stallId: string): Promise<number>;
  ticketPositionAtStall(ticketId: string): Promise<number>;
  pickStallForCourse(course: string): Promise<Stall | null>;
}

// ---------------------------------------------------------------------------
// MemoryStore — in-process implementation used for now.
// STORE=redis will select the Upstash adapter on day 2 (task O1).
// ---------------------------------------------------------------------------

export class MemoryStore implements Store {
  private tickets = new Map<string, StoredTicket>();
  private stalls = new Map<string, Stall>();
  private ticketCounter = 0;
  private completionTimes = new Map<string, number[]>();

  async reset(): Promise<void> {
    this.tickets.clear();
    this.stalls.clear();
    this.ticketCounter = 0;
    this.completionTimes.clear();
  }

  async seed(): Promise<void> {
    await this.reset();

    await this.setStall({ id: "BSCS-1", name: "BS Computer Science — Stall 1", department: "IT & CS", activeInterviewers: 1, queueLength: 0, nowServing: null });
    await this.setStall({ id: "BSIT-1", name: "BS Information Technology — Stall 1", department: "IT & CS", activeInterviewers: 1, queueLength: 0, nowServing: null });
    await this.setStall({ id: "BSEE-1", name: "BS Electrical Engineering — Stall 1", department: "Engineering", activeInterviewers: 1, queueLength: 0, nowServing: null });

    const students = [
      { name: "Ana Reyes", course: "BSCS" },
      { name: "Ben Santos", course: "BSIT" },
      { name: "Cara Lim", course: "BSCS" },
      { name: "Dan Cruz", course: "BSEE" },
      { name: "Eva Tan", course: "BSIT" },
    ];

    for (const s of students) {
      const ticket: StoredTicket = {
        id: randomUUID(),
        code: await this.nextCode(),
        name: s.name,
        course: s.course,
        station: "checkin",
        stall: null,
        status: "waiting",
        simulated: true,
        createdAt: new Date().toISOString(),
        calledAt: null,
        previous: null,
        completedAt: null,
      };
      await this.setTicket(ticket);
    }

    console.log("Seed complete: 3 stalls, 5 tickets.");
  }

  async nextCode(): Promise<string> {
    this.ticketCounter += 1;
    return this.ticketCounter.toString().padStart(4, "0");
  }

  async getTickets(): Promise<StoredTicket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicket(id: string): Promise<StoredTicket | undefined> {
    return this.tickets.get(id);
  }

  async setTicket(ticket: StoredTicket): Promise<void> {
    this.tickets.set(ticket.id, ticket);
  }

  async getStalls(): Promise<Stall[]> {
    return Array.from(this.stalls.values());
  }

  async getStall(id: string): Promise<Stall | undefined> {
    return this.stalls.get(id);
  }

  async setStall(stall: Stall): Promise<void> {
    this.stalls.set(stall.id, stall);
  }

  readonly STATIONS: Station[] = [
    "checkin",
    "docs",
    "validation",
    "main",
    "stall",
    "enrolled",
  ];

  nextStation(current: Station): Station | null {
    const idx = this.STATIONS.indexOf(current);
    if (idx === -1 || idx === this.STATIONS.length - 1) return null;
    return this.STATIONS[idx + 1];
  }

  async recordCompletion(stallId: string, durationMs: number): Promise<void> {
    const list = this.completionTimes.get(stallId) ?? [];
    list.push(durationMs);
    if (list.length > 10) list.shift();
    this.completionTimes.set(stallId, list);
  }

  async avgServiceMin(stallId: string): Promise<number> {
    const list = this.completionTimes.get(stallId);
    if (!list || list.length === 0) return 3;
    const avgMs = list.reduce((a, b) => a + b, 0) / list.length;
    return Math.ceil(avgMs / 60000);
  }

  async stallQueueLength(stallId: string): Promise<number> {
    let count = 0;
    for (const t of this.tickets.values()) {
      if (t.stall === stallId && t.station === "stall" && t.status === "waiting") {
        count++;
      }
    }
    return count;
  }

  async ticketPositionAtStall(ticketId: string): Promise<number> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket || !ticket.stall) return 1;
    const waiting = Array.from(this.tickets.values())
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

  async pickStallForCourse(course: string): Promise<Stall | null> {
    const candidates = Array.from(this.stalls.values()).filter((s) =>
      s.id.startsWith(course + "-")
    );
    if (candidates.length === 0) return null;
    const lengths = await Promise.all(
      candidates.map((s) => this.stallQueueLength(s.id))
    );
    let best = candidates[0];
    let bestLen = lengths[0];
    for (let i = 1; i < candidates.length; i++) {
      if (lengths[i] < bestLen) {
        best = candidates[i];
        bestLen = lengths[i];
      }
    }
    return best;
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

const _store: Store = new MemoryStore();

/** Returns the active store. STORE=redis will select the Upstash adapter on day 2 (task O1). */
export function getStore(): Store {
  return _store;
}
