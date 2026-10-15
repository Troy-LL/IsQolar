# IsQolar — Clickable Prototype Plan

> **Read `docs/PLAN-RECONCILIATION.md` first. Section B overrides anything below that disagrees with it** (routes, store API names, tick rate, folder structure, steps, milestone mapping).

## Top-Level Overview

Build a fully offline, plain-HTML/CSS/ES-modules clickable prototype of **IsQolar**, the
first-year on-site enrollment queue system for PUP Manila. The prototype covers four
isolated persona screens (Student, Guardian, Staff/Stall, Board) plus a Landing page,
all driven by a single shared mock store backed by localStorage and BroadcastChannel.
The PRD governs behavior; the design file governs look. A Python build script (M7) inlines
everything into one portable `IsQolar.html`.

**Confirmed decisions**
- "Exit prototype" routes to `#` (landing page), never a hard reload.
- Board is `1920×1080` rendered with `CSS transform: scale()` so it fits any viewport.
- `build_single.py` is a soft requirement; M1–M6 are tested via `index.html` on a local server.

---

## Sub-Task 1 — Foundation, Data & Design Tokens

**Status:** [ ] pending

### Intent
Establish every shared file that all later milestones depend on: folder scaffold, fonts,
vendor library, design tokens, college/program data, i18n string stubs, the router, and
the store API skeleton (no simulation logic yet).

### Expected Outcomes
- Folder tree matches the spec exactly.
- `tokens.css` exports every design token (colors, type scale, tap targets, motion).
- `colleges.json` has all 13 colleges × 57 undergraduate programs (College of Law excluded)
  with campus assignments (NDC: Architecture/Fine Arts, Engineering, Communication;
  M.H. del Pilar: Tourism, Hospitality, Transportation; all others default to Mabini
  with `"buildingConfirmed": false`).
- `colleges.js` re-exports the JSON as an ES module.
- `strings.en.js` has every UI string used across all five screens (stubs OK for later
  screens; must cover M3 Landing fully).
- `strings.fil.js` has matching keys; every value has a `// DRAFT` comment.
- `store.js` exports the full stable API (all methods listed in the data model); methods
  that depend on simulation are no-ops returning sensible defaults.
- `router.js` handles `#student`, `#guardian`, `#stall`, `#board`, defaults to `#` (landing).
- `build_single.py` exists with a documented TODO skeleton; running it prints
  "Build not yet finalized (M7)."
- `README.md` exists with demo logins table and a placeholder list.
- `index.html` loads `router.js` and renders a blank shell with no console errors when
  opened from a local server.

### Todo List
- [ ] Create all folders: `data/`, `fonts/`, `vendor/`, `css/personas/`, `js/personas/`,
      `views/`, `tools/`
- [ ] Download or stub the four woff2 font files; document real download URLs in README
- [ ] Copy `qrcode-generator` as `vendor/qrcode.js`
- [ ] Write `css/tokens.css` — all color variables, type scale, spacing, motion
- [ ] Write `css/components.css` — card, button, status marks (6 inline-SVG), nav, focus ring
- [ ] Scrape / hand-enter `data/colleges.json` with 13 colleges and 57 programs;
      assign campus field; mark `buildingConfirmed: false` for Mabini defaults
- [ ] Generate `js/colleges.js` from the JSON
- [ ] Write `js/strings.en.js` — all keys, English values
- [ ] Write `js/strings.fil.js` — matching keys, every value `// DRAFT`
- [ ] Write `js/i18n.js` — `t(key)` helper and `setLang(lang)` dispatcher
- [ ] Write `js/store.js` — full exported API, localStorage persistence, BroadcastChannel
      sync, no-op simulation stubs
- [ ] Write `js/router.js` — hash-change listener, view injection, Exit → `#`
- [ ] Write `index.html` — shell with font preloads, CSS links, `<main id="app">`,
      `<script type="module" src="js/router.js">`
- [ ] Write `tools/build_single.py` skeleton
- [ ] Write `README.md` with demo logins, placeholder list, design-owner flags

### Relevant Context
- Design tokens: maroon `#880000`, maroon-deep `#5C0000`, gold `#FFCC00`, green `#1B6E3F`,
  ink `#1F1A1A`, ink-soft `#5E5656`, line `#E2DCD8`, paper `#FFFFFF`, shell `#F7F4F2`.
