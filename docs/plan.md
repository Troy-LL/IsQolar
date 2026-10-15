# Plan

Team, tracks, and timeline for the Bobathon build day.
This file is temporary. Delete it after the Bobathon.

---

## Team and tracks

| Person | Role | Track |
|---|---|---|
| Troy | Project manager, full stack | Server, contract, merges, deadlines, `docs/bob-log.md` |
| Ayen | Product manager, front end | Student join and ticket page, demo script, 1:00 and 3:00 checks |
| Donita | Full stack | Stall view (Call next, Mark done, lookup, undo), UI design system |
| Viv | Front end | Stall board, "Now serving" display, coordinator page |
| Justin | Back end | Stations and stall data, seed script (simulated morning), printable ticket |

Roles are flexible. This is the default split.

---

## Timeline (Asia/Manila)

| Time | Milestone |
|---|---|
| 10:45 to 11:15 | Freeze `src/contract.ts` and mock JSON. After 11:15 only Troy changes the contract. |
| 11:15 to 12:00 | Each track builds on mocks. One PR per track, Bob `/review` on each. |
| 12:00 | Feature lock. Swap mocks for the server. |
| 1:00 | Product manager (Ayen) runs the demo check. |
| 3:00 | Dry run. |
| 3:30 | Checkpoint: working stall board. |
| After 3:30 | Fixes, pitch rehearsed twice, README, Bob log. |

---

## Demo script

The stall board is the first screen shown to judges.
A staff member taps "Call next" live.
The board and a student ticket update in front of the judges.
Seeded data is labeled "simulated morning."

---

## Assumptions (defaults until the team confirms)

These are working defaults. Change them here and in `src/contract.ts` if the team decides otherwise.

1. **O1 slots left** — requirement O1 ("slots left per course") is out of scope for the MVP and not in the contract. If courses can fill on the day, add it as a required contract field and revisit requirement O1.
2. **Check-in identifier** — `POST /api/tickets` takes `name`, `course`, and an optional `permitNo`. The permit number is not required. If the team decides it must be required, change the field to non-optional in `src/contract.ts`.
3. **Uniform interview flow** — every stall runs the same interview step. There are no stall-specific step types. If any stall differs, the station model will need a stall-specific variant.
