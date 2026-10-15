# IsQolar — Clickable Prototype Plan

**Reconciliation status:** All items from `PLAN-RECONCILIATION.md` section B have been applied.
The three team-approved decisions (steps, queue model, scope) are incorporated below.
The pointer note has been removed; this file is now the single source of truth for the build plan.

---

## Approved decisions

1. **Steps.** The five official steps from `USER-JOURNEY-MAP.md` section 1.1 are used.
   They are stored in `data/stepOrder` and shown as "Step N of 5". They are never hardcoded.
   | Step | Station | What happens |
   |---|---|---|
   | 1 | Admission | Submit admission documents and entrance credentials |
   | 2 | College / Department | Student picks course, joins that course line; interview and program tagging |
   | 3 | Medical Services Department | Submit chest X-ray and Health Information Form |
   | 4 | Admission and Registration Services Section | Printing of the Registration Card |
   | 5 | Identification Card | ID issuance, last official step |

2. **Queue model.** The prototype builds the stall-per-course model (one stall per course,
   course chosen at join, Hold and Recall, no venue code). The journey map's per-step queues,
   Skip, and venue code are listed under "Next" in the README so judges see we know the gap.

3. **Scope.** The requirements checklist is kept and labelled "sample". The accessibility
   features are kept: text size (100-200%), high contrast, written-communication flag, and
   guide flag.

---

## Top-Level Overview

Build a fully offline, plain-HTML/CSS/ES-modules clickable prototype of **IsQolar**, the
first-year on-site enrollment queue system for PUP Manila. The prototype covers four
isolated persona screens (Student, Guardian, Staff/Stall, Board) plus a Landing page,
all driven by a single shared mock store backed by localStorage and BroadcastChannel.
The PRD governs behavior; the design file governs look. A Python build script (M7) inlines
everything into one portable `IsQolar.html`.

**Confirmed decisions**
- "Exit prototype" routes to `#home` (default route). No hard reload. (B1)
- Board is `1920x1080` rendered with `CSS transform: scale(width/1920)` so it fits any
  viewport. Pager and dropdown sit outside the 1920x1080 canvas. Row heights are budgeted
  to 1080; any added height must come from somewhere. (B15)
- `build_single.py` is a soft requirement; M1-M6 are tested via `index.html` on a local server.
- Store API is frozen after M1. Any name not in the list in M1 below must not be added. (B11)

---

## Sub-Task 1 — Foundation, Data and Design Tokens (M1)

**Status:** [ ] pending

### Intent
Establish every shared file that all later milestones depend on: folder scaffold, fonts,
vendor library, design tokens, college/program data, i18n string stubs, the router, and
the store API skeleton (no simulation logic yet). The store's exported API is frozen at
the end of this milestone.

### Expected Outcomes
- Folder tree matches the spec: `data/`, `fonts/`, `vendor/`, `css/`, `js/views/`,
  `js/`, `tests/`, `tools/`.
- `tokens.css` exports every design token (colors, type scale, tap targets, motion).
- `colleges.json` has all 13 colleges and 57 undergraduate programs (College of Law
  excluded) with campus assignments (NDC: Architecture/Fine Arts, Engineering,
  Communication; M.H. del Pilar: Tourism, Hospitality, Transportation; all others
  default to Mabini with `"buildingConfirmed": false`).
