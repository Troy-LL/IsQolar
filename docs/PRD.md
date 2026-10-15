# PRD: PUP Enrollment Queue

**Status:** Draft v0.2 (Oct 15, 2026, 11:15 contract freeze)
**Scope:** First-year, on-site enrollment at PUP Manila
**Platform:** Web app (no install), runs on one laptop or the venue's local network
**Source of the problem:** the team's own first enrollment, PUP Manila, A.Y. 2024-25 (Troy, Donita, Ayen, Viv, Justin)

---

## 1. Summary

On enrollment day, hundreds of freshmen (we estimate 200 to 300, from our own day) pass check-in, a document check, and validation. Then they wait in one big line that splits into course stalls, grouped by department into rows (IT and CS in one area, Engineering in one row). Each stall has 1 or 2 interviewers who check documents again. Nobody can see how long their stall's line is, whether they can step away, or whether they are actually done.

**PUP Enrollment Queue** gives each freshman a ticket for their course stall, a live board of every stall, and a clear "You're fully enrolled" at the end. Staff tap "Call next" at their stall, and the board updates for everyone.

**Honest limit:** it does not add interviewers or make the office faster. It takes away the guessing and the wasted waiting.

## 2. Problem (all from our own 2024-25 enrollment)

- Hundreds of freshmen, one big line, and no wait estimate.
- Students arrive very early for fear of losing their slot.
- After the main line, each course stall has its own line and its own document check.
- Students can't leave to eat or text family without risking their place.
- Students are not sure they are fully enrolled at the end.
- Weak or no signal inside the venue, so guardians outside can't tell where their student is.

## 3. Goals and Non-Goals

**Goals**
1. A live board of every course stall, grouped by department, showing how many are waiting and how many interviewers are active.
2. Each student sees their position at their own stall and an estimated wait, so they know when they can step away.
3. A per-student checklist that ends with "You're fully enrolled."
4. Staff run a stall with two taps: "Call next" and "Mark done."
5. Works with no student data or Wi-Fi: staff devices are the source of truth.

**Non-goals**
- Adding staff or speeding up the office.
- Continuing students, transferees, or graduate students.
- Replacing PUP's enrollment system (SIS) or handling payments.
- Native mobile apps.

## 4. Stations (frozen for the contract)

| # | Station | Who runs it |
|---|---|---|
| 1 | Check-in | Staff desk |
| 2 | Document check | Staff |
| 3 | Validation | Staff |
| 4 | Main waiting line | Board only |
| 5 | Course stall (by department row, 1 or 2 interviewers, second document check) | Interviewer |
| 6 | You're fully enrolled | System |

## 5. Users

| User | Device | Main need |
|---|---|---|
| Freshman | Phone (optional) or printed ticket | My position at my stall, when I can step away, am I done |
| Interviewer / station staff | Laptop or tablet | Call next, mark done, look up by permit number |
| Coordinator | Laptop | See which stalls are clogged |
| Guardian | Phone outside | Which step my student is on (mock in MVP) |

## 6. Requirements (priorities match the 3:30 MVP)

| ID | Requirement | Priority |
|---|---|---|
| B1 | Stall board: every course stall grouped by department row, waiting count, active interviewers | Must |
| S1 | Join by permit number, get a ticket for a course stall | Must |
| S2 | Ticket page: position at stall, estimated wait, checklist, "You're fully enrolled" | Must |
| ST1 | Stall view: Call next, Mark done | Must |
| ST2 | Look up by permit number | Must |
| ST3 | Undo a wrongly marked step | Should |
| V1 | "Now serving" display per department row | Must |
| A1 | Coordinator: average wait and queue length per stall | Must |
| T1 | Printable ticket page with QR | Should |
| G1 | Guardian read-only status page (local mock) | Should |
| G2 | Guardian outbound sync | Next |
| O1 | Slots left per course on the board | Pending (see 11, Q1) |

## 7. Offline design

Everything runs on one laptop (localhost) or the venue's local network. Pages refresh every 2 seconds. Staff-assisted check-in and the printable ticket cover students without phones. The guardian sync to the outside is out of the MVP.

## 8. How we use Bob

- Plan mode wrote each track's spec from this PRD and `docs/contract.md`.
- Agent mode built each page against the shared mock JSON.
- `/review` and tests ran on every PR before it was merged.
- Every run is logged in `docs/bob-log.md` by all five people.

## 9. Team and tracks

| Person | Role | Track |
|---|---|---|
| Troy | Project manager, full stack | Server, contract, merges, deadlines, `bob-log.md` |
| Ayen | Product manager, front end | Student join and ticket page, demo script, 1:00 and 3:00 checks |
| Donita | Full stack | Stall view (Call next, Mark done, lookup, undo) |
| Viv | Front end | Stall board, "Now serving" display, coordinator page |
| Justin | Back end | Stations and stall data, seed script (simulated morning), printable ticket |

Roles are flexible; this is the default split.

## 10. Plan (Asia/Manila)

- **10:45 to 11:15:** freeze `docs/contract.md` (stations, ticket shape, endpoints) and mock JSON. After 11:15 only the project manager changes it.
- **11:15 to 12:00:** each track builds on mocks, with one PR per track and a Bob `/review` on each.
- **12:00:** feature lock, and the mocks are swapped for the server.
- **1:00:** the product manager runs the demo check.
- **3:00:** dry run.
- **3:30:** checkpoint with the working stall board.
- **After 3:30:** fixes, the pitch rehearsed twice, the README, and the Bob log.

**Demo:** the stall board is the first screen. A staff member taps "Call next" live, and the board and a student ticket update in front of the judges. Seeded data is labeled "simulated morning."

## 11. Open questions

1. Could a course run out of slots on the day, and did people switch courses at the stalls? If yes, add O1 and "slots left" becomes the lead moment.
2. What was used at check-in: the permit number, a name, or both? Default: permit number.
3. Is the interview step the same at every stall? Default: yes.

## 12. Success metrics (pilot targets, not yet measured)

Average wait per stall compared with a baseline day; the share of students who knew their position; the share who finished with a confirmed "fully enrolled"; and staff ease-of-use feedback.
