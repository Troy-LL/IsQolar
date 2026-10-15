import express from "express";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import type { Ticket, TicketDetail, Stall, AdminSummary, HealthResponse, Station } from "./contract.js";
import {
  getTicket,
  getTickets,
  setTicket,
  getStalls,
  getStall,
  setStall,
  nextCode,
  nextStation,
  recordCompletion,
  avgServiceMin,
  stallQueueLength,
  ticketPositionAtStall,
  pickStallForCourse,
  type StoredTicket,
} from "./store.js";
import { seed } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "../public")));

// GET /health
app.get("/health", (_req, res) => {
  const body: HealthResponse = { ok: true };
  res.json(body);
});

// POST /api/tickets
app.post("/api/tickets", (req, res) => {
  const { name, course } = req.body as { name: string; course: string; permitNo?: string };
  if (!name || !course) {
    res.status(400).json({ error: "name and course are required" });
    return;
  }
  const ticket: StoredTicket = {
    id: randomUUID(),
    code: nextCode(),
    name,
    course,
    station: "checkin",
    stall: null,
    status: "waiting",
    simulated: false,
    createdAt: new Date().toISOString(),
    calledAt: null,
    previous: null,
    completedAt: null,
  };
  setTicket(ticket);
  const out: Ticket = toTicket(ticket);
  res.status(201).json(out);
});

// GET /api/tickets/:id
app.get("/api/tickets/:id", (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const position = ticket.station === "stall" && ticket.stall
    ? ticketPositionAtStall(ticket.id)
    : 1;
  const est = ticket.stall ? avgServiceMin(ticket.stall) : 3;
  const detail: TicketDetail = {
    ...toTicket(ticket),
    position,
    estWaitMin: Math.ceil(position * est),
  };
  res.json(detail);
});

// GET /api/stalls
app.get("/api/stalls", (_req, res) => {
  const stalls: Stall[] = getStalls().map((s) => withLiveStall(s));
  res.json(stalls);
});

// GET /api/stalls/:stall/queue
app.get("/api/stalls/:stall/queue", (req, res) => {
  const stall = getStall(req.params.stall);
  if (!stall) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const queue: Ticket[] = getTickets()
    .filter(
      (t) =>
        t.stall === req.params.stall &&
        t.station === "stall" &&
        t.status === "waiting"
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(toTicket);
  res.json(queue);
});

// POST /api/stalls/:stall/next
app.post("/api/stalls/:stall/next", (req, res) => {
  const stallId = req.params.stall;
  const stall = getStall(stallId);
  if (!stall) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const oldest = getTickets()
    .filter(
      (t) =>
        t.stall === stallId &&
        t.station === "stall" &&
        t.status === "waiting"
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  if (!oldest) {
    res.status(404).json({ error: "queue is empty" });
    return;
  }
  const prev = snapshot(oldest);
  const updated: StoredTicket = {
    ...oldest,
    status: "called",
    calledAt: new Date().toISOString(),
    previous: prev,
  };
  setTicket(updated);
  const updatedStall: Stall = {
    ...withLiveStall(stall),
    nowServing: updated.code,
  };
  setStall(updatedStall);
  res.json(toTicket(updated));
});

// POST /api/admin/seed
app.post("/api/admin/seed", (_req, res) => {
  seed();
  const byStation: Record<Station, number> = {
    checkin: 0,
    docs: 0,
    validation: 0,
    main: 0,
    stall: 0,
    enrolled: 0,
  };
  for (const t of getTickets()) {
    byStation[t.station]++;
  }
  const summary: AdminSummary = { byStation };
  res.json(summary);
});

// POST /api/tickets/:id/done
app.post("/api/tickets/:id/done", (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const next = nextStation(ticket.station);
  if (!next) {
    res.status(400).json({ error: "already at final station" });
    return;
  }
  const prev = snapshot(ticket);
  let assignedStall = ticket.stall;
  let completedAt = ticket.completedAt;

  if (next === "stall") {
    const stallObj = pickStallForCourse(ticket.course);
    if (!stallObj) {
      res.status(409).json({ error: "no stall for course" });
      return;
    }
    assignedStall = stallObj.id;
    setStall({ ...withLiveStall(stallObj) });
  }

  if (ticket.station === "stall" && ticket.calledAt) {
    const duration = Date.now() - new Date(ticket.calledAt).getTime();
    if (ticket.stall) recordCompletion(ticket.stall, duration);
    completedAt = new Date().toISOString();
  }

  const updated: StoredTicket = {
    ...ticket,
    station: next,
    stall: assignedStall,
    status: "waiting",
    previous: prev,
    completedAt,
  };
  setTicket(updated);

  if (ticket.stall) {
    refreshStall(ticket.stall);
  }
  if (assignedStall && assignedStall !== ticket.stall) {
    refreshStall(assignedStall);
  }

  res.json(toTicket(updated));
});

// POST /api/tickets/:id/undo
app.post("/api/tickets/:id/undo", (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (!ticket.previous) {
    res.status(400).json({ error: "nothing to undo" });
    return;
  }
  const prev = ticket.previous;
  const restored: StoredTicket = {
    ...prev,
    previous: null,
    completedAt: ticket.completedAt,
  };
  setTicket(restored);

  if (ticket.stall) refreshStall(ticket.stall);
  if (prev.stall && prev.stall !== ticket.stall) refreshStall(prev.stall);

  res.json(toTicket(restored));
});

// GET /api/admin/summary
app.get("/api/admin/summary", (_req, res) => {
  const byStation: Record<Station, number> = {
    checkin: 0,
    docs: 0,
    validation: 0,
    main: 0,
    stall: 0,
    enrolled: 0,
  };
  for (const t of getTickets()) {
    byStation[t.station]++;
  }
  const summary: AdminSummary = { byStation };
  res.json(summary);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTicket(t: StoredTicket): Ticket {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    course: t.course,
    station: t.station,
    stall: t.stall,
    status: t.status,
    simulated: t.simulated,
    createdAt: t.createdAt,
    calledAt: t.calledAt,
  };
}

function snapshot(t: StoredTicket): Ticket {
  return toTicket(t);
}

function withLiveStall(s: Stall): Stall {
  const queueLength = stallQueueLength(s.id);
  const called = getTickets().find(
    (t) => t.stall === s.id && t.station === "stall" && t.status === "called"
  );
  return {
    ...s,
    queueLength,
    nowServing: called ? called.code : null,
  };
}

function refreshStall(stallId: string): void {
  const s = getStall(stallId);
  if (s) setStall(withLiveStall(s));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`IsQolar listening on http://localhost:${PORT}`);
    if (process.env.SEED === "1") {
      seed();
      console.log("Auto-seeded on startup.");
    }
  });
}
