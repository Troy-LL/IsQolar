# IsQolar prototype: hand-off for Claude Code

Read this first. It tells you what exists, why it is built this way, what is unfinished, and how to work with the owner.

## 1. The project

- **IsQolar** (Iskolar ng Bayan + Q for queue): a web app for first-year, on-site enrollment at PUP Manila. Students get a ticket for their course stall, see a live line and wait, and see "You're fully enrolled". Staff run stalls with two taps. Guardians see progress only. A TV board shows who is being served.
- **Context:** ICS x IBM Bobathon, Polytechnic University of the Philippines, October 2026. Team: Troy (PM, full stack), Ayen (PM, front end), Donita (full stack, owns the design file), Viv (front end, the person you are talking to), Justin (back end).
- **Source docs** (the owner has them): `PRD.md` v0.3, `DESIGN-PUP-Enrollment-Queue.md`, `USER-JOURNEY-MAP.md`. The PRD wins on behavior, the design file wins on look, except the deliberate deviations in section 8.
- **Status:** a complete clickable prototype with simulated data and no backend. All of it works offline.

## 2. Working with the owner (Viv)

- Concise, copy-ready output. **No em dashes.**
- **Propose the file and folder structure before writing code** for anything new or large.
- Substance over visual complexity. When they attach reference images, refine toward them.
- They will critique with screenshots. Fix exactly what is pointed at, then check the same pattern elsewhere ("and every similar part").
- They care that buttons really work, that nothing is clipped or too close to edges, and that personas stay isolated.
- Answer as if talking to a student team member, plainly. Say honestly what is a placeholder.

## 3. What is delivered (all in the owner's outputs folder)

| File | What it is |
|---|---|
| `IsQolar-prototype.zip` | `IsQolar.html` (single file, double-click, offline), `source/`, `tools/build_single.py`, `README.md` |
| `HANDOFF.md` | this file |
| `tests/audit.py`, `tests/boardcheck.py` | Playwright checks, section 10 |
| `BOB-METAPROMPT.md` | prompts to rebuild the same prototype in IBM Bob (section 11) |
| `USER-JOURNEY-MAP.md` | the persona journey map the prototype follows |
| Published artifact | https://claude.ai/artifact/32YuRZdcinug15pgieKZmb (the single file) |

## 4. Architecture

Plain HTML, CSS and ES modules. No framework, no CDN, no build step for development. Runs from a local server (`python3 -m http.server`) or as the bundled single file.

```
source/
├─ index.html, app.js            landing page + hash router + floating pill nav
├─ student/ guardian/ staff/ board/   one entry page per persona (index.html each)
├─ js/store.js                   shared mock store and simulation. THE seam to swap for a real server
├─ js/views/                     home, student, guardian, stall (staff), board. Each exports mount(el, opts) and returns an unmount function
├─ js/i18n.js, strings.en.js, strings.fil.js   all UI text. t(), tEn(), tFil(), tp() (bilingual pair)
├─ js/ui.js                      header(), problem(), qrSvg(), esc(), fmtTime(), fmtDate(), stallLabel(), placeLabel(), bindLang()
├─ js/status-mark.js             six inline SVG status marks + statusWord()
├─ js/a11y.js                    per-device settings (text size, high contrast)
├─ js/courseinfo.js              requirements, sample curriculum, campus data
├─ js/colleges.js                GENERATED from data/colleges.json (13 colleges, 57 programs). Imported as a module so the single file needs no fetch
├─ css/                          tokens, components, gradient, screens, landing. Load order matters, landing.css LAST
├─ fonts/                        Atkinson Hyperlegible Next and Mono, Cinzel Bold (woff2, bundled)
└─ js/vendor/qrcode.js           qrcode-generator, UMD, loaded by a classic <script> before the module
tools/build_single.py            esbuild (npx) bundles app.js, inlines CSS, fonts as data URIs, QR lib
```

