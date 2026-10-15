import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, renameSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { Ticket, Stall, Station } from "./contract.js";

// ---------------------------------------------------------------------------
// StoreSnapshot — the serialised shape written to hub-state.json.
// ---------------------------------------------------------------------------

export interface StoreSnapshot {
  version: 1;
  ticketCounter: number;
  tickets: StoredTicket[];
  stalls: Stall[];
  completionTimes: Record<string, number[]>;
}

export interface StoredTicket extends Ticket {
  previous: Ticket | null;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Store interface — every operation server.ts needs.
// Async so a different store can fit later without changing callers.
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
// Online mode runs on Render as one long-lived process, so MemoryStore works there too (ADR 005).
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

    // ~40 simulated tickets with uneven queue lengths: BSCS-1 busiest (18), BSIT-1 medium (14), BSEE-1 lightest (9)
    const students: { name: string; course: string; stall: string }[] = [
      // BSCS-1 — 18 tickets at stall
      { name: "Ana Reyes",       course: "BSCS", stall: "BSCS-1" },
      { name: "Carlo Mendoza",   course: "BSCS", stall: "BSCS-1" },
      { name: "Diana Flores",    course: "BSCS", stall: "BSCS-1" },
      { name: "Emilio Garcia",   course: "BSCS", stall: "BSCS-1" },
      { name: "Fiona Castillo",  course: "BSCS", stall: "BSCS-1" },
      { name: "Gabriel Torres",  course: "BSCS", stall: "BSCS-1" },
      { name: "Hannah Ramos",    course: "BSCS", stall: "BSCS-1" },
      { name: "Ivan Dela Cruz",  course: "BSCS", stall: "BSCS-1" },
      { name: "Julia Santos",    course: "BSCS", stall: "BSCS-1" },
      { name: "Kevin Lim",       course: "BSCS", stall: "BSCS-1" },
      { name: "Laura Aquino",    course: "BSCS", stall: "BSCS-1" },
      { name: "Marco Villanueva",course: "BSCS", stall: "BSCS-1" },
      { name: "Nina Soriano",    course: "BSCS", stall: "BSCS-1" },
      { name: "Oscar Bautista",  course: "BSCS", stall: "BSCS-1" },
      { name: "Paula Reyes",     course: "BSCS", stall: "BSCS-1" },
      { name: "Ramon Ocampo",    course: "BSCS", stall: "BSCS-1" },
      { name: "Sofia Fernandez", course: "BSCS", stall: "BSCS-1" },
      { name: "Tristan Delos Santos", course: "BSCS", stall: "BSCS-1" },
      // BSIT-1 — 14 tickets at stall
      { name: "Ben Santos",      course: "BSIT", stall: "BSIT-1" },
      { name: "Cara Lim",        course: "BSIT", stall: "BSIT-1" },
      { name: "Eva Tan",         course: "BSIT", stall: "BSIT-1" },
      { name: "Felix Cruz",      course: "BSIT", stall: "BSIT-1" },
      { name: "Grace Navarro",   course: "BSIT", stall: "BSIT-1" },
      { name: "Henry Pascual",   course: "BSIT", stall: "BSIT-1" },
      { name: "Iris Magno",      course: "BSIT", stall: "BSIT-1" },
      { name: "Jose Valdez",     course: "BSIT", stall: "BSIT-1" },
      { name: "Karen Espiritu",  course: "BSIT", stall: "BSIT-1" },
      { name: "Luis Macaraeg",   course: "BSIT", stall: "BSIT-1" },
      { name: "Maria Chua",      course: "BSIT", stall: "BSIT-1" },
      { name: "Neil Aguilar",    course: "BSIT", stall: "BSIT-1" },
      { name: "Olivia Domingo",  course: "BSIT", stall: "BSIT-1" },
      { name: "Pedro Reyes",     course: "BSIT", stall: "BSIT-1" },
      // BSEE-1 — 9 tickets at stall
      { name: "Dan Cruz",        course: "BSEE", stall: "BSEE-1" },
      { name: "Queenie Alvarado",course: "BSEE", stall: "BSEE-1" },
      { name: "Rogelio Manalo",  course: "BSEE", stall: "BSEE-1" },
      { name: "Sheila Bondoc",   course: "BSEE", stall: "BSEE-1" },
      { name: "Tomas Guevara",   course: "BSEE", stall: "BSEE-1" },
      { name: "Uma Salazar",     course: "BSEE", stall: "BSEE-1" },
      { name: "Victor Padilla",  course: "BSEE", stall: "BSEE-1" },
      { name: "Wendy Concepcion",course: "BSEE", stall: "BSEE-1" },
      { name: "Ximena Flores",   course: "BSEE", stall: "BSEE-1" },
    ];

    for (const s of students) {
      const ticket: StoredTicket = {
        id: randomUUID(),
        code: await this.nextCode(),
        name: s.name,
        course: s.course,
        station: "stall",
        stall: s.stall,
        status: "waiting",
        simulated: true,
        createdAt: new Date().toISOString(),
        calledAt: null,
        previous: null,
        completedAt: null,
      };
      await this.setTicket(ticket);
    }

    console.log("Seed complete: 3 stalls, 41 tickets (18 BSCS-1 / 14 BSIT-1 / 9 BSEE-1).");
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
          new Date(a.skippedAt ?? a.createdAt).getTime() -
          new Date(b.skippedAt ?? b.createdAt).getTime()
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