- Type scale: heading-l 28, heading-m 20, heading-s 16, text-m 18, text-s 16, caption 14;
  ticket-number 72 mono; num-l 40; board numbers 120–160 mono.
- Tap targets 48 px (staff 64 px).
- Fonts: Atkinson Hyperlegible Next (text), Atkinson Hyperlegible Mono (numbers),
  Cinzel Bold (the three letters "PUP" only).
- Demo student: permit `2026-00123-MN-0`, course `BSIT`, guardian mobile `09171234567`,
  OTP `482913`. Staff PIN `1234`.

---

## Sub-Task 2 — Simulation Engine

**Status:** [ ] pending

### Intent
Bring the store to life: ticking queues, auto-serve, slot decay, day-reset, wait estimates,
and network-freeze. All simulation state lives in `store.js`; the tick engine lives in
`simulation.js`.

### Expected Outcomes
- `simulation.js` starts a 1 Hz tick (1 sim-minute = 1 real second).
- Each stall: 1–2 interviewers, 3–6 min/student, 40–80 total slots; values fixed at init.
- New arrivals keep every queue ≤ 12; stalls with staff signed in are not auto-served.
- A called student not served within 15 real seconds is auto-finished.
- Wait estimate = `Math.ceil(ahead × minsPerStudent / interviewers / 5) × 5`;
  shows "a few minutes" when < 5; tag "Early estimate" until stall has served ≥ 10.
- Slots left never exceeds total (clamped); drops slowly as students are served.
- When `totalServed > 0.92 × 3600`, reset served counts and slots for a new simulated day
  (queues are preserved).
- `store.freezeNetwork(true)` halts all subscriber callbacks without stopping the tick.
- BroadcastChannel `"isqolar"` posts the full state blob on every tick and on every
  store mutation so other tabs stay in sync.
- Stale thresholds: student/staff/board 8 s (60 s production), guardian 15 s (3 min production).

### Todo List
- [ ] Wire up simulation constants in `store.js` (per-stall, seeded at `resetDemo()`)
- [ ] Write `js/simulation.js` — `startSim()`, `stopSim()`, `tick()` exported functions
- [ ] Implement queue-growth logic (random arrivals capped at 12)
- [ ] Implement auto-finish (15 s after `calledAt`)
- [ ] Implement slot decay and day-reset
- [ ] Implement wait-estimate computation and "Early estimate" flag
- [ ] Implement `freezeNetwork` flag in subscribe loop
- [ ] Implement BroadcastChannel emit on tick and on every mutation
- [ ] Write stale-state detection helper exported from `store.js`
- [ ] Add `simulation.js` to `index.html` module graph; verify no console errors

### Relevant Context
- Ticket numbers: four digits zero-padded, wrap at 9999, never reuse a live ticket's number.
  Store `lastTicket` per stall and skip numbers that appear in `queue` or `onHold`.
- Staff sign-in sets `staffSessions[code] = true`; simulation skips auto-serve for those stalls.

---

## Sub-Task 3 — Landing Page

**Status:** [ ] pending

### Intent
Build the `#` (default) route — the public face of IsQolar and the entry point for every
persona picker. Must be fully interactive and i18n-ready.

### Expected Outcomes
- Floating pill nav with logo, EN|FIL switch, and anchor links.
- Hero section with inline icon chip and illustration placeholder.
- Features section.
- Benefits section (6 tiles).
- How it works (4 steps).
- Live count widget: course select populated from `colleges.json`, slots gauge.
- Persona picker: Student → `#student`, Guardian → `#guardian`, Staff → `#stall`,
  Now Serving Board → `#board`.
- Prototype tools panel: Reset (calls `store.resetDemo()`), Simulate network loss toggle.
- Banner, 8 FAQs (accordion), footer.
- EN|FIL toggle switches all strings via `i18n.js`.
- No console errors; all links/buttons functional.

### Todo List
- [ ] Write `views/landing.html` partial
- [ ] Write `js/personas/landing.js` — hydrate live count widget, wire prototype tools,
      wire persona picker navigation, wire FAQ accordions