- **Routing:** hash routes `#home` (default), `#student`, `#guardian`, `#stall`, `#board`. `app.js` mounts one view at a time into `#stage`. Persona screens show only the logo and an "Exit prototype" button, so no persona can reach another.
- **View pattern:** each view keeps local state, renders with `innerHTML`, uses delegated event listeners, and skips re-render when a render signature is unchanged. It also skips re-render while an input has focus (so typing is never interrupted). Student renders into `[data-ui]` (`display: contents`) with a separate persistent `aria-live` element.
- **Single file:** `window.__PQ_DEMO = true` is set in the bundle so demo prefills and hints appear. Standalone pages use `?demo=1` for the same.

## 5. The store (`js/store.js`)

- Persisted in `localStorage` key `isqolar.v5` (bump the version whenever the seed shape changes). Cross-tab sync via `BroadcastChannel('isqolar')` plus the `storage` event. One shared clock: `store.start()` ticks every 2 seconds.
- **State:** `{ stalls, tickets, byPermit, byGuardian, counter, lastUndo, lastAction }`.
  - stall: `code, college, svc, interviewers, served, queue[], serving, held[], manual, nextAt, slotsTotal, slotsLeft`
  - ticket: `no, permit, name, stall, joinedAt, guardianCode, guardianPhone, otp, access{writing,guide}, done{step: ts}, calledAt, doneAt`
- **Exports (keep these stable):** `init, start, subscribe, tick, getColleges, stepOrder, isDemo, join, view, myTicketNo, leave, guardianCodeFor, guardianView, guardianRequest, guardianLogin, setAccess, setGuardianPhone, takeControl, staffView, staffCallNext, staffMarkDone, staffHold, staffRecall, undo, undoEnrolled, lookup, adminView, boardScreens, boardView, coursesView, exploreView, collegeView, estimate, mask, formatCode, ticketLabel, resetAll, toggleOffline, isOffline, GUARDIAN_STALE_MS`, plus prototype helpers `advance, callMe, markDone`.
- **Demo data:** Juan, permit `2026-00123-MN-0`, course BSIT, guardian code `JUAN47`, guardian mobile `09171234567`, fixed OTP `482913`. Staff PIN `1234`. Joining with Juan's permit returns his existing ticket.
- **Simulation rules (constants at the top of the file):**
  - 1 simulated minute = 1 real second (`SPEED = 60`). Each stall: 3 to 6 minutes per student per interviewer, 1 or 2 interviewers (35 percent have 2).
  - Wait = ahead x svc / interviewers, rounded to 5 minutes. Under 5 minutes shows "a few minutes". "Early estimate" until the stall has served 10.
  - Arrivals: each tick, if `queue.length < 12`, 30 percent chance of a new ticket. A stall a staff member signed into (`manual`) is not auto-served. A called real student nobody serves is auto-finished after 15 seconds.
  - Ticket numbers are four digits, wrap at 9999, and skip numbers of real tickets (`nextNo()`).
  - Slots: total 40 to 80, `slotsLeft = min(total - 4, 18 + rand 35)`, drops by 1 every 15 served (floor 2), real "mark done" drops by 1. **Clamp slots to total everywhere, including bars.**
  - New simulated day when total served passes 92 percent of `EXPECTED_TOTAL = 3600`: reset served counts and slots, keep queues.
  - Stale after 8 seconds in demo (60 in production). Guardian 15 seconds (3 minutes in production). `toggleOffline()` freezes updates in memory.

## 6. Personas and screens

- **Landing:** floating pill nav (Features, How it works, Live count, Preview, FAQs, "Try the prototype"), hero with inline icon chip and illustration (live "Now serving" cards), 3 feature cards with mini UIs, 6 benefit tiles, 4 step cards, live count widget (course select plus slots gauge), persona picker (Student, Guardian, Staff, Now serving board), prototype tools (reset the simulated morning, simulate network loss), maroon banner, 8 FAQs, footer. Layout was modeled on an "Apptics" landing page the owner supplied, recolored to PUP maroon and gold.
- **Student** (phone, one column max 480px, bottom nav Dashboard, Courses, Explore, Profile):
  - Join: permit, first name, course, optional guardian mobile. Inline errors.
  - Dashboard: ticket with live line and QR, Show to staff, Read my status, Updates panel (slots), enrollment steps checklist, requirements checklist (sample), call banner (gold, sticky, vibration, tab title), on-hold, green enrolled card.
  - Courses: hero title, "Your course" dark tile, shortest and longest tiles, college dropdown, search, bento grid of square tiles (busiest per college is wide). Detail: gold stats band, tabbed dark panel (Overview 2x2 cards, Subjects curriculum explorer with Year 1 to 4).
  - Explore: campus guide (Mabini Campus, NDC Compound, M.H. del Pilar Campus) with tappable college tiles that open a widget (courses, slots, lines, where to go), longest lines, enrollees panel with a three-part progress bar.
  - Profile: language, text size 100 to 200 percent, high contrast, "prefer written communication", "need a guide", guardian mobile, use a different ticket.
