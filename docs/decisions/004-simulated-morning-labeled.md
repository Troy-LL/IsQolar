# 004 — Simulated morning is labeled as simulated

**Status:** Accepted

## Context

The demo uses a seed script (`npm run seed`) to pre-populate the system with realistic queue data so judges can see the board and ticket pages in action without waiting for real students.
If seeded data looks identical to real data, a judge or observer could mistake it for a live enrollment in progress and draw incorrect conclusions about the system's state.

## Decision

We will label every ticket created by the seed script as simulated.
The label is visible to anyone viewing a seeded ticket or the board during the demo.
Real tickets created by staff during a live enrollment are never labeled as simulated.

## Consequences

- Judges and observers can tell at a glance that the demo data is not a real enrollment.
- The seed script must set a `simulated` flag (or equivalent) on every ticket it creates.
- The ticket page and board must surface the simulated label when the flag is set.
- No extra work is needed for real enrollment days because real tickets never carry the flag.