- [ ] Add landing CSS to `css/personas/` or extend `components.css`
- [ ] Populate all landing strings in `strings.en.js` and `strings.fil.js`
- [ ] Verify pill nav anchors scroll correctly
- [ ] Verify prototype tools call store correctly
- [ ] Verify persona picker routes to correct hash without linking personas together

### Relevant Context
- Floating pill nav: maroon gradient button style.
- Dark maroon gradient panels with gold letter-spaced titles and white inner card.
- Gold gradient stat bands.
- Hover lifts and press settles (respect `prefers-reduced-motion`).

---

## Sub-Task 4a — Student Persona: Join + Dashboard

**Status:** [ ] pending

### Intent
Deliver the critical enrollment path — joining a queue and seeing live status — before
the remaining student tabs are built. This proves store sync end-to-end.

### Expected Outcomes
- `#student` loads a Join form: permit number, first name, course dropdown, optional guardian mobile.
  Inline errors (never modal). Submit calls `store.joinQueue()`.
- Dashboard tab shows: queue ticket (4-digit, zero-padded), live people-ahead count, wait estimate,
  enrollment steps checklist (6 steps), requirements checklist (sample, labelled).
- Call banner: gold, pinned to top, vibrates (2 pulses = next, 3 = your turn), updates tab title.
- On-hold state displayed with triangle mark and next step.
- Green enrolled card when status = "done".
- Updates section: course slots with progress bar + word status.
- "Read my status" button uses `speechSynthesis`.
- `aria-live` region announces status changes.
- Stale warning after 8 seconds without a tick.
- "Exit prototype" routes to `#`, not to any other persona.
- Bottom nav shows Dashboard tab as active; other tabs (Courses, Explore, Profile) render
  placeholder content for now.

### Todo List
- [ ] Write `views/student.html` with bottom nav shell
- [ ] Write Join form section (permit, name, course, guardian mobile)
- [ ] Write Dashboard section (ticket card, steps checklist, requirements checklist,
      call banner, on-hold state, enrolled card, updates)
- [ ] Wire `js/personas/student.js` — Join form validation and submit, Dashboard live updates,
      call banner logic, vibration, aria-live, speechSynthesis
- [ ] Wire stale-state warning
- [ ] Stub Courses, Explore, Profile tabs with "Coming soon" placeholders
- [ ] Add student CSS; verify 320/360/390/430 px widths (no overflow, no text touching edges)
- [ ] Verify "Exit prototype" routes to `#`

### Relevant Context
- Max width 480 px, one column.
- Status marks: not-yet, in-line, your-turn, done, on-hold, problem — always mark + word + color,
  never color alone. No red.
- Ticket: 72 px mono, zero-padded 4 digits.
- Demo student permit `2026-00123-MN-0`, course `BSIT`.

---

## Sub-Task 4b — Student Persona: Courses, Explore & Profile

**Status:** [ ] pending

### Intent
Complete the remaining three tabs of the Student persona.

### Expected Outcomes
- **Courses tab**: Hero title, "Your course" dark tile, shortest/longest line tiles, college
  dropdown, search field, bento grid of square tiles (code, name, big in-line count, slots bar,
  "Almost full"/"Full" mark). Busiest stall per college = wide tile. Course detail modal/view:
  gold stats band, tabbed panel (Overview: 2×2 white cards on dark panel; Subjects: Year 1–4
  chips + curriculum list with units and total). Sample content labelled as such.
- **Explore tab**: Three campus zones; NDC holds Architecture/Fine Arts, Engineering,
  Communication; M.H. del Pilar holds Tourism, Hospitality, Transportation; others default
  Mabini ("building to be confirmed"). Walking guide (Pylon+Mural, Freedom Plaza, Main Academic
  Building). College tiles with waiting count; tapping opens a widget. Longest lines panel.
  Enrollees panel: big enrolled number, three-part progress bar. Map is schematic and
  labelled "not to scale."
- **Profile tab**: Masked permit, course, language toggle, text size (100–200%), high contrast,
  "prefer written communication", "need a guide" (flags visible only to staff), guardian mobile
  field, "Use a different ticket" action.
- All tabs respect text-size and high-contrast settings immediately on change.

