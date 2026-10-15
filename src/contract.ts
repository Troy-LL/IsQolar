// contract.ts
// Frozen at 11:15, October 15, 2026.
// Only the project manager may change this file after that time.
// See docs/decisions/003-contract-freeze-at-11-15.md

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** The ordered stations a ticket passes through. */
export type Station =
  | "checkin"
  | "docs"
  | "validation"
  | "main"
  | "stall"
  | "enrolled";

/** The lifecycle state of a ticket within its current station. */
export type TicketStatus = "waiting" | "called" | "done";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Ticket {
  id: string;
  /** Short human-readable code printed on the physical ticket (e.g. "A-042"). */
  code: string;
  name: string;
  /** The course the student is enrolling in (e.g. "BSCS", "BSIT"). */
  course: string;
  /** The current station this ticket is at. */
  station: Station;
  /** The stall identifier once the ticket reaches the "stall" station (e.g. "BSCS-1"). Null before that. */
  stall: string | null;
  status: TicketStatus;
  /** Set by the seed script. True means this ticket is demo data, not a real enrollment. */
  simulated: boolean;
  createdAt: string; // ISO 8601
  /** Set when a stall staff member calls this ticket. Null until then. */
  calledAt: string | null; // ISO 8601
}

export interface Stall {
  /** Unique stall identifier (e.g. "BSCS-1"). */
  id: string;
  /** Display name (e.g. "BS Computer Science — Stall 1"). */
  name: string;
  /** Department grouping for the board layout (e.g. "IT & CS", "Engineering"). */
  department: string;
  /** Number of active interviewers currently at this stall (1 or 2). */
  activeInterviewers: number;
  /** Number of tickets with status "waiting" at this stall. */
  queueLength: number;
  /** The code of the ticket currently called (status "called"), or null if none. */
  nowServing: string | null;
}

/** Read-only guardian view. Marked Next — not implemented in the MVP. */
export interface GuardianStatus {
  ticketId: string;
  station: Station;
  /** Human-readable label for the current station (e.g. "Waiting at stall"). */
  label: string;
}

// ---------------------------------------------------------------------------
// Endpoint shapes
// ---------------------------------------------------------------------------

// POST /api/tickets
export interface CreateTicketBody {
  name: string;
  course: string;
  /** Optional. Stored if provided but not required for check-in. */
  permitNo?: string;
}
// Returns: Ticket

// GET /api/tickets/:id
// Returns:
export interface TicketDetail extends Ticket {
  /** Position in the queue at the student's stall (1-based). */
  position: number;
  /**
   * Estimated wait in whole minutes, rounded up.
   * Calculated as: position × average service minutes of the last 10 completed tickets at this stall.
   * If fewer than 10 tickets have been completed at the stall, the default is 3 minutes per ticket.
   */
  estWaitMin: number;
}

// GET /api/stalls
// Returns: Stall[]

// GET /api/stalls/:stall/queue
// Returns: Ticket[]

// POST /api/stalls/:stall/next
// Returns: the Ticket whose status was moved from "waiting" to "called"

// POST /api/tickets/:id/done
// Marks the current station done and advances the ticket to the next station.
// Returns: Ticket

// POST /api/tickets/:id/undo
// Reverts the last move. Staff only.
// Returns: Ticket

// GET /api/admin/summary
export interface AdminSummary {
  /** Count of tickets at each station. */
  byStation: Record<Station, number>;
}

// GET /health
export interface HealthResponse {
  ok: true;
}