  // ---------------------------------------------------------------------------
  // Snapshot helpers — used by FileStore to serialise and restore state.
  // ---------------------------------------------------------------------------

  toSnapshot(): StoreSnapshot {
    const completionTimes: Record<string, number[]> = {};
    for (const [k, v] of this.completionTimes.entries()) {
      completionTimes[k] = [...v];
    }
    return {
      version: 1,
      ticketCounter: this.ticketCounter,
      tickets: Array.from(this.tickets.values()),
      stalls: Array.from(this.stalls.values()),
      completionTimes,
    };
  }

  loadSnapshot(s: StoreSnapshot): void {
    // Build all maps in locals first so an error partway through leaves the store empty.
    const newTickets = new Map<string, StoredTicket>();
    for (const t of s.tickets) {
      newTickets.set(t.id, t);
    }
    const newStalls = new Map<string, Stall>();
    for (const st of s.stalls) {
      newStalls.set(st.id, st);
    }
    const newCompletionTimes = new Map<string, number[]>();
    for (const [k, v] of Object.entries(s.completionTimes)) {
      newCompletionTimes.set(k, [...v]);
    }
    // All parsing succeeded — commit to the store.
    this.tickets = newTickets;
    this.stalls = newStalls;
    this.completionTimes = newCompletionTimes;
    this.ticketCounter = s.ticketCounter;
  }
}

// ---------------------------------------------------------------------------
// FileStore — extends MemoryStore with atomic JSON persistence.
// Used only on the hub when HUB_FILE is set.
// ---------------------------------------------------------------------------

export class FileStore extends MemoryStore {
  private readonly filePath: string;
  readonly loadedFromFile: boolean;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
    this.loadedFromFile = false;

    if (existsSync(filePath)) {
      let raw: string;
      try {
        raw = readFileSync(filePath, "utf8");
      } catch (err) {
        console.error(`[FileStore] Could not read ${filePath}:`, err);
        this.loadedFromFile = false;
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error(`[FileStore] ${filePath} is not valid JSON — renaming to .bad`);
        try { renameSync(filePath, filePath + ".bad"); } catch { /* ignore */ }
        this.loadedFromFile = false;
        return;
      }
      if (!FileStore.isValidSnapshot(parsed)) {
        console.error(`[FileStore] ${filePath} has an unexpected shape — renaming to .bad`);
        try { renameSync(filePath, filePath + ".bad"); } catch { /* ignore */ }
        this.loadedFromFile = false;
        return;
      }
      try {
        this.loadSnapshot(parsed as StoreSnapshot);
      } catch (err) {
        console.error(`[FileStore] Failed to load snapshot from ${filePath}:`, err);
        try { renameSync(filePath, filePath + ".bad"); } catch { /* ignore */ }
        this.loadedFromFile = false;
        return;
      }
      this.loadedFromFile = true;
    }
  }

  private static isValidSnapshot(v: unknown): v is StoreSnapshot {
    if (typeof v !== "object" || v === null) return false;
    const s = v as Record<string, unknown>;
    if (
      s["version"] !== 1 ||
      typeof s["ticketCounter"] !== "number" ||
      !Array.isArray(s["tickets"]) ||
      !Array.isArray(s["stalls"])
    ) return false;
    // completionTimes must be a non-null, non-array object.
    const ct = s["completionTimes"];
    if (typeof ct !== "object" || ct === null || Array.isArray(ct)) return false;
    // Every ticket must be a non-null object with a string id.
    for (const t of s["tickets"] as unknown[]) {
      if (typeof t !== "object" || t === null) return false;
      if (typeof (t as Record<string, unknown>)["id"] !== "string") return false;
    }
    // Every stall must be a non-null object with a string id.
    for (const st of s["stalls"] as unknown[]) {
      if (typeof st !== "object" || st === null) return false;
      if (typeof (st as Record<string, unknown>)["id"] !== "string") return false;
    }
    return true;
  }

  private save(): void {
    const snap = this.toSnapshot();
    const json = JSON.stringify(snap, null, 2);
    const tmp = this.filePath + ".tmp";
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(tmp, json, "utf8");
    renameSync(tmp, this.filePath);
  }

  // Override every mutating method to save after the super call.

  override async reset(): Promise<void> {
    await super.reset();
    this.save();
  }

  override async seed(): Promise<void> {
    await super.seed();
    this.save();
  }

  override async nextCode(): Promise<string> {
    const code = await super.nextCode();
    this.save();
    return code;
  }

  override async setTicket(ticket: StoredTicket): Promise<void> {
    await super.setTicket(ticket);
    this.save();
  }

  override async setStall(stall: Stall): Promise<void> {
    await super.setStall(stall);
    this.save();
  }

  override async recordCompletion(stallId: string, durationMs: number): Promise<void> {
    await super.recordCompletion(stallId, durationMs);
    this.save();
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

const _store: Store = process.env.HUB_FILE
  ? new FileStore(process.env.HUB_FILE)
  : new MemoryStore();

/**
 * Returns the active store.
 * On the hub (`npm run hub`), HUB_FILE is set and the store is a FileStore.
 * On Render and in tests, HUB_FILE is unset and the store is a plain MemoryStore (ADR 005).
 */
export function getStore(): Store {
  return _store;
}

/** True only when the active store is a FileStore that successfully loaded a file on startup. */
export function hubFileLoaded(): boolean {
  return _store instanceof FileStore && _store.loadedFromFile;
}