- **Guardian:** permit number, then 6-digit OTP (the code is shown on screen as a prototype hint), then Updates (slots), child status, steps, last updated with stale warning. Never shows ticket number, QR, permit or wait.
- **Staff:** PIN sign-in with stall pick, then Call next, Mark done, Hold, Recall, Undo toast (persists), lookup by permit or ticket (with "Undo done"), line overview, held list, text cards (full-screen) and guide notice from the student's flags, sign out. Keys N, D, H, U (off while typing).
- **Board:** 1920x1080 canvas scaled with `transform: scale(width/1920)`. One screen per college (13), pager plus dropdown outside the canvas. Four stalls or fewer: large cards. Five to eight: compact two-row layout. Header with date, clock, updated indicator. Footer with QR and English plus Filipino help text.
- The **coordinator/admin** persona and the "all three side by side" view were **removed on request**. `store.adminView()` stays because Explore uses it.

## 7. Design system

- **Tokens:** maroon `#880000`, maroon-deep `#5C0000`, gold `#FFCC00`, green `#1B6E3F`, ink `#1F1A1A`, ink-soft `#5E5656`, line `#E2DCD8`, paper `#FFFFFF`, shell `#F7F4F2`. Gradients only from these (one lighter and one deeper stop).
- **Type:** Atkinson Hyperlegible Next (text), Atkinson Hyperlegible Mono (numbers), Cinzel Bold (the letters "PUP" only). 14px floor. Tap targets 48px (staff 64px).
- **Status = mark + word + color.** No red. Problems are ink text with a triangle mark and a next step.
- **CSS layers:** `tokens.css` (design file Appendix A), `components.css` (flat base), `gradient.css` (the current skin), `screens.css` (guardian, staff, bento, campus, enrollees), `landing.css` (landing, shell, board v2, spacing fixes, selects). Later files intentionally override earlier ones. The neumorphism skin was tried and dropped.
- **Interaction:** hover lifts with a larger drop shadow, press settles back, `prefers-reduced-motion` disables transforms. High-contrast mode (`.pq-hc`) removes gradients and thickens borders.

## 8. Deliberate deviations and honest placeholders

- **Deviation:** gradients, gold bands, soft shadows go beyond the design file (which bans them). Needs Donita's approval. Also the student now has a bottom navigation although the design file says one page, no tabs.
- **Placeholders to replace before a pilot:** requirements list, course descriptions, sample curriculum (sample GE subjects; year 4 empty, major subjects belong to departments), campus map (schematic, not to scale), Filipino strings (drafts, need a native speaker).
- **Sourced facts:** colleges and programs from pup.edu.ph/academic/colleges (College of Law excluded, JD only). Campus facts from pup.edu.ph: Mabini Campus is the main campus (Pylon and Mural gate, Main Academic Building, Freedom Plaza, Ninoy Aquino Library, gym, Grandstand and Oval, Obelisk), NDC Compound holds Architecture and Fine Arts, Engineering and Communication, M.H. del Pilar Campus holds Tourism, Hospitality and Transportation Management. Which Mabini building holds each other college is not published, so it shows "to be confirmed".
- **Not built:** camera ticket scan, printable ticket (PRD T1), guardian outbound sync (PRD G2), real SMS, real backend, the coordinator persona, a real venue map. Open PRD questions Q1 to Q3 (slot exhaustion, check-in identifier, interview step) are unresolved.

## 9. Gotchas learned (do not re-break these)