### Todo List
- [ ] Replace Courses stub with full bento grid and course detail view
- [ ] Wire college dropdown and search to filter grid
- [ ] Build course detail with Overview and Subjects tabs; add sample curriculum data
- [ ] Replace Explore stub with three-zone campus guide
- [ ] Build college tile tap → widget overlay
- [ ] Build enrollees panel and longest-lines list
- [ ] Replace Profile stub with all settings; wire text-size to `document.documentElement`
      style, high-contrast to a CSS class
- [ ] Wire accessibility flags to store student record
- [ ] Verify bento grid at all four breakpoints

### Relevant Context
- Bento tiles: code, name, big in-line queue number, slots bar, status mark+word.
- Wide tile for busiest stall per college.
- "Almost full" threshold: slots left ≤ 10% of total. "Full" = 0 slots left.

---

## Sub-Task 5 — Guardian & Staff Personas

**Status:** [ ] pending

### Intent
Build the Guardian (`#guardian`) and Staff/Stall (`#stall`) personas.

### Expected Outcomes
**Guardian**
- Sign-in with student permit, then 6-digit OTP. Show OTP on screen as prototype hint.
  Demo OTP `482913` for permit `2026-00123-MN-0`.
- Dashboard: Updates (course slots), child status sentence, enrollment steps, last-updated
  timestamp with stale warning after 15 s.
- Never shows ticket number, QR, permit, or wait time.
- "Exit prototype" → `#`.

**Staff/Stall**
- Sign-in with stall PIN (`1234` for demo).
- Stall header: slots left, stall name.
- Action buttons (64 px): Call Next, Mark Done, Hold, Recall, Undo. Undo shows a toast that stays until dismissed.
- Lookup field: by permit or ticket number, with "Undo done" action in results.
- Line overview: next five in queue (ticket numbers only).
- On-hold list.
- Written-communication card (shown when `preferWritten` flag is set).
- "Needs a guide" notice (shown when `needsGuide` flag is set).
- Keyboard shortcuts N, D, H, U — disabled while an input is focused.
- Sign out clears session.
- "Exit prototype" → `#`.

### Todo List
- [ ] Write `views/guardian.html` and `js/personas/guardian.js`
- [ ] Implement OTP sign-in flow with on-screen hint
- [ ] Wire guardian dashboard to store student record; implement stale warning
- [ ] Write `views/staff.html` and `js/personas/staff.js`
- [ ] Implement PIN sign-in, stall selection
- [ ] Implement all action buttons wired to store API
- [ ] Implement Undo toast
- [ ] Implement lookup and "Undo done"
- [ ] Implement keyboard shortcuts with focus guard
- [ ] Show written-comm card and guide notice from accessibility flags
- [ ] Verify neither persona links to any other persona

### Relevant Context
- Staff buttons are 64 px tap targets.
- Written-comm card and guide notice are sourced from the student's `accessibilityFlags`
  in the store; staff see them only at their own stall.

---

## Sub-Task 6 — Board Persona

**Status:** [ ] pending

### Intent
Build the `#board` persona: a 1920×1080 display screen scaled to fit any viewport,
showing one college at a time with live ticket numbers.

### Expected Outcomes
- 13 college screens; Previous/Next pager and dropdown navigator.
- Large layout (≤ 4 stalls): one row. Compact layout (5–8 stalls): two rows.
- Header: date, live clock, "Updated X s ago" indicator.
- Each stall card: code, full name, desk count, waiting count, now-serving number (gold,
  large mono), next three ticket numbers.
- Footer: QR code (generated by `qr.js`), English + Filipino help text.
- Board scales via `transform: scale()` from a fixed `1920×1080` root element so it is
  readable on any screen size.
- Stale indicator after 8 s without a tick.
- "Exit prototype" → `#` (accessible even at small scale).
- All 13 screens fit within 1080 px height with nothing clipped.

### Todo List
- [ ] Write `views/board.html` and `js/personas/board.js`
- [ ] Implement scale-to-fit transform; recalculate on window resize
- [ ] Build stall card component (large and compact variants)
- [ ] Build college pager (Previous/Next + dropdown)
- [ ] Wire live clock and date
- [ ] Wire stale indicator
- [ ] Integrate `qr.js` for footer QR
- [ ] Add bilingual footer help text strings to both string files
- [ ] Verify all 13 college screens at 1920×1080 (no clip)
- [ ] Verify scale-to-fit on 1280, 1024, 768, and 375 px wide viewports