- `js/colleges.js` is generated from `data/colleges.json` as an ES module. (No direct
  JSON import: a file:// page cannot import JSON.) (B5)
- `strings.en.js` has every UI string used across all five screens (stubs OK for later
  screens; must cover M3 Landing fully).
- `strings.fil.js` has matching keys; every value has a `// DRAFT` comment.
- `js/i18n.js` exports `t`, `tEn`, `tFil`, `tp` (bilingual pair, used by the board),
  and `setLang`. (B12)
- `js/store.js` exports exactly the following and nothing else (frozen API):
  `init, start, subscribe, tick, getColleges, stepOrder, isDemo, join, view, myTicketNo,
  leave, guardianCodeFor, guardianView, guardianRequest, guardianLogin, setAccess,
  setGuardianPhone, takeControl, staffView, staffCallNext, staffMarkDone, staffHold,
  staffRecall, undo, undoEnrolled, lookup, adminView, boardScreens, boardView,
  coursesView, exploreView, collegeView, estimate, mask, formatCode, ticketLabel,
  resetAll, toggleOffline, isOffline, GUARDIAN_STALE_MS`.
  Storage key: `isqolar.v5`. Methods that depend on simulation are no-ops returning
  sensible defaults. (B11)
- `app.js` is the hash router and pill nav. It handles `#home`, `#student`, `#guardian`,
  `#stall`, `#board` and defaults to `#home`. (B9, B10)
- Each view file lives in `js/views/` (home, student, guardian, stall, board) and
  exports `mount(el, opts)` returning an unmount function. (B9)
- Supporting modules: `js/ui.js`, `js/status-mark.js`, `js/a11y.js`, `js/courseinfo.js`,
  `js/vendor/qrcode.js`. (B9)
- CSS load order: tokens, components, gradient, screens, landing (landing last). (B9)
- `demo` mode: `window.__PQ_DEMO` (bundle) and `?demo=1` (standalone) enable prefills
  and hints. (B13)
- `build_single.py` exists with a documented TODO skeleton.
- `README.md` exists with demo logins table, placeholder list, and the "Next" section
  listing the journey-map queue model (per-step queues, Skip, venue code). (Decision 2)
- `index.html` loads `app.js` and renders a blank shell with no console errors when
  opened from a local server.
- Commit and add one line to `docs/CHANGELOG.md`. (B17)

### Todo List
- [ ] Create all folders: `data/`, `fonts/`, `vendor/`, `js/views/`, `js/`, `tests/`, `tools/`
- [ ] Bundle the four woff2 font files from Fontsource 5.3.0. A stub is allowed only until M7.
      Document real download URLs in README. (B6)
- [ ] Copy `qrcode-generator` as `js/vendor/qrcode.js`
- [ ] Write `css/tokens.css` -- all color variables, type scale, spacing, motion
- [ ] Write `css/components.css` -- card, button, status marks (6 inline-SVG), nav, focus ring
- [ ] Write `css/gradient.css`, `css/screens.css`, `css/landing.css`
- [ ] Scrape or hand-enter `data/colleges.json` with 13 colleges and 57 programs;
      assign campus field; mark `buildingConfirmed: false` for Mabini defaults.
      Check whether iTech diploma programs belong in the 57. (B5)
- [ ] Generate `js/colleges.js` from the JSON as an ES module
- [ ] Write `js/strings.en.js` -- all keys, English values
- [ ] Write `js/strings.fil.js` -- matching keys, every value `// DRAFT`
- [ ] Write `js/i18n.js` -- `t`, `tEn`, `tFil`, `tp`, `setLang`
- [ ] Write `js/store.js` -- full exported API (frozen list above), localStorage with
      key `isqolar.v5`, BroadcastChannel sync, no-op simulation stubs
- [ ] Write `js/ui.js`, `js/status-mark.js`, `js/a11y.js`, `js/courseinfo.js`
- [ ] Write `app.js` -- hash router with `#home`, `#student`, `#guardian`, `#stall`, `#board`
- [ ] Write `index.html` -- shell with font preloads, CSS links, `<main id="app">`,
      `<script type="module" src="app.js">`
- [ ] Write `tools/build_single.py` skeleton
- [ ] Write `README.md` with demo logins, placeholder list, "Next" section
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Design tokens: maroon `#880000`, maroon-deep `#5C0000`, gold `#FFCC00`, green `#1B6E3F`,
  ink `#1F1A1A`, ink-soft `#5E5656`, line `#E2DCD8`, paper `#FFFFFF`, shell `#F7F4F2`.
- Type scale: heading-l 28, heading-m 20, heading-s 16, text-m 18, text-s 16, caption 14;
  ticket-number 72 mono; num-l 40; board numbers 120-160 mono.
- Tap targets 48 px (student, guardian, admin); staff buttons 64 px.
- Fonts: Atkinson Hyperlegible Next (text), Atkinson Hyperlegible Mono (numbers),
  Cinzel Bold (the three letters "PUP" only).
- Demo student: permit `2026-00123-MN-0`, first name `Juan`, course `BSIT`,
  guardian mobile `09171234567`, guardian code `JUAN47`. Staff PIN `1234`. (B14)
- `stepOrder` is the ordered array of the five official steps from Decision 1.
  Every screen that shows step names reads from this array.

---

## Sub-Task 2 — Simulation Engine (M2)

**Status:** [ ] pending

### Intent
Bring the store to life: ticking queues, auto-serve, slot decay, day-reset, wait estimates,
and offline-freeze. All simulation state lives in `store.js`; the tick engine may live in
its own file but must not add exports beyond what M1 froze. (B11)

### Expected Outcomes
- One shared clock ticks every 2 real seconds. `SPEED = 60` (1 simulated minute = 1
  real second), so each tick advances 2 simulated minutes. (B2)
- Each stall: 1-2 interviewers, 3-6 min/student, 40-80 total slots; values fixed at init.
- Slot formula: `slotsLeft = min(total - 4, 18 + rand(35))` at init; drops 1 every
  15 served (floor 2); real Mark done drops 1; clamped to total everywhere including
  bars. Day reset when total served passes 92% of `EXPECTED_TOTAL = 3600`. (B7)
- New arrivals add 30% of the time while the queue is under 12; stalls with staff
  signed in are not auto-served. (B14)
- A called real student nobody serves finishes after 15 real seconds. (B14)
- Ticket counter: one global `counter`, four digits, wraps at 9999.
  `nextNo()` skips numbers already in any live queue. (B3)
- Wait estimate: `ahead x svc / interviewers`, rounded to nearest 5. Under 5 shows
  "a few minutes". "Early estimate" tag until the stall has served 10. (B4)
- `toggleOffline(true)` halts all subscriber callbacks without stopping the tick. (B11)
- BroadcastChannel `"isqolar"` posts the full state blob on every tick and on every
  store mutation so other tabs stay in sync.
- Stale thresholds: student/staff/board 8 s (60 s production), guardian 15 s
  (3 min production). `GUARDIAN_STALE_MS` exported from store. (B11)
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Wire simulation constants in `store.js` (per-stall, seeded at `resetAll()`)
- [ ] Write simulation tick file -- `startSim()`, `stopSim()`, `tick()`;
      no new store exports (B11)
- [ ] Implement queue-growth logic (30% arrivals, cap at 12) (B14)
- [ ] Implement auto-finish (15 s after `calledAt`) (B14)
- [ ] Implement slot formula and day-reset (B7)
- [ ] Implement wait-estimate computation and "Early estimate" flag (B4)
- [ ] Implement `toggleOffline` flag in subscribe loop (B11)
- [ ] Implement BroadcastChannel emit on tick and on every mutation
- [ ] Write stale-state detection helper exported from `store.js` (via `isOffline`) (B11)
- [ ] Add simulation import to `index.html` module graph; verify no console errors
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Global `counter` wraps at 9999. `nextNo()` skips numbers in any live queue or
  on-hold list (not per-stall as the old plan said). (B3)
- Staff sign-in sets the stall's `manual` flag; simulation skips auto-serve for those
  stalls. (B11 `takeControl`)

---

## Sub-Task 3 — Landing Page (M3)

**Status:** [ ] pending

### Intent
Build the `#home` route -- the public face of IsQolar and the entry point for every
persona picker. Must be fully interactive and i18n-ready.

### Expected Outcomes
- Floating pill nav with logo, EN|FIL switch, and anchor links.
- Hero section with inline icon chip and illustration placeholder.
- Features section.
- Benefits section (6 tiles).
- How it works (4 steps).
- Live count widget: course select populated from `colleges.json`, slots gauge.
- Persona picker: Student to `#student`, Guardian to `#guardian`, Staff to `#stall`,
  Now Serving Board to `#board`.
- Prototype tools panel: Reset (calls `store.resetAll()`), Simulate network loss toggle
  (calls `store.toggleOffline()`). (B11)
- Banner, 8 FAQs (accordion), footer.
- EN|FIL toggle switches all strings via `i18n.js`.
- No console errors; all links and buttons functional.
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Write `js/views/home.js` -- `mount(el, opts)` returning `unmount`
- [ ] Hydrate live count widget, wire prototype tools, wire persona picker navigation,
      wire FAQ accordions
- [ ] Add landing CSS in `css/landing.css`
- [ ] Populate all landing strings in `strings.en.js` and `strings.fil.js`
- [ ] Verify pill nav anchors scroll correctly
- [ ] Verify prototype tools call store correctly (`resetAll`, `toggleOffline`)
- [ ] Verify persona picker routes to correct hash without linking personas together
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Floating pill nav: maroon gradient button style.
- Dark maroon gradient panels with gold letter-spaced titles and white inner card.
- Gold gradient stat bands.
- Hover lifts and press settles (respect `prefers-reduced-motion`).

---

## Sub-Task 4a — Student Persona: Join and Dashboard (M4a)

**Status:** [ ] pending

### Intent
Deliver the critical enrollment path -- joining a queue and seeing live status -- before
the remaining student tabs are built. This proves store sync end-to-end.

### Expected Outcomes
- `#student` loads a Join form: permit number, first name, course dropdown, optional
  guardian mobile. Inline errors (never modal). Submit calls `store.join()`. (B11)
- "Use a different ticket" action available after joining. (B14)
- Joining with Juan's permit returns his existing ticket, not a new one. (B14)
- Dashboard tab shows: queue ticket (4-digit, zero-padded), live people-ahead count,
  wait estimate shown as "about N min" rounded to 5 (B4), enrollment steps checklist
  showing all five official steps as "Step N of 5" read from `store.stepOrder` (Decision 1),
  requirements checklist (sample, labelled). (Decision 3)
- Call banner: gold, pinned to top, vibrates (pattern per the design file: 200ms, 100ms,
  200ms -- the vibration pattern conflict with the old plan is noted in C of PLAN-RECONCILIATION
  and will be resolved before M7), updates tab title.
- On-hold state displayed with pause mark and next step.
- Green enrolled card when status is "done".
- Updates section: course slots with progress bar and word status.
- "Read my status" button uses `speechSynthesis`.
- `aria-live` region announces status changes.
- Stale warning after 8 seconds without a tick.
- "Exit prototype" routes to `#home`, not any other persona. (B1)
- Bottom nav shows Dashboard tab as active; other tabs (Courses, Explore, Profile)
  render placeholder content for now.
- `?demo=1` prefills permit and shows hints. (B13)
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Write `js/views/student.js` -- `mount(el, opts)` returning `unmount`,
      with bottom nav shell
- [ ] Write Join form section (permit, name, course, guardian mobile)
- [ ] Write Dashboard section (ticket card, steps checklist reading `store.stepOrder`,
      requirements checklist labelled "sample", call banner, on-hold state, enrolled card,
      updates)
- [ ] Wire Join form validation and submit via `store.join()`
- [ ] Wire Dashboard live updates via `store.subscribe` and `store.view`
- [ ] Wire call banner logic, vibration, aria-live, speechSynthesis
- [ ] Wire stale-state warning via `store.isOffline` / `GUARDIAN_STALE_MS`
- [ ] Add "Use a different ticket" action calling `store.leave` then re-showing Join
- [ ] Stub Courses, Explore, Profile tabs with "Coming soon" placeholders
- [ ] Add student CSS; verify 320/360/390/430 px widths (no overflow, no text touching edges)
- [ ] Verify "Exit prototype" routes to `#home`
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Max width 480 px, one column.
- Status marks: not-yet, in-line, your-turn, done, on-hold, problem -- always mark plus
  word plus color, never color alone. No red.
- Ticket: 72 px mono, zero-padded 4 digits.
- Demo student permit `2026-00123-MN-0`, first name `Juan`, course `BSIT`.
- Steps checklist must read from `store.stepOrder`, not hardcoded names. (Decision 1)

---

## Sub-Task 4b — Student Persona: Courses, Explore and Profile (M4b)

**Status:** [ ] pending

### Intent
Complete the remaining three tabs of the Student persona.

### Expected Outcomes
- **Courses tab**: Hero title, "Your course" dark tile, shortest/longest line tiles, college
  dropdown, search field, bento grid of square tiles (code, name, big in-line count, slots bar,
  "Almost full"/"Full" mark). Busiest stall per college is a wide tile. Course detail
  modal/view: gold stats band, tabbed panel (Overview: 2x2 white cards on dark panel;
  Subjects: Year 1-4 chips plus curriculum list with units and total). Sample content
  labelled as such. (Decision 3)
- **Explore tab**: Three campus zones; NDC holds Architecture/Fine Arts, Engineering,
  Communication; M.H. del Pilar holds Tourism, Hospitality, Transportation; others default
  Mabini ("building to be confirmed"). Walking guide (Pylon and Mural, Freedom Plaza, Main
  Academic Building). College tiles with waiting count; tapping opens a widget. Longest
  lines panel. Enrollees panel: big enrolled number, three-part progress bar. Map is
  schematic and labelled "not to scale."
- **Profile tab**: Masked permit (via `store.mask`), course (shown after confirmed at Step 2),
  language toggle, text size (100-200%), high contrast, "prefer written communication"
  flag, "need a guide" flag (flags visible only to staff), guardian mobile field (via
  `store.setGuardianPhone`), guardian code display (via `store.guardianCodeFor`),
  "Use a different ticket" action. (B11, B14, Decision 3)
- All tabs respect text-size and high-contrast settings immediately on change.
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Replace Courses stub with full bento grid and course detail view
      (calls `store.coursesView`, `store.collegeView`)
- [ ] Wire college dropdown and search to filter grid
- [ ] Build course detail with Overview and Subjects tabs; add sample curriculum data
      labelled "sample"
- [ ] Replace Explore stub with three-zone campus guide (calls `store.exploreView`)
- [ ] Build college tile tap to widget overlay
- [ ] Build enrollees panel and longest-lines list
- [ ] Replace Profile stub with all settings; wire text-size to
      `document.documentElement` style, high-contrast to a CSS class
- [ ] Wire accessibility flags to store via `store.setAccess`
- [ ] Wire guardian code display and guardian mobile field
- [ ] Verify bento grid at all four breakpoints
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Bento tiles: code, name, big in-line queue number, slots bar, status mark plus word.
- Wide tile for busiest stall per college.
- "Almost full" threshold: slots left at or below 10% of total. "Full" = 0 slots left.
- Accessibility flags (`preferWritten`, `needsGuide`) are stored in the student record
  via `store.setAccess` and surfaced to staff at their stall. (B14)

---

## Sub-Task 5 — Guardian and Staff Personas (M5)

**Status:** [ ] pending

### Intent
Build the Guardian (`#guardian`) and Staff/Stall (`#stall`) personas.

### Expected Outcomes
**Guardian**
- Sign-in: student permit number, then a 6-digit OTP. The OTP is shown on screen as a
  prototype hint. Calls `store.guardianRequest` then `store.guardianLogin`. (HANDOFF 6)
- Demo: permit `2026-00123-MN-0`, fixed OTP `482913`. The guardian code `JUAN47` (and
  guardian mobile `09171234567`) is the share code on the student's Profile and ticket,
  not the sign-in. (HANDOFF 5)
- Dashboard: Updates (course slots), student status sentence, enrollment steps
  (five official steps from `store.stepOrder`, shown as "Step N of 5"), last-updated
  timestamp with stale warning after 15 s. (Decision 1)
- Never shows ticket number, QR, permit, or wait time.
- "Exit prototype" routes to `#home`. (B1)

**Staff/Stall**
- Sign-in: PIN (`1234` for demo) plus stall pick. Sets the stall's
  `manual` flag via `store.takeControl`. (B14, B11)
- Stall header: slots left, stall name.
- Action buttons (64 px): Call Next, Mark Done, Hold, Recall, Undo. Undo shows a
  toast that stays until dismissed. Calls `staffCallNext`, `staffMarkDone`, `staffHold`,
  `staffRecall`, `undo`. (B11)
- Lookup field: by permit or ticket number. Results include "Undo done" action via
  `store.undoEnrolled`. (B14, B11)
- Line overview: next five in queue (ticket numbers only).
- On-hold list.
- Written-communication card (shown when `preferWritten` flag is set). (Decision 3)
- "Needs a guide" notice (shown when `needsGuide` flag is set). (Decision 3)
- Keyboard shortcuts N, D, H, U -- disabled while an input is focused.
- Sign out clears session.
- "Exit prototype" routes to `#home`. (B1)
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Write `js/views/guardian.js` -- `mount(el, opts)` returning `unmount`
- [ ] Implement guardian sign-in flow (permit plus guardian code) with on-screen hint
- [ ] Wire guardian dashboard to store via `store.guardianView`;
      steps checklist reads `store.stepOrder` (Decision 1)
- [ ] Implement stale warning (15 s, `GUARDIAN_STALE_MS`)
- [ ] Write `js/views/stall.js` -- `mount(el, opts)` returning `unmount`
- [ ] Implement stall pick and PIN sign-in, calling `store.takeControl`
- [ ] Implement all action buttons wired to store API
- [ ] Implement Undo toast
- [ ] Implement lookup and "Undo done" via `store.lookup` and `store.undoEnrolled`
- [ ] Implement keyboard shortcuts with focus guard
- [ ] Show written-comm card and guide notice from accessibility flags in student record
- [ ] Verify neither persona links to any other persona
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Staff buttons are 64 px tap targets.
- Written-comm card and guide notice are sourced from the student's `accessibilityFlags`
  in the store via `store.lookup`; staff see them only at their own stall.
- Guardian sign-in uses `store.guardianRequest` then `store.guardianLogin`. (B11)

---

## Sub-Task 6 — Board Persona (M6)

**Status:** [ ] pending

### Intent
Build the `#board` persona: a 1920x1080 display screen scaled to fit any viewport,
showing one college at a time with live ticket numbers.

### Expected Outcomes
- 13 college screens; Previous/Next pager and dropdown navigator, placed outside the
  1920x1080 canvas. (B15)
- Large layout (at most 4 stalls): one row. Compact layout (5-8 stalls): two rows.
- Header: date, live clock, "Updated X s ago" indicator.
- Each stall card: code, full name, desk count, waiting count, now-serving number
  (gold, large mono), next three ticket numbers.
- Footer: QR code (generated by `js/vendor/qrcode.js`), English plus Filipino help text.
- Scale via `transform: scale(width/1920)` from a fixed 1920x1080 root element. (B15)
- Columns use `minmax(0, 1fr)`. Row heights are budgeted to 1080. (B15)
- Stale indicator after 8 s without a tick.
- "Exit prototype" routes to `#home` (accessible even at small scale). (B1)
- All 13 screens fit within 1080 px height with nothing clipped.
- `tp()` bilingual pairs ("Now serving - Tinatawag na") used for all board strings. (B12)
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Write `js/views/board.js` -- `mount(el, opts)` returning `unmount`
- [ ] Implement scale-to-fit transform (`width/1920`); recalculate on window resize (B15)
- [ ] Build stall card component (large and compact variants)
- [ ] Build college pager (Previous/Next plus dropdown) outside the 1920x1080 canvas
- [ ] Wire live clock and date
- [ ] Wire stale indicator
- [ ] Integrate `js/vendor/qrcode.js` for footer QR
- [ ] Add bilingual footer help text strings using `tp()` to both string files (B12)
- [ ] Verify all 13 college screens at 1920x1080 (no clip)
- [ ] Verify scale-to-fit on 1280, 1024, 768, and 375 px wide viewports
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- Board numbers: 120-160 px mono.
- Now-serving number on gold background.
- Four-digit zero-padded ticket numbers only -- no names, no permits.
- `store.boardScreens` and `store.boardView` provide the data. (B11)

---

## Sub-Task 7 — QR, Accessibility, Build and Audit (M7)

**Status:** [ ] pending

### Intent
Finalize all cross-cutting concerns: QR generation, full accessibility pass, the
`build_single.py` single-file output, and the automated audit.

### Expected Outcomes
- QR codes render ink-on-white with a 4-module quiet zone using `js/vendor/qrcode.js`.
- `aria-live` regions cover all dynamic status changes across all four personas.
- `speechSynthesis` "read my status" button works in Student persona.
- Vibration pattern: 200ms, 100ms, 200ms (resolves the conflict noted in PLAN-RECONCILIATION
  section C). Guard behind feature detection; iOS Safari does not vibrate.
- Text-size (100-200%) and high-contrast mode work across all personas. (Decision 3)
- `prefers-reduced-motion` suppresses all hover-lift and press-settle animations.
- Fonts are fully bundled woff2 files from Fontsource 5.3.0 (not stubs). (B6)
- `tools/build_single.py` runs with `python tools/build_single.py`; produces `IsQolar.html`
  that opens by double-click with no network, no server.
- Automated audit: `tests/audit.py` and `tests/boardcheck.py` (Playwright). (B16)
  Target: 0 broken buttons or links across all screens. `data-*` hooks listed in
  HANDOFF section 10 must remain stable.
- `IsQolar.html` produces zero console errors when opened from `file://`.
- README updated with final demo logins, placeholder list, "Next" section for the
  journey-map queue model, and design-owner approval flags.
- Commit and add one line to `docs/CHANGELOG.md`.

### Todo List
- [ ] Finalize `js/vendor/qrcode.js` wrapper; verify 4-module quiet zone
- [ ] Audit every interactive element for `aria-label` or visible label
- [ ] Add `aria-live="polite"` regions to all status update areas
- [ ] Test and fix `speechSynthesis` in Student Dashboard
- [ ] Test vibration API (200ms, 100ms, 200ms; guard behind feature detection) (Design file)
- [ ] Verify `prefers-reduced-motion` suppression in `tokens.css`
- [ ] Ensure woff2 font files are fully bundled, not stubs (B6)
- [ ] Complete `tools/build_single.py` -- inline CSS, fonts (base64), vendor JS,
      data JSON, all module JS via esbuild, produce `IsQolar.html`
- [ ] Write `tests/audit.py` and `tests/boardcheck.py` (Playwright); run and fix failures
- [ ] Keep `data-*` hooks listed in HANDOFF section 10 stable (B16)
- [ ] Open `IsQolar.html` from `file://`, confirm zero console errors
- [ ] Final README pass: demo logins, placeholder list, "Next" section, design-owner flags
- [ ] Tag repo or create zip
- [ ] Commit and add one line to `docs/CHANGELOG.md`

### Relevant Context
- `qrcode-generator` API: `qrcode(typeNumber, errorCorrectionLevel)` then `make()` then
  `createSvgTag()`.
- Quiet zone = 4 modules; enforce via SVG viewBox padding.
- Build script uses `npx esbuild` for JS bundling; CSS and fonts are inlined via Python
  `base64.b64encode`.
- Playwright tests use `data-*` hooks from HANDOFF section 10. (B16)

---

## Biggest Risk and Fallback

**Risk:** The Student persona (M4a and M4b) is the largest single surface. If the bento
grid, campus explorer, and curriculum explorer all land in one pass, the milestone will
likely slip and block Staff and Board.

**Fallback:** M4a and M4b are already split. If M4b runs long, deliver M4a (Join and
Dashboard) as a shippable checkpoint, start M5 and M6 in parallel, and fold M4b in before
M7. Board and build steps have no dependency on the Courses/Explore/Profile tabs.

---

## README Demo Logins (draft)

| Role | Credential | Value |
|------|-----------|-------|
| Student | Permit number | `2026-00123-MN-0` |
| Student | First name | `Juan` |
| Student | Course | `BSIT` |
| Guardian | Sign in with student permit, OTP (shown on screen) | `482913` |
| Student | Guardian share code (Profile and ticket) | `JUAN47` |
| Student | Guardian mobile (optional) | `09171234567` |
| Staff | PIN | `1234` |

---

## Placeholder List (items that need real content before launch)

- [ ] woff2 font files (download from Fontsource 5.3.0 -- see Tokens/Type in design file)
- [ ] Campus illustration or hero image
- [ ] Course descriptions (Overview tab -- sample text labelled)
- [ ] Subject/curriculum data per program (sample labelled)
- [ ] Walking guide photos or icons for Explore tab
- [ ] Real Filipino translations (all `strings.fil.js` values are drafts)
- [ ] Design-owner approval: gradients, gold stat bands, soft drop shadows exceed the design file spec (Donita)
- [ ] QR destination URL (currently points to `#home` landing)
- [ ] College of Law exclusion confirmed with Registrar
- [ ] Production stale thresholds (60 s student/staff/board; 3 min guardian) -- currently 8 s / 15 s in prototype
- [ ] PUP Gym exits list (markdown file still to be provided -- journey map open question 12)
- [ ] iTech diploma programs: confirm which belong in the 57 first-year programs (B5)
- [ ] Real colleges and courses list from the registrar (current `pup-colleges-courses-draft.csv` is a placeholder)
- [ ] Vibration pattern confirmed (design file says 200ms 100ms 200ms; old plan said 2 pulses / 3 pulses)

---

## Next (not in this prototype, visible to judges)

The journey map (`USER-JOURNEY-MAP.md` section 8) describes a more complete model that this
prototype does not yet build:

- One queue per enrollment step (instead of one stall per course)
- Course chosen after Step 1, before joining the Step 2 line
- Skip action (replaces Hold and Recall): first Skip sends ticket to back of line, second
  Skip cancels; Restore and Remove actions
- Venue code required at join to prevent ghost tickets
- Accept action at the next step (in case staff forgot Mark done)
- Stuck-ticket reminder after 15 minutes being served
- Line order by queue-entry time per step, not by ticket number
- Place in line per step on the phone; next three numbers per step on the projector
- Confirmed course recorded at Step 2; slots decrement only on Mark done at Step 2
- Change course action for staff at Step 2
