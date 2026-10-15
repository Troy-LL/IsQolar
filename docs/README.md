# IsQolar — Clickable Prototype

**IsQolar** (Iskolar ng Bayan + Queue): live queue management for first-year, on-site
enrollment at PUP Manila. Students get a ticket for their course stall, see a live line
and wait time, and receive a clear "You're fully enrolled" at the end. Staff run stalls
with two taps. Guardians see progress only. A TV board shows who is being served.

Context: ICS x IBM Bobathon, PUP Manila, October 2026.
Team: Troy (PM, full stack), Ayen (PM, front end), Donita (full stack, design),
Viv (front end), Justin (back end).

---

## Running the prototype

```
python3 -m http.server 8080
# then open http://localhost:8080/
```

No install, no build step for development. ES modules require a server (not file://).
The single-file build (`IsQolar.html`, double-click, offline) is produced in M7 by
`python tools/build_single.py`.

---

## Demo logins

| Role | Credential | Value |
|------|-----------|-------|
| Student | Permit number | `2026-00123-MN-0` |
| Student | First name | `Juan` |
| Student | Course | `BSIT` |
| Guardian | Guardian code | `JUAN47` |
| Guardian | Guardian mobile | `09171234567` |
| Staff | PIN | `1234` |

---

## File structure

```
index.html              entry point + hash router shell
app.js                  hash router, store init, a11y init
js/
  store.js              shared mock store — THE seam to swap for a real server
  i18n.js               t(), tEn(), tFil(), tp(), setLang()
  strings.en.js         all English UI strings
  strings.fil.js        all Filipino UI strings (DRAFTS — need native-speaker check)
  colleges.js           generated from data/colleges.json
  ui.js                 header(), problem(), qrSvg(), esc(), fmtTime(), fmtDate()
  status-mark.js        six inline SVG status marks
  a11y.js               text size, high contrast
  courseinfo.js         sample requirements and curriculum
  views/
    home.js             landing page (M3)
    student.js          student persona (M4a, M4b)
    guardian.js         guardian persona (M5)
    stall.js            staff persona (M5)
    board.js            board persona (M6)
  vendor/
    qrcode.js           qrcode-generator UMD
css/
  tokens.css            design tokens (colors, type, spacing, motion)
  components.css        flat base styles
  gradient.css          gradient skin (beyond design file — needs Donita approval)
  screens.css           ticket, board, bento, campus components
  landing.css           landing page (load LAST)
data/
  colleges.json         13 colleges, 57 programs (placeholder — confirm with Registrar)
fonts/                  bundled woff2 files (stubs until M7 — see Placeholder list)
tests/
  audit.py              Playwright click audit (M7)
  boardcheck.py         Playwright board overflow check (M7)
tools/
  build_single.py       single-file bundler (M7)
```

---

## Store API (frozen after M1)

`init, start, subscribe, tick, getColleges, stepOrder, isDemo, join, view, myTicketNo,
leave, guardianCodeFor, guardianView, guardianRequest, guardianLogin, setAccess,
setGuardianPhone, takeControl, staffView, staffCallNext, staffMarkDone, staffHold,
staffRecall, undo, undoEnrolled, lookup, adminView, boardScreens, boardView,
coursesView, exploreView, collegeView, estimate, mask, formatCode, ticketLabel,
resetAll, toggleOffline, isOffline, GUARDIAN_STALE_MS`

Plus prototype helpers: `advance, callMe, markDone`.

Storage key: `isqolar.v5`. Do not add exports after M1.

---

## Enrollment steps (source of truth)

Read from `store.stepOrder` at runtime. Never hardcoded in screens.

| Step | Station | What happens |
|---|---|---|
| 1 | Admission | Submit admission documents and entrance credentials |
| 2 | College / Department | Student picks course, joins that course line; interview and program tagging |
| 3 | Medical Services | Submit chest X-ray and Health Information Form |
| 4 | Registration Card | Printing of the Registration Card |
| 5 | ID Card | ID issuance, last official step |

---

## Placeholder list

Items to replace before a pilot:

- [ ] woff2 font files (stubs in place). Download from Fontsource 5.3.0:
  - `@fontsource/atkinson-hyperlegible-next` (Regular 400, Bold 700)
  - `@fontsource/atkinson-hyperlegible-mono` (Regular 400, Bold 700)
  - `@fontsource/cinzel` (Bold 700)
- [ ] Real colleges and courses list from the PUP Registrar
  (`data/colleges.json` is sourced from pup.edu.ph/academic/colleges, Law excluded)
- [ ] iTech diploma programs: confirm which first-year programs belong in the 57
- [ ] Course descriptions (Overview tab — sample text labelled)
- [ ] Subject/curriculum data per program (sample labelled, year 3-4 empty)
- [ ] Walking guide photos or icons for Explore tab
- [ ] PUP Gym exits list (markdown file to be provided — journey map open question 12)
- [ ] Real Filipino translations (all `strings.fil.js` values are drafts — native-speaker check)
- [ ] Design-owner approval (Donita): gradients, gold stat bands, soft drop shadows exceed
  the design file spec. Also: bottom navigation vs. one-page design.
- [ ] QR destination URL (currently points to `#home` landing)
- [ ] College of Law exclusion confirmed with Registrar
- [ ] Production stale thresholds (60 s student/staff/board; 3 min guardian)
  -- currently 8 s / 15 s in prototype
- [ ] Vibration pattern confirmed (design file: 200ms, 100ms, 200ms)
- [ ] PUP name, colours and seal: university approval needed for the pilot (design file D4)

---

## Next (not in this prototype — visible to judges)

The journey map (`USER-JOURNEY-MAP.md` section 8) describes a more complete model that
this prototype does not yet build:

- One queue per enrollment step (instead of one stall per course)
- Course chosen after Step 1, before joining the Step 2 line
- Skip action (replaces Hold and Recall): first Skip sends to back of line, second cancels;
  Restore and Remove actions
- Venue code required at join to prevent ghost tickets
- Accept action at the next step (safeguard if staff forgot Mark done)
- Stuck-ticket reminder after 15 minutes being served
- Line order by queue-entry time per step, not by ticket number
- Place in line per step on the phone; next three numbers per step on the projector
- Confirmed course recorded at Step 2; slots decrement only on Mark done at Step 2
- Change course action for staff at Step 2

---

## Design notes

- Tokens: maroon `#880000`, gold `#FFCC00`, green `#1B6E3F`, ink `#1F1A1A`.
  Full token set in `css/tokens.css`.
- Type: Atkinson Hyperlegible Next (text), Atkinson Hyperlegible Mono (numbers),
  Cinzel Bold (the letters "PUP" only). 14px floor.
- Status = mark + word + color. No red. Problems are ink + triangle mark + next step.
- CSS load order is intentional: `landing.css` loads last and overrides earlier layers.
- Board: `transform: scale(width/1920)` from a fixed 1920x1080 canvas.
  Columns use `minmax(0, 1fr)`. Row heights budgeted to 1080.
- Bento tiles: `min-height` formula + `overflow: visible` (not `aspect-ratio + overflow: hidden`,
  which clips content on narrow phones).
- Slots: always clamped to total everywhere, including progress bars.
- Staff screen pill nav is static (not sticky) so it cannot cover the gold call banner.

---

## Testing (M7)

```bash
pip install playwright && playwright install chromium
IQ_URL=file:///abs/path/IsQolar.html python3 tests/audit.py
```

`data-*` hooks used by tests (do not rename):
`data-join, data-tab, data-course, data-ctab, data-year, data-explore-college,
data-college, data-flag, data-textsize, data-langset, data-lang, data-showfull,
data-act, data-recall, data-reopen, data-card, data-signin, data-permit, data-otp,
data-step, data-screen, data-go, data-jump, data-tool`
