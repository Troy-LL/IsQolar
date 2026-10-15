# Plan reconciliation: isqolar-plan.md vs source docs and the finished prototype

Status: for Viv to approve. Where this file and `isqolar-plan.md` disagree, this file wins. Order of authority: PRD for behavior, design file for look, journey map for steps and flows (it is still a draft), the finished prototype (HANDOFF.md) for anything the docs leave open.

## A. Decisions Viv must confirm (3)

| # | Question | Recommendation |
|---|---|---|
| 1 | **Steps.** Plan says a 6-step checklist. Design file says 4 placeholders (Check-in, Interview, Photo, Documents). Journey map section 1.1 says 5 official steps (Admission, College/Department, Medical, Registration Card, ID Card). | Use the journey map's 5 steps, stored in data (`stepOrder`), shown as "Step N of 5". Never hardcode. |
| 2 | **Queue model.** Prototype and plan: one stall per course, course chosen at join, Hold and Recall. Journey map: one queue per step, course chosen after Step 1, Skip replaces Hold (second skip cancels), venue code to join. | Rebuild what the prototype does (stall per course, Hold/Recall, no venue code). List the journey-map model as "next" in the README so judges see we know the gap. |
| 3 | **Scope.** Journey map section 10 marks "requirements checklist" and "accessibility features" as NOT IN USE. The prototype has both (sample requirements, text size, high contrast, written-communication and guide flags). | Keep them, label requirements as "sample", and tell the team they go beyond the map. |

## B. Corrections to isqolar-plan.md (binding)

### Wrong or unsafe
1. **Exit route.** Plan says `#`. Use `#home` (default route). No reload.
2. **Tick.** Plan says 1 Hz. Use one shared clock ticking every 2 seconds. `SPEED = 60` (1 simulated minute = 1 real second), so each tick advances 2 simulated minutes.
3. **Ticket counter.** Plan says `lastTicket` per stall. Use one global `counter`, four digits, wrap at 9999, `nextNo()` skips numbers of real tickets (one sequence for the day, design D3).
4. **Wait estimate.** Plan uses `ceil`. Use `ahead x svc / interviewers`, rounded to the nearest 5. Under 5 shows "a few minutes". "Early estimate" until the stall has served 10.
5. **Colleges data.** Plan says `colleges.js` re-exports the JSON. A file:// page cannot import JSON. Generate `js/colleges.js` from `data/colleges.json` (13 colleges, 57 programs, Law excluded). Check whether iTech diploma programs belong in the 57 (journey map 3.4 lists iTech as its own section).
6. **Fonts.** Plan says "download or stub". Offline is a hard rule (design principle 11), so bundle the real woff2 files from Fontsource 5.3.0 (list in design file, Tokens, Type). A stub is only allowed until M7.
7. **Slots.** Plan has no formula. Use: total 40 to 80; `slotsLeft = min(total - 4, 18 + rand 35)`; drop 1 every 15 served (floor 2); real Mark done drops 1; clamp to total everywhere, including bars. Day reset when total served passes 92% of `EXPECTED_TOTAL = 3600`.
8. **Plan lists 6 checklist steps.** See A1.

### Names and structure (match the prototype so tests and the build script still work)
9. **Folders.** Use `js/views/` (home, student, guardian, stall, board), each exporting `mount(el, opts)` that returns an unmount function. Plan's `views/`, `js/personas/`, `css/personas/`, `router.js`, `simulation.js`, `qr.js` become: `app.js` (hash router and pill nav), `js/ui.js`, `js/status-mark.js`, `js/a11y.js`, `js/courseinfo.js`, `js/vendor/qrcode.js`. CSS load order: tokens, components, gradient, screens, landing (landing last). One entry page per persona (`student/`, `guardian/`, `staff/`, `board/`).
10. **Routes.** `#home`, `#student`, `#guardian`, `#stall`, `#board`. Plan's `#` and `#staff` are wrong.
11. **Store API (frozen after M1).** Plan names `joinQueue`, `resetDemo`, `freezeNetwork`, `staffSessions` do not exist. Use: `init, start, subscribe, tick, getColleges, stepOrder, isDemo, join, view, myTicketNo, leave, guardianCodeFor, guardianView, guardianRequest, guardianLogin, setAccess, setGuardianPhone, takeControl, staffView, staffCallNext, staffMarkDone, staffHold, staffRecall, undo, undoEnrolled, lookup, adminView, boardScreens, boardView, coursesView, exploreView, collegeView, estimate, mask, formatCode, ticketLabel, resetAll, toggleOffline, isOffline, GUARDIAN_STALE_MS`. Storage key `isqolar.v5`. Staff sign-in sets the stall's `manual` flag. Simulation may live in its own file but must not add exports.
12. **i18n.** Add `tEn`, `tFil`, `tp` (bilingual pair, used by the board) next to `t`. Plan only has `t` and `setLang`.
13. **Demo mode.** Add `window.__PQ_DEMO` (bundle) and `?demo=1` (standalone) for prefills and hints. Plan lacks it.
14. **Missing features in plan.** Ticket QR and "Show to staff" full-screen view; guardian code (`JUAN47`) and guardian mobile (`09171234567`) in Profile and Join; "Use a different ticket"; joining with Juan's permit returns his existing ticket; staff stall pick at sign-in; staff lookup also shows "Undo done"; arrivals each tick are 30% while the queue is under 12; a called real student nobody serves finishes after 15 seconds.
15. **Board.** Pager and dropdown sit outside the 1920x1080 canvas; scale is `width/1920`; columns use `minmax(0, 1fr)`; row heights are budgeted to 1080, so any added height must come from somewhere.
16. **Tests.** Plan says `tools/audit_clicks.js`. Use `tests/audit.py` and `tests/boardcheck.py` (Playwright) and keep the `data-*` hooks listed in HANDOFF section 10 stable.
17. **Milestones.** Keep M1 to M7. Map: M1 foundation, M2 simulation, M3 landing, M4 student (checkpoint M4a join and dashboard, M4b courses, explore, profile), M5 guardian and staff, M6 board, M7 QR, accessibility, build, audit. Freeze the store's exports after M1. After each milestone: commit and add one line to `docs/CHANGELOG.md`.
18. **Bob evidence.** PRD section 8 requires every run logged in `docs/bob-log.md`. Plan never mentions it. Add one line per Bob run (date, mode, prompt, outcome).

### Already consistent (no change)
Design tokens, type scale, tap targets (48 and 64), no red, mark plus word plus color, status words, stale thresholds (8 s and 15 s demo, 60 s and 3 min production), demo logins, Law exclusion, campus assignments, placeholder list.

## C. Known doc conflicts to raise with the team (not Bob's job)

- `docs/PRD.md` is **v0.2**. HANDOFF and the journey map cite **v0.3**. Get the current file.
- Design file cites PRD v0.1 and its IDs (S1 to S7, ST1 to ST7, A1 to A4) do not match PRD v0.2 IDs (B1, S1, S2, ST1 to ST3, T1, G1, G2, O1).
- PRD lists A1 (coordinator, Must). The coordinator persona was removed on request. Confirm A1 is dropped or deferred.
- Design file says one page, no tabs, no gradients, no shadows on cards. Prototype has a bottom nav, gradients and soft shadows. Donita must approve (journey map open question 4).
- Vibration: plan says 2 pulses for next and 3 for your turn. Design says one pattern (200, 100, 200). Pick one before M7.
- Guardian access: prototype uses permit plus OTP shown on screen. Design and journey map use a shared code. Fine for the demo, flag it.