### Relevant Context
- Board numbers: 120–160 px mono.
- Now-serving number on gold background.
- Four-digit zero-padded ticket numbers only — no names, no permits.

---

## Sub-Task 7 — QR, Accessibility, Build & Audit

**Status:** [ ] pending

### Intent
Finalize all cross-cutting concerns: QR generation, full accessibility pass, the
`build_single.py` single-file output, and the automated click audit.

### Expected Outcomes
- QR codes render ink-on-white with a 4-module quiet zone using `vendor/qrcode.js`.
- `aria-live` regions cover all dynamic status changes across all four personas.
- `speechSynthesis` "read my status" button works in Student persona.
- Vibration patterns: 2 pulses = next in line, 3 pulses = your turn.
- Text-size (100–200%) and high-contrast mode work across all personas.
- `prefers-reduced-motion` suppresses all hover-lift and press-settle animations.
- `tools/build_single.py` runs with `python tools/build_single.py`; produces `IsQolar.html`
  that opens by double-click with no network, no server.
- Automated click audit script (`tools/audit_clicks.js` or similar) reports pass/fail counts;
  target: 0 broken buttons or links across all screens.
- `IsQolar.html` produces zero console errors when opened from `file://`.
- README updated with final demo logins, placeholder list, and design-owner approval flags
  (gradients, gold bands, soft shadows go beyond the design file).

### Todo List
- [ ] Finalize `js/qr.js` wrapper; verify 4-module quiet zone
- [ ] Audit every interactive element for `aria-label` or visible label
- [ ] Add `aria-live="polite"` regions to all status update areas
- [ ] Test and fix `speechSynthesis` in Student Dashboard
- [ ] Test vibration API (guard behind feature detection)
- [ ] Verify `prefers-reduced-motion` suppression in `tokens.css`
- [ ] Complete `tools/build_single.py` — inline CSS, fonts (base64), vendor JS,
      data JSON, all module JS via esbuild, produce `IsQolar.html`
- [ ] Write `tools/audit_clicks.js` (Playwright or simple DOM walk); run and fix failures
- [ ] Open `IsQolar.html` from `file://`, confirm zero console errors
- [ ] Final README pass: demo logins, placeholder list, design-owner flags
- [ ] Tag repo / create zip

### Relevant Context
- `qrcode-generator` API: `qrcode(typeNumber, errorCorrectionLevel)` → `make()` → `createSvgTag()`.
- Quiet zone = 4 modules; enforce via SVG viewBox padding.
- Build script uses `npx esbuild` for JS bundling; CSS and fonts are inlined via Python
  `base64.b64encode`.

---

## Biggest Risk & Fallback

**Risk:** The Student persona (Sub-Tasks 4a + 4b) is the largest single surface. If the
bento grid, campus explorer, and curriculum explorer all land in one pass, the milestone
will likely slip and block the Staff and Board milestones.

**Fallback:** Sub-Tasks 4a and 4b are already split. If 4b runs long, deliver 4a (Join +
Dashboard) as a shippable checkpoint, start Sub-Tasks 5 and 6 in parallel, and fold 4b
in before M7. Board and build steps have no dependency on the Courses/Explore/Profile tabs.

---

## README Demo Logins (draft)

| Role | Credential | Value |
|------|-----------|-------|
| Student | Permit number | `2026-00123-MN-0` |
| Student | First name | `Juan` |
| Student | Course | `BSIT` |
| Guardian | OTP (shown on screen) | `482913` |
| Staff | PIN | `1234` |

## Placeholder List (items that need real content before launch)

- [ ] Woff2 font files (download from Google Fonts or licensed source)
- [ ] Campus illustration / hero image
- [ ] Course descriptions (Overview tab — sample text labelled)
- [ ] Subject/curriculum data per program (sample labelled)
- [ ] Walking guide photos or icons for Explore tab
- [ ] Real Filipino translations (all `strings.fil.js` values are drafts)
- [ ] Design-owner approval: gradients, gold stat bands, soft drop shadows exceed the design file spec
- [ ] QR destination URL (currently points to `#` landing)
- [ ] College of Law exclusion confirmed with Registrar
- [ ] Production stale thresholds (60 s student/staff/board; 3 min guardian) — currently 8 s / 15 s in prototype