- **Footer ghost text** (`.lp-ghost`) once covered footer links. It is `pointer-events: none` now.
- **Board columns:** use `grid-template-columns: minmax(0, 1fr)` or long content makes the track wider than the card. Board row heights are budgeted to fit 1080: any added height must be taken from somewhere.
- **Bento tiles:** `aspect-ratio` plus `overflow: hidden` clipped content on narrow phones. Tiles use a `min-height` formula and `overflow: visible`.
- **Slots:** data once allowed left greater than total, which broke progress bars. Clamp.
- **Flex stretch:** `.pq-view` is `min-height: 100vh` column flex, so grids like `.pq-join` need `align-content: start`.
- **Specificity:** `landing.css` loads last, so overrides like `.lp-navwrap.lp-navwrap--static` need a doubled selector to beat earlier `.lp-navwrap`.
- **Sticky nav vs banner:** on persona screens the pill nav is static so it cannot cover the gold call banner.
- **Uppercase CSS:** `inner_text` in Playwright returns uppercase for `text-transform: uppercase` titles. Compare case-insensitively.
- **Sim timing:** with the 60x clock the demo student is called in about a minute. Tests that need a fresh student should have staff sign in (which pauses auto-serving) first.
- **Artifact iframe:** hash routes may not pass through the claude.ai artifact URL. Downloads are inert there, so the CSV export was dropped.

## 10. Testing

- `tests/audit.py` (Playwright, Python): clicks every button and link on every screen, about 104 checks, prints passes, failures and console errors. `tests/boardcheck.py` opens all 13 board screens and fails if anything leaves its card or the canvas passes 1080 pixels.
- Run: `pip install playwright && playwright install chromium`, then `IQ_URL=file:///abs/path/IsQolar.html python3 tests/audit.py`. By default it looks for `../IsQolar.html`.
- Also verify by hand: text never touches tile edges at 320, 360, 390 and 430 pixel widths (a check script for this pattern exists in the conversation history, easy to recreate).
- Hooks used by tests: `data-join`, `data-tab`, `data-course`, `data-ctab`, `data-year`, `data-explore-college`, `data-college`, `data-flag`, `data-textsize`, `data-langset`, `data-lang`, `data-showfull`, `data-act` (next, done, hold, undo), `data-recall`, `data-reopen`, `data-card`, `data-signin`, `data-permit`, `data-otp`, `data-step`, `data-screen`, `data-go`, `data-jump`, `data-tool`.

## 11. Parallel track: rebuilding in IBM Bob

The owner is also rebuilding this in IBM Bob for the hackathon ("how we used Bob" evidence), using `BOB-METAPROMPT.md` (master prompt in Plan mode, then milestones M1 to M7 in Agent mode, one chat each).

- Bob has written `isqolar-plan.md`. Three clarifying answers were given and baked in: "Exit prototype" goes to the `#home` hash route with no reload, the board scales with `transform: scale()`, and `build_single.py` is finalized only in M7 (M1 to M6 tested from a local server).
- Adjustments requested: keep M1 to M7 numbering, freeze the public API of `store.js` after M1, run milestones one at a time, commit and add one line to `docs/CHANGELOG.md` after each.
- **Open issue:** Bob's workspace was empty, so it planned from the prompt alone. The owner is creating `C:\Users\edgon\isqolar` with `docs/` (the three source docs), copying `isqolar-plan.md` in, opening that folder in Bob, and asking Bob to reconcile the plan with the docs before moving to Agent mode.
- If you help with Bob output, review it against sections 5 to 9.

## 12. Suggested next steps

1. Confirm with the team: gradient look, bottom navigation, and the placeholder content.
2. PRD v0.4 update from the journey map (new student sections, OTP guardian sign-in, staff PIN, accessibility, campus guide).
3. Printable ticket (80mm and A6 layouts, ink only) and camera or handheld ticket scan on the staff screen.
4. Replace `store.js` internals with a small real server (same exported API) so the demo works across devices on the venue network.
5. Native-speaker pass on Filipino strings and the sample content.
6. Rehearse the live demo: join as Juan, staff Call next, guardian watches, board updates, then network loss to show the stale state.
