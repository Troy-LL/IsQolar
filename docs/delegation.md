# Delegation

This is the run list for the night of Oct 15 and the morning of Oct 16. Base is main after PR 12 (docs: one product, Room TBA as 2D floor plans). Branch for this doc: troy/delegation-v2.

Clocks: tonight each person pushes a PR before sleeping. Oct 16: 11:00 AM full dry run, 12:30 PM code freeze (also the Room TBA cut), 2:00 PM submit.

The team is still in planning. No teammate feature PR is open. That is not a delay.

Queue owners stay as in the 4:19 PM note and docs/plan.md. RT owners that differ are listed under conflicts. Paste one Bob prompt per task. One task per PR.

## Already on main

- T1b, F0, T3, T2 merged. GET /health exists in src/server.ts and returns {"ok":true}. render.yaml has healthCheckPath /health and SEED=1. The Render Blueprint is not connected. Public /health is still 404. Seed is 5 tickets and 3 stalls (BSCS-1, BSIT-1, BSEE-1). public/map.html, public/admin.html, and public/guardian.html do not exist. data/floors.json does not exist.

## Conflicts to know

- docs/plan.md uses these same clocks: tonight, 11:00 dry run, 12:30 freeze, 2:00 submit. R1 and K1 are not start-now tasks. K2 is not the freeze.
- D3 is tonight after D1. POST /api/tickets/:id/undo already exists. Lookup matches the printed code on GET /api/stalls/:stall/queue.
- J1 target is about 40 tickets. src/store.ts and docs/product.md still have 5.
- RT1 owner is Troy, taken from Viv (it had been Viv, not Donita). RT2 owner is Troy, not Justin. RT6 owner is Ayen, not Justin. Reason: those files do not touch that person's queue files, and Justin and Donita already own the staff, seed, and ticket work.
- RT3, RT4, RT5, RT7, and RT8 start tomorrow morning. plan-room-tba.md originally marked RT1 through RT8 as tonight. They wait on earlier PRs.
- RT8 also waits on A4, because the enrolled screen is A4, which plan.md schedules tomorrow.
- Only Troy may edit src/contract.ts. L2 is on main. UJ1 is the next edit, and it adds Skip only. G1 and H2 waited for L2. UJ2 waits for UJ1.
- The phone rail uses five step names on the existing stations. Server order stays checkin, docs, validation, main, stall, enrolled. docs is shown as Step 1. Only stall shows place in line and wait. See docs/user-journey.md.
- O2 is the public URL in README.md. J3 owns the printed ticket.
- AdminSummary.byStation is the only admin aggregate in the contract. V2 derives the slowest stall from GET /api/stalls queueLength.
- GuardianStatus exists. GET /api/guardian/:code does not.
- UP1 is the health pinger. The app must not make the outbound call. A scheduled GitHub Actions GET of the public /health is the pinger, and only after T4 has a real URL.
- src/server.ts serves public/ only. RT3 may add a static mount for data/ so the map can fetch JSON. That mount must not change ticket or stall routes.
- Library 3F: docs/floorplans/library-3F.png exists and docs/floorplans/rooms.json has 30 rows with source library-3F.png, building Library (NALRC), floor 3F. catalog.md now lists that image as present. It is not a tonight floor.

## Load after this split

| Person | Tonight | Tomorrow AM |
| --- | --- | --- |
| Troy | T4, RT1, RT2 | L2 (done), UJ1, UJ2, W3, W5, O1, O2, UP1, RT7, X2, RT12, S4, and R2 at 11:00 |
| Donita | H0, D1, D3 | D2, UJ4, UJ3, H1, H2, W1, W2, X1, S5 |
| Justin | J1, P0, J2 | RT5, G1, UJ5, J3 |
| Ayen | A1, RT6 | A4, UJ6, UJ7, UJ8, A3, RT8, UJ9, A2, A5, S1 |
| Viv | V1 | RT3, RT4, UJ10, V3, V2, S2 |

Viv's tomorrow order is RT3, RT4, V3, V2. Justin's long task tomorrow is RT5 (27 + 39 + 76 labels).

# Troy

Already merged, do not redo: T1b (seed fix PR), F0 (public/board.html, public/staff.html, public/phone.html, public/poll.js shells), T3 (Store interface in src/store.ts), and T2 (ADR 005 and ADR 006). Troy also merges other people's PRs, and there is no separate branch for merges.

## Tonight

### T4. Connect Render
- Goal: Connect the Render Blueprint and deploy main so the public /health is not 404.
- Files: render.yaml (already has healthCheckPath /health, SEED=1, autoDeploy true, service name isqolar). README.md only after a real URL exists.
- Depends on: T3, which is done.
- Done when: The deployed URL's GET /health returns {"ok":true}. Local src/server.ts already has GET /health. No doc contains a live onrender.com URL. Do not invent one.
- Branch: `troy/t4-render`

```
Task T4. Connect Render.

Goal: Connect the Render Blueprint and deploy main so the public /health is not 404.

Files: render.yaml already has healthCheckPath /health, SEED=1, autoDeploy true, and the service name isqolar. Touch README.md only after a real URL exists.

Depends on: T3, which is done.

Branch from a fresh main: troy/t4-render.

Read docs/delegation.md for this task id.

Troy connects the Blueprint in the Render dashboard. Do not call the Render API. Do not guess a hostname. Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Local src/server.ts already has GET /health. If the live URL is not known, stop after checking render.yaml. Do not open a pull request that only guesses a URL. No doc contains a live onrender.com URL. Do not invent one.

Done when: The deployed URL's GET /health returns {"ok":true}.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT1. Clean floor images
- Goal: public/maps/ has the three tonight floors.
- Files: docs/floorplans/IBM_7739.JPG, docs/floorplans/IBM_7741.JPG, docs/floorplans/IBM_7742.JPG, public/maps/, scripts/clean-floorplan.py, docs/floorplans/cleaning.md
- Depends on: none
- Done when: public/maps/ has a cleaned lobby image from IBM_7739, a straightened and cropped Main 4F image from IBM_7741, and a Main 5F image from IBM_7742.
- Branch: `troy/rt1-clean-images`
- Owner: Troy, taken from Viv.

```
Branch from a fresh main using `troy/rt1-clean-images`.
Read docs/delegation.md for RT1.
public/maps/ does not exist yet. Copy from docs/floorplans/IBM_7739.JPG, IBM_7741.JPG, and IBM_7742.JPG into public/maps/. Deliver a cleaned lobby image from IBM_7739, a straightened and cropped Main 4F image from IBM_7741, and a Main 5F image from IBM_7742. Do not add IBM_7721, IBM_7734, IBM_7740, IBM_7726, or library-3F.png. Do not flip IBM_7741. Do not invent coordinates.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Troy took this task from Viv.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT2. Write the floors file
- Goal: data/floors.json lists the three tonight floors.
- Files: data/floors.json (does not exist yet). Image paths point at public/maps/ files from RT1. Copy building and floor text from docs/floorplans/rooms.json.
- Depends on: RT1
- Done when: The file has three rows (IBM_7739 lobby, IBM_7741 Main 4F, IBM_7742 Main 5F) with id, building, floor, label, image, approximate. The lobby row has approximate true. No IBM_7721, no library-3F.png, no IBM_7734.
- Branch: `troy/rt2-floors-json`

```
Task RT2. Write the floors file.

Goal: data/floors.json lists the three tonight floors.

Files: data/floors.json (does not exist yet). Image paths point at public/maps/ files from RT1. Copy building and floor text from docs/floorplans/rooms.json.

Depends on: RT1.

Branch from a fresh main: troy/rt2-floors-json.

Read docs/delegation.md for this task id.

Read docs/plan-room-tba.md RT2 and docs/map-data-guide.md. Do not invent a floor. Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: The file has three rows (IBM_7739 lobby, IBM_7741 Main 4F, IBM_7742 Main 5F) with id, building, floor, label, image, approximate. The lobby row has approximate true. No IBM_7721, no library-3F.png, no IBM_7734.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## Tomorrow AM

### L2. Contract additions
- Goal: Freeze the guardian route, source, and staff-queue sync fields into the contract.
- Files: src/contract.ts only. GuardianStatus already exists and is marked not implemented. There is no GET /api/guardian/:code comment yet. Ticket has no source field.
- Depends on: none. Do this first tomorrow. The file has been frozen since 11:15 on Oct 15. Only Troy may edit it. Tell the team in the PR.
- Done when: The contract documents GET /api/guardian/:code returning the existing GuardianStatus, a source field whose values are hub or online, and the sync fields this PR names for the offline staff queue. No other contract edits.
- Branch: `troy/l2-contract`

```
Task L2. Contract additions.

Goal: Freeze the guardian route, source, and staff-queue sync fields into the contract.

Files: src/contract.ts only. GuardianStatus already exists and is marked not implemented. There is no GET /api/guardian/:code comment yet. Ticket has no source field.

Depends on: none. Do this first tomorrow. The file has been frozen since 11:15 on Oct 15. Only Troy may edit it. Tell the team in the PR.

Branch from a fresh main: troy/l2-contract.

Read docs/delegation.md for this task id.

You may edit src/contract.ts. Do not change src/server.ts or queue behavior. Do not invent rooms, aliases, student names, or a Render hostname.

Done when: The contract documents GET /api/guardian/:code returning the existing GuardianStatus, a source field whose values are hub or online, and the sync fields this PR names for the offline staff queue. No other contract edits.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### W3. Check-in page
- Goal: A check-in form creates a ticket and opens the phone page.
- Files: public/checkin.html (new), src/static.test.ts
- Depends on: none. POST /api/tickets and GET /api/stalls already exist.
- Done when: public/checkin.html has a name and course form that POSTs /api/tickets using CreateTicketBody. On 201 it redirects to /phone.html?id=<id>. On 400 it shows the error text. Courses come from GET /api/stalls, never a hardcoded list. src/static.test.ts has a case that the page is served.
- Branch: `troy/w3-checkin`

```
Task W3. Check-in page.

Goal: A check-in form creates a ticket and opens the phone page.

Files: public/checkin.html (new), src/static.test.ts.

Depends on: none. POST /api/tickets and GET /api/stalls already exist.

Branch from a fresh main: troy/w3-checkin.

Read docs/delegation.md for this task id.

Create public/checkin.html with a name and course form that POSTs /api/tickets using CreateTicketBody (src/contract.ts:122). On 201, redirect to /phone.html?id=<id>; on 400, show the error text. Courses come from GET /api/stalls, never a hardcoded list. Add a src/static.test.ts case that the page is served.

Do not edit src/contract.ts. Do not invent rooms, aliases, student names, or a Render hostname.

Done when: the form posts CreateTicketBody, redirects on 201, shows the 400 error text, loads courses from GET /api/stalls, and the static test covers the page.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```


### W5. Queue polish
- Goal: Warn before a second Skip cancels, fix the Find button at 390px, theme check-in, and drop em dashes from seed stall names.
- Files: public/staff.js, public/staff.html, public/checkin.html, src/store.ts, matching stall-name strings in tests, docs/delegation.md
- Depends on: W2, W3.
- Done when: Skip confirms before cancelling a ticket that already has skippedAt. Find does not overflow at 390px width. checkin.html uses maroon #8B0000 and gold #FFC72C. Seed stall names use a plain hyphen separator. This task is listed here.
- Branch: `troy/w5-queue-polish`

```
Task W5. Queue polish.

Goal: Warn before a second Skip cancels, fix the Find button at 390px, theme check-in, and drop em dashes from seed stall names.

Files: public/staff.js, public/staff.html, public/checkin.html, src/store.ts, matching stall-name strings in tests, docs/delegation.md.

Depends on: W2, W3.

Branch from troy/w2-staff-skip (or main after W2 and W3 merge): troy/w5-queue-polish.

Read docs/delegation.md for this task id.

In public/staff.js, warn before a second Skip cancels a ticket (server cancels when skippedAt is already set). Fix the Find button overflowing about 1px at 390px width. Theme public/checkin.html in maroon #8B0000 and gold #FFC72C. Replace em dashes in seed stall names with a plain hyphen. Add W5 to docs/delegation.md.

Do not edit src/contract.ts. Do not touch map files. No em dashes. No UPLB. No bob log. No AI trailers.

Done when: the confirm runs on a second Skip, Find fits at 390px, check-in is themed, seed names use hyphens, and this task is listed.

When the done-when line is true, run npm run check. Open a pull request into main with screenshots at 1280x800 and 390x844 in the PR body. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### O1. Wake before demos
- Goal: The free Render instance is woken before a demo.
- Files: README.md, render.yaml (health and SEED=1 are already set). ADR 005 says the free instance sleeps after about 15 minutes.
- Depends on: T4
- Done when: README says to open the public URL before a demo, and that URL is the one T4 recorded. No new service. The Express app still makes no outbound call.
- Branch: `troy/o1-wake-note`

```
Task O1. Wake before demos.

Goal: The free Render instance is woken before a demo.

Files: README.md, render.yaml (health and SEED=1 are already set). ADR 005 says the free instance sleeps after about 15 minutes.

Depends on: T4.

Branch from a fresh main: troy/o1-wake-note.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname. Use only the public URL T4 recorded.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: README says to open the public URL before a demo, and that URL is the one T4 recorded. No new service. The Express app still makes no outbound call.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### O2. Public URL in README
- Goal: The Render URL from T4 is written in README. autoDeploy is already true in render.yaml.
- Files: README.md only. Do not edit the printed ticket (that is J3).
- Depends on: O1
- Done when: README contains the real public URL from T4 and no guessed host.
- Branch: `troy/o2-public-url`

```
Task O2. Public URL in README.

Goal: The Render URL from T4 is written in README. autoDeploy is already true in render.yaml.

Files: README.md only. Do not edit the printed ticket (that is J3).

Depends on: O1.

Branch from a fresh main: troy/o2-public-url.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname. Write only the real public URL from T4. No guessed host.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: README contains the real public URL from T4 and no guessed host.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### UP1. Health pinger
- Goal: Once Render is live, an external schedule GETs /health so the free instance stays awake. This id is not in plan.md. It comes from the 4:19 PM note.
- Files: a new workflow under .github/workflows/. Do not edit .github/workflows/ci.yml (job name check).
- Depends on: T4
- Done when: The workflow GETs the real public /health on a schedule. src/server.ts does not gain an outbound fetch. ADR 001 and ADR 005 still hold. If T4 has no URL, do not open this PR.
- Branch: `troy/up1-health-ping`

```
Task UP1. Health pinger.

Goal: Once Render is live, an external schedule GETs /health so the free instance stays awake. This id is not in plan.md. It comes from the 4:19 PM note.

Files: a new workflow under .github/workflows/. Do not edit .github/workflows/ci.yml (job name check).

Depends on: T4.

Branch from a fresh main: troy/up1-health-ping.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname. If T4 has no URL, do not open this PR.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: The workflow GETs the real public /health on a schedule. src/server.ts does not gain an outbound fetch. ADR 001 and ADR 005 still hold.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT7. Map check
- Goal: npm run check fails on bad map data.
- Files: a check script wired into npm run check. Reads data/floors.json, data/locations.json, and public/maps/.
- Depends on: RT2, RT5
- Done when: check fails on a duplicate id, an unknown floorId, an x or y outside 0..1, an unknown kind, or a missing image file. It prints the count of verified false rows and the count of labels that contain ?. Known kinds: room, office, cr, stairs, exit, elevator, assembly, other.
- Branch: `troy/rt7-map-check`

```
Task RT7. Map check.

Goal: npm run check fails on bad map data.

Files: a check script wired into npm run check. Reads data/floors.json, data/locations.json, and public/maps/.

Depends on: RT2, RT5.

Branch from a fresh main: troy/rt7-map-check.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: check fails on a duplicate id, an unknown floorId, an x or y outside 0..1, an unknown kind, or a missing image file. It prints the count of verified false rows and the count of labels that contain ?. Known kinds: room, office, cr, stairs, exit, elevator, assembly, other.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### X2. Online guardian test
- Goal: A guardian phone on mobile data opens the Render URL.
- Files: none unless a bug fix is required.
- Depends on: O2, G1
- Done when: GET the public guardian URL for a seeded ticket code returns the guardian payload. Record the result. Do not invent the URL.
- Branch: `troy/x2-online-test`

```
Task X2. Online guardian test.

Goal: A guardian phone on mobile data opens the Render URL.

Files: none unless a bug fix is required.

Depends on: O2, G1.

Branch from a fresh main: troy/x2-online-test.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname. Do not invent the URL. Use a seeded ticket code that already exists.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: GET the public guardian URL for a seeded ticket code returns the guardian payload. Record the result.

Open a pull request only if a fix was required. When the done-when line is true, run npm run check. Open a pull request into main only if a fix was required. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT12. Map cut
- Goal: At 12:30 PM on Oct 16, keep the map only if RT1 through RT8 are merged and a search on a tonight floor lands on a pin.
- Files: public/map.html, public/map.js, public/maps/, data/floors.json, data/locations.json, data/station-locations.json, and the Find your classes link on public/phone.html, and only if removing the map.
- Depends on: RT8
- Done when: Either the search lands on a pin and the link stays, or the map link and map files are removed and queue behavior is unchanged.
- Branch: `troy/rt12-map-cut`

```
Task RT12. Map cut.

Goal: At 12:30 PM on Oct 16, keep the map only if RT1 through RT8 are merged and a search on a tonight floor lands on a pin.

Files: public/map.html, public/map.js, public/maps/, data/floors.json, data/locations.json, data/station-locations.json, and the Find your classes link on public/phone.html, and only if removing the map.

Depends on: RT8.

Branch from a fresh main: troy/rt12-map-cut. Branch only when removing the map.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: Either the search lands on a pin and the link stays, or the map link and map files are removed and queue behavior is unchanged.

When the done-when line is true, run npm run check. Open a pull request into main only if you removed the map. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### S4. Submit
- Goal: Final merge and submission at 2:00 PM on Oct 16.
- Files: none unless a last fix is required. Tag v1.0 when the team submits.
- Depends on: the 12:30 freeze
- Done when: main is what the team submits at 2:00 PM.
- Branch: `troy/s4-submit`

```
Task S4. Submit.

Goal: Final merge and submission at 2:00 PM on Oct 16.

Files: none unless a last fix is required. Tag v1.0 when the team submits.

Depends on: the 12:30 freeze.

Do not start before 12:30.

Branch from a fresh main: troy/s4-submit.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: main is what the team submits at 2:00 PM.

Open a pull request only if a fix was required. When the done-when line is true, run npm run check. Open a pull request into main only if a fix was required. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### R2. Full dry run
- Goal: The 11:00 AM Oct 16 dry run of the queue loop. Owner is everyone. Troy runs the clock.
- Files: none unless a fix falls out.
- Depends on: W1, A2
- Done when: Staff Call next on the hub LAN updates the phone banner within 2 seconds and the board now-serving line.
- Branch: `troy/r2-dry-run`

```
Task R2. Full dry run.

Goal: The 11:00 AM Oct 16 dry run of the queue loop. Owner is everyone. Troy runs the clock.

Files: none unless a fix falls out.

Depends on: W1, A2.

Branch from a fresh main: troy/r2-dry-run.

Read docs/delegation.md for this task id.

Do not invent rooms, aliases, student names, or a Render hostname.

Do not edit src/contract.ts. Do not change queue logic except where this task says so.

Done when: Staff Call next on the hub LAN updates the phone banner within 2 seconds and the board now-serving line.

Open a pull request only if a fix was required. When the done-when line is true, run npm run check. Open a pull request into main only if a fix was required. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

Held, do not start: RT11 library 2F waits until the team confirms IBM_7721 is the library. Catalog titles it PUP ICT Office 2F.

Do not start R1, K1, or K2: R1 and K1 were the Oct 15 3:00 and 3:30 clocks, K2 is plan.md's 3:30 PM Oct 16 checkpoint, and this pass uses 11:00, 12:30, and 2:00 instead.

## User journey

Do not build live course slots, the stuck-ticket reminder, lines at every step, course after Step 1, Accept, Change course, venue code, Restore, Remove, Profile, or gym exits. Those are written in docs/user-journey.md for after the Bobathon.

### UJ1. Skip in the contract
- Goal: The contract describes Skip, and nothing else new.
- Files: src/contract.ts only.
- Depends on: L2, which is on main.
- Done when: The contract documents POST /api/tickets/:id/skip. The first Skip returns the ticket to waiting at the back of its stall line. The second Skip cancels it. Finished steps stay finished. Ticket.code does not change. No other new route. Add only the status or field Skip needs to tell a first skip from a second skip and to place the ticket at the back of its stall line.
- Branch: `troy/uj1-skip-contract`

```
Branch from a fresh main using `troy/uj1-skip-contract`.
Read docs/delegation.md for UJ1 and the Decisions section of docs/user-journey.md.
You are the project manager. Edit src/contract.ts only. Document POST /api/tickets/:id/skip. The first Skip returns the ticket to waiting at the back of its stall line. The second Skip cancels it. The contract must be able to tell a first skip from a second skip, and the stall queue must be able to place that ticket after the other waiting tickets at that stall. Ticket.code does not change. Finished steps stay finished. Do not add Restore, Remove, Accept, Change course, venue code, slots, or a line at any station except stall.
Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

### UJ2. Skip route
- Goal: The server performs the Skip the contract describes.
- Files: src/server.ts, src/server.test.ts.
- Depends on: UJ1.
- Done when: A test shows the first POST /api/tickets/:id/skip places the ticket after the other waiting tickets at its stall, and a second POST cancels it. The printed code is unchanged. nextStation is unchanged. Finished steps stay finished.
- Branch: `troy/uj2-skip-route`

```
Branch from a fresh main using `troy/uj2-skip-route`.
Read docs/delegation.md for UJ2 and the Decisions section of docs/user-journey.md.
Implement POST /api/tickets/:id/skip in src/server.ts as UJ1 documented it. The stall queue is sorted by createdAt today. The first Skip must leave this ticket after the other waiting tickets at that stall without changing Ticket.code. The second Skip cancels it. Finished steps stay finished. Do not change nextStation. Add the test in src/server.test.ts.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build live course slots, the stuck-ticket reminder, lines at every step, course after Step 1, Accept, Change course, venue code, Restore, Remove, Profile, or gym exits.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

## Map

Floor traces and the map follow-ups. Owner is Troy on each task.

### RT25. Trace gym GF
- Goal: Trace the gym ground floor from docs/floorplans/IBM_7734.JPG into the same kind of plan files the main floors use.
- Files: public/maps/gym-gf.svg, public/maps/gym-gf.webp
- Depends on: none
- Done when: public/maps/gym-gf.svg traces that photo, with a viewBox and a data-room polygon only where the id is already a gym-gf room in data/paths.json. public/maps/gym-gf.webp is the cleaned image of that plan. RT9 stays held. Do not fill data/station-locations.json.
- Branch: `troy/rt25-gym-trace`
- Owner: Troy

```
Task RT25. Trace gym GF.

Goal: Trace the gym ground floor from docs/floorplans/IBM_7734.JPG into the same kind of plan files the main floors use.

Files: public/maps/gym-gf.svg, public/maps/gym-gf.webp.

Depends on: none.

Branch from a fresh main: troy/rt25-gym-trace.

Read docs/delegation.md for this task id. Read docs/floorplans/IBM_7734.JPG and the gym-gf room ids in data/paths.json.

public/maps/gym-gf.svg traces that photo. Give it a viewBox. Put data-room only on a polygon whose id is already a gym-gf room in data/paths.json. public/maps/gym-gf.webp is the cleaned image of that plan. RT9 stays held. Do not fill data/station-locations.json. Do not invent a room.

Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.

Done when: public/maps/gym-gf.svg traces that photo, with a viewBox and a data-room polygon only where the id is already a gym-gf room in data/paths.json. public/maps/gym-gf.webp is the cleaned image of that plan. RT9 stays held.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT26. Trace Library 3F
- Goal: Trace Library 3F from docs/floorplans/library-3F.png into the same kind of plan files the main floors use.
- Files: public/maps/library-3f.svg, public/maps/library-3f.webp
- Depends on: none
- Done when: public/maps/library-3f.svg traces that png, with a viewBox and a data-room polygon only where the id is already a library-3f room in data/paths.json. public/maps/library-3f.webp is the cleaned image of that plan. rooms.json has 30 rows for source library-3F.png. Do not invent a room.
- Branch: `troy/rt26-library3f-trace`
- Owner: Troy

```
Task RT26. Trace Library 3F.

Goal: Trace Library 3F from docs/floorplans/library-3F.png into the same kind of plan files the main floors use.

Files: public/maps/library-3f.svg, public/maps/library-3f.webp.

Depends on: none.

Branch from a fresh main: troy/rt26-library3f-trace.

Read docs/delegation.md for this task id. Read docs/floorplans/library-3F.png and the library-3f room ids in data/paths.json. rooms.json has 30 rows for source library-3F.png, building Library (NALRC), floor 3F.

public/maps/library-3f.svg traces that png. Give it a viewBox. Put data-room only on a polygon whose id is already a library-3f room in data/paths.json. public/maps/library-3f.webp is the cleaned image of that plan. Do not invent a room.

Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.

Done when: public/maps/library-3f.svg traces that png, with a viewBox and a data-room polygon only where the id is already a library-3f room in data/paths.json. public/maps/library-3f.webp is the cleaned image of that plan.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT27. Trace ICTO 2F
- Goal: Trace the ICTO 2F plan from docs/floorplans/IBM_7721.JPG into the library-2f plan files. This does not lift the RT11 hold. The catalog still titles that photo PUP ICT Office 2F.
- Files: public/maps/library-2f.svg, public/maps/library-2f.webp
- Depends on: none
- Done when: public/maps/library-2f.svg traces IBM_7721, with a viewBox and a data-room polygon only where the id is already a library-2f room in data/paths.json. public/maps/library-2f.webp is the cleaned image of that plan. The RT11 hold stays. Do not edit the hold to say the photo is confirmed as the library.
- Branch: `troy/rt27-icto2f-trace`
- Owner: Troy

```
Task RT27. Trace ICTO 2F.

Goal: Trace the ICTO 2F plan from docs/floorplans/IBM_7721.JPG into the library-2f plan files. This does not lift the RT11 hold. The catalog still titles that photo PUP ICT Office 2F.

Files: public/maps/library-2f.svg, public/maps/library-2f.webp.

Depends on: none.

Branch from a fresh main: troy/rt27-icto2f-trace.

Read docs/delegation.md for this task id, the RT11 hold, and docs/floorplans/catalog.md. Read docs/floorplans/IBM_7721.JPG and the library-2f room ids in data/paths.json.

public/maps/library-2f.svg traces IBM_7721. Give it a viewBox. Put data-room only on a polygon whose id is already a library-2f room in data/paths.json. public/maps/library-2f.webp is the cleaned image of that plan. The RT11 hold stays. Do not edit the hold to say the photo is confirmed as the library. Do not invent a room.

Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.

Done when: public/maps/library-2f.svg traces IBM_7721, with a viewBox and a data-room polygon only where the id is already a library-2f room in data/paths.json. public/maps/library-2f.webp is the cleaned image of that plan. The RT11 hold stays.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT28. Map pin and label redesign
- Goal: The map pin and its label are drawn by a new script, styled in the map stylesheet, and loaded by one new script tag.
- Files: public/map-pins.js (new), public/map.css, one script tag in public/map.html
- Depends on: none. The map page is already on main.
- Done when: public/map-pins.js draws the pin and the label, public/map.css styles them, and public/map.html adds one script tag for map-pins.js. No other new tag in public/map.html. Do not edit public/map.js. Selecting a room still shows that pin. Usable at 360 px.
- Branch: `troy/rt28-pins`
- Owner: Troy

```
Task RT28. Map pin and label redesign.

Goal: The map pin and its label are drawn by a new script, styled in the map stylesheet, and loaded by one new script tag.

Files: public/map-pins.js (new), public/map.css, one script tag in public/map.html.

Depends on: none. The map page is already on main.

Branch from a fresh main: troy/rt28-pins.

Read docs/delegation.md for this task id.

Create public/map-pins.js and draw the pin and the label there. Style them in public/map.css. In public/map.html add one script tag for map-pins.js. Add no other tag. Do not edit public/map.js. Selecting a room still shows that pin. Usable at 360 px.

Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.

Done when: public/map-pins.js draws the pin and the label, public/map.css styles them, and public/map.html adds one script tag for map-pins.js. No other new tag in public/map.html. Selecting a room still shows that pin. Usable at 360 px.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT29. Georeferenced floor overlay
- Goal: Draw each main floor plan on the campus map from geographic corners stored on the floor row.
- Files: public/map.js, data/floors.json, src/maps.test.ts
- Depends on: none. Do not wait on RT25, RT26, RT27, or RT30.
- Done when: main-1f-lobby, main-4f, and main-5f in data/floors.json each have four [longitude, latitude] corners, in MapLibre image-source order (top-left, top-right, bottom-right, bottom-left). public/map.js draws that floor image on the campus map from those corners. src/maps.test.ts fails if one of those rows is missing corners, if a corner is not finite, or if its image file is missing. The existing image size checks stay.
- Branch: `troy/rt29-floor-overlay`
- Owner: Troy

```
Task RT29. Georeferenced floor overlay.

Goal: Draw each main floor plan on the campus map from geographic corners stored on the floor row.

Files: public/map.js, data/floors.json, src/maps.test.ts.

Depends on: none. Do not wait on RT25, RT26, RT27, or RT30.

Branch from a fresh main: troy/rt29-floor-overlay.

Read docs/delegation.md for this task id.

On main-1f-lobby, main-4f, and main-5f in data/floors.json, store four [longitude, latitude] corners, in MapLibre image-source order (top-left, top-right, bottom-right, bottom-left). In public/map.js, draw that floor image on the campus map from those corners. In src/maps.test.ts, fail if one of those rows is missing corners, if a corner is not finite, or if its image file is missing. Keep the existing image size checks.

Do not edit src/contract.ts. Do not invent a building.

Done when: those three floor rows have the four corners, public/map.js draws the image from them, and src/maps.test.ts fails when a corner or the image file is missing.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT30. Trace Psych building GF
- Goal: Trace the Psych building ground floor from docs/floorplans/IBM_7726.JPG. Troy confirmed that photo is this building.
- Files: public/maps/psych-gf.svg, public/maps/psych-gf.webp
- Depends on: none
- Done when: public/maps/psych-gf.svg traces that photo, including the walls and the labels printed on it, and public/maps/psych-gf.webp is the cleaned image. The plan is the Psych building ground floor. Do not use it as the Main Building lobby. Do not add a rooms.json row. Do not add a room the photo does not show.
- Branch: `troy/rt30-psych-trace`
- Owner: Troy

```
Task RT30. Trace Psych building GF.

Goal: Trace the Psych building ground floor from docs/floorplans/IBM_7726.JPG. Troy confirmed that photo is this building.

Files: public/maps/psych-gf.svg, public/maps/psych-gf.webp.

Depends on: none.

Branch from a fresh main: troy/rt30-psych-trace.

Read docs/delegation.md for this task id. Read docs/floorplans/IBM_7726.JPG. Troy confirmed that photo is the Psych building ground floor.

public/maps/psych-gf.svg traces that photo, including the walls and the labels printed on it. public/maps/psych-gf.webp is the cleaned image. Do not use this plan as the Main Building lobby. Do not add a rooms.json row. Do not add a room the photo does not show.

Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.

Done when: public/maps/psych-gf.svg traces that photo and public/maps/psych-gf.webp is the cleaned image. The plan is the Psych building ground floor.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT31. Real walking paths
- Goal: The outdoor walk from the main gate to the East Wing entrance follows OSM footways stored in the repo.
- Files: data/campus-osm.json, public/route.js, src/route.test.ts, src/route-start.test.ts
- Depends on: none
- Done when: The walk in data/campus-osm.json is a sequence of OSM footway positions from the main gate to the East Wing entrance. The straight last step in that file's walk note is gone. src/route.test.ts and src/route-start.test.ts expect the new geometry. The running app does not request OpenStreetMap.
- Branch: `troy/rt31-osm-footways`
- Owner: Troy

```
Task RT31. Real walking paths.

Goal: The outdoor walk from the main gate to the East Wing entrance follows OSM footways stored in the repo.

Files: data/campus-osm.json, public/route.js, src/route.test.ts, src/route-start.test.ts.

Depends on: none.

Branch from a fresh main: troy/rt31-osm-footways.

Read docs/delegation.md for this task id. The walk note in data/campus-osm.json says the path ends in a straight last step to the East Wing entrance.

Replace that walk with OSM footway positions stored in data/campus-osm.json, from the main gate to the East Wing entrance. Remove the straight last step. Update public/route.js only where the step text or the stored line must match. Update src/route.test.ts and src/route-start.test.ts so they expect the new geometry. The running app does not request OpenStreetMap.

Do not edit src/contract.ts.

Done when: The walk is a sequence of OSM footway positions from the main gate to the East Wing entrance, the straight last step is gone, and the route tests expect that geometry.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT32. Route regression and debug page
- Goal: A test locks the routes already covered in src/route.test.ts, and a debug page shows the same route.
- Files: src/route.test.ts, public/route-debug.html (new)
- Depends on: none. If RT31 has merged, branch from that main so the locked outdoor leg is the footway walk.
- Done when: src/route.test.ts fails when the steps or the point list of a locked route change. The locked set is the routes that file already covers: one floor, a floor change, and outdoors to a room. public/route-debug.html shows that same route: start, steps, and line. No new queue endpoint.
- Branch: `troy/rt32-route-regression`
- Owner: Troy

```
Task RT32. Route regression and debug page.

Goal: A test locks the routes already covered in src/route.test.ts, and a debug page shows the same route.

Files: src/route.test.ts, public/route-debug.html (new).

Depends on: none. If RT31 has merged, branch from that main so the locked outdoor leg is the footway walk.

Branch from a fresh main: troy/rt32-route-regression.

Read docs/delegation.md for this task id.

In src/route.test.ts, fail when the steps or the point list of a locked route change. Lock the routes that file already covers: one floor, a floor change, and outdoors to a room. Create public/route-debug.html and show that same route: start, steps, and line. Do not add a queue endpoint.

Do not edit src/contract.ts.

Done when: the test fails when a locked route's steps or point list change, and public/route-debug.html shows that same route.

When the done-when line is true, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### W4. Hidden chatbot

- Goal: A ChatGPT-style page at /chat.html answers PUP Manila questions about the three IsQolar features (FAQ, Room TBA map, queue), with a Play demo button for the prerecorded Q&A.
- Files: src/chat.ts (new), src/chat.test.ts (new), src/server.ts (POST /api/chat only), public/chat.html (new), public/chat/demo-qa.json and public/chat/audio/*.mp3 (new), render.yaml
- Depends on: none. Render needs GROQ_API_KEY set in its dashboard.
- Done when: POST /api/chat proxies to Groq with the key from process.env.GROQ_API_KEY only (503 without it, 502 upstream failure, 400 bad input), room links only use codes in data/paths.json, chat.html is not linked from any page, and Play demo plays and types all six Q&A pairs with no API calls.
- Branch: `troy/w4-chat`
- Owner: Troy

# Donita

Staff tablet, the hub laptop, and tomorrow's offline queue. Floor images are Troy's RT1, taken from Viv, so this night stays on `public/staff.html` and the hub.

## Tonight

### H0. Hub laptop

- Goal: The hub laptop serves the app and a phone on the same LAN can open health.
- Files: none unless the phone cannot reach the server. `src/server.ts` already serves `GET /health`.
- Depends on: T1b, which is done.
- Done when: On the hub, `npm run dev` is running and a phone browser at `http://<hub-ip>:3000/health` shows `{"ok":true}`.
- Branch: `donita/h0-hub`

```
Read docs/delegation.md task H0 and README.md.
Branch from a fresh main: donita/h0-hub.
On the hub laptop run npm run dev. From a phone on the same LAN, open http://<hub-ip>:3000/health. The page must show {"ok":true}. If the phone cannot reach it, switch the laptop to a phone hotspot and try once more. Fix only the one blocker that stopped the phone. Do not edit src/contract.ts. Do not change queue logic. Do not invent a public URL.
When the phone shows ok, run npm run check if you changed files. Open a pull request into main only if files changed. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### D1. Call next and Mark done

- Goal: The staff tablet can call the next ticket and mark it done.
- Files: `public/staff.html`. Endpoints already exist: `POST /api/stalls/:stall/next` and `POST /api/tickets/:id/done`.
- Depends on: F0, which is done.
- Done when: Opening `/staff.html?stall=BSCS-1`, tapping Call next, then Mark done, changes `nowServing` on `GET /api/stalls` and the board if V1 is up.
- Branch: `donita/d1-staff-tablet`

```
Read docs/delegation.md task D1, docs/product.md, and docs/architecture.md.
Branch from a fresh main: donita/d1-staff-tablet.
Build public/staff.html?stall= so staff can tap Call next and Mark done. Call next is POST /api/stalls/:stall/next. Mark done is POST /api/tickets/:id/done. Poll with public/poll.js. Do not edit src/contract.ts. Do not edit src/server.ts. Do not invent a station.
When Call next updates GET /api/stalls, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### D3. Lookup and undo

- Goal: Staff can look up a ticket code and undo the last move.
- Files: `public/staff.html`. `POST /api/tickets/:id/undo` already exists. `GET /api/tickets/:id` looks up the ticket id, not the printed code. `GET /api/stalls/:stall/queue` returns tickets that include `code`. There is no code-lookup route.
- Depends on: D1
- Done when: Entering a code that is in the stall queue shows that ticket, and Undo returns it to the previous station on the next poll.
- Branch: `donita/d3-staff-undo`

```
Read docs/delegation.md task D3. Start from a fresh main after donita/d1-staff-tablet has merged.
Branch: donita/d3-staff-undo.
On public/staff.html, match the typed code against tickets from GET /api/stalls/:stall/queue. Those tickets include code. Then call POST /api/tickets/:id/undo with that ticket's id. GET /api/tickets/:id is by id, not by code. Do not add a route. Do not edit src/contract.ts. Do not change server queue logic.
When Undo restores the previous ticket, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## Tomorrow AM

### D2. Tokens and LiveStatus

- Goal: The three pages share `tokens.css` and show LiveStatus.
- Files: create `public/tokens.css` from Appendix A of `docs/DESIGN-PUP-Enrollment-Queue.md`. Link it from `public/board.html`, `public/staff.html`, and `public/phone.html`. Do not edit the design doc.
- Depends on: D1, A1, V1
- Done when: Each of the three pages loads `public/tokens.css` and shows a last-updated line from the poller state.
- Branch: `donita/d2-tokens`

```
Read docs/delegation.md task D2 and Appendix A of docs/DESIGN-PUP-Enrollment-Queue.md. Do not edit the design doc.
Branch from a fresh main after D1, A1, and V1 have merged: donita/d2-tokens.
Add public/tokens.css using the tokens in that appendix. Link it from public/board.html, public/staff.html, and public/phone.html. Show LiveStatus from the poller's last-updated state. Do not edit src/contract.ts. Do not add a colour the appendix does not define.
When all three pages load the file, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### H1. Hub file

- Goal: The hub writes state to a JSON file on every change and reloads it on start.
- Files: `src/store.ts`. Update the state section of `docs/architecture.md`, which currently says there is no file persistence.
- Depends on: T3, which is done.
- Done when: Restarting the hub process restores the tickets that were there before the restart. Render behavior stays in-memory, as ADR 005 says persistence stays with the hub.
- Branch: `donita/h1-hub-file`

```
Read docs/delegation.md task H1, docs/architecture.md, and docs/decisions/005-online-on-render.md.
Branch from a fresh main: donita/h1-hub-file.
Snapshot store state to a JSON file on every change and reload that file when the hub process starts. Keep Render on MemoryStore with no file. Update the state section in docs/architecture.md. Do not edit src/contract.ts. Do not change ticket status rules.
When a restart restores the tickets, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### H2. Offline staff queue

- Goal: Call next and Mark done still work on the tablet while the hub is unreachable, then replay.
- Files: `public/staff.html`, `public/poll.js` only if the offline flag is missing. Sync field names come from L2. Do not edit `src/contract.ts`.
- Depends on: P0, L2
- Done when: With the hub stopped, Call next and Mark done stay on the tablet. When the hub returns, those actions replay and the UI shows they synced later.
- Branch: `donita/h2-offline-queue`

```
Read docs/delegation.md task H2. Wait until troy/l2-contract has merged. Use only the sync fields L2 added. Do not edit src/contract.ts.
Branch from a fresh main: donita/h2-offline-queue.
While the hub is unreachable, save Call next and Mark done on the staff tablet and replay them when the hub returns. Show a synced-later mark. Do not change queue rules on the server beyond what L2's fields require.
When replay works, run npm run check. Open a pull request into main. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### W1. LAN integration

- Goal: Phone, staff tablet, and board run together on the hub LAN. Troy joins this check.
- Files: none unless a bug fix is required.
- Depends on: V1, D1, A1, P0, J1, H0
- Done when: The three devices show the same call within 2 seconds. This is the setup for the 11:00 dry run.
- Branch: `donita/w1-lan-check`

```
Read docs/delegation.md task W1.
Branch from a fresh main: donita/w1-lan-check.
On the hub LAN, open the board, the staff tablet, and a phone. Staff tap Call next. The phone banner and the board now-serving line must change within 2 seconds. If they do, do not change product code. If they do not, fix the one bug. Do not edit src/contract.ts.
Run npm run check if you changed files. Open a pull request only if files changed. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### W2. Staff Skip button

- Goal: Staff can Skip the called ticket next to Mark done, with the same timeout and undo pattern as done.
- Files: `public/staff.js`, `public/staff.html` only.
- Depends on: D1, UJ2.
- Done when: While a ticket is called, Skip is next to Mark done and POSTs `/api/tickets/:id/skip` with the same 4s `fetchT` timeout and undo pattern as Mark done. The page does not add Hold, Recall, Restore, Remove, Accept, or Change course.
- Branch: `troy/w2-staff-skip`

```
Branch from a fresh main using `troy/w2-staff-skip`.
Read AGENTS.md, .bob/rules/workflow.md, and docs/delegation.md for W2.
Lane: public/staff.js and public/staff.html only. Do not edit src/contract.ts.
Add a Skip button next to Mark done that POSTs /api/tickets/:id/skip (src/server.ts skip route) for the called ticket, using the same 4s fetchT timeout and undo pattern as done.
No em dashes. No UPLB. No bob log. No AI trailers.
Run tsc --noEmit, eslint ., and node --import tsx/esm --test src/*.test.ts.
Open a pull request into main with screenshots at 1280x800 and 390x844 in the PR body. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### X1. Offline test

- Goal: Unplug the router mid-demo. Staff keep working. Actions sync when the hub returns.
- Files: none unless a bug fix is required.
- Depends on: H1, H2
- Done when: During the unplug, staff can Call next and Mark done. After reconnect, the hub matches the tablet.
- Branch: `donita/x1-offline-test`

```
Read docs/delegation.md task X1.
Branch from a fresh main: donita/x1-offline-test.
Unplug the router while the staff tablet is open. Call next and Mark done must still work. Reconnect. The hub must show those actions. Open a pull request only if a fix was required. Do not edit src/contract.ts.
If you opened a PR, run npm run check first. Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### S5. Backup demo

- Goal: The hub laptop and a phone hotspot are ready if the venue network fails. After 12:30 this is kit, not product code.
- Files: none
- Depends on: the 12:30 freeze
- Done when: The laptop can serve the app over its own hotspot and a phone can open `/health`.
- Branch: `donita/s5-backup-demo`

```
Read docs/delegation.md task S5.
Do not change product code after the 12:30 freeze. Confirm the hub laptop and a phone hotspot can serve GET /health. Tell Troy the hotspot works. Do not edit src/contract.ts.
```

RT9 is held. Do not start gym pins until the team supplies the gym table layout. `IBM_7734` is the gym photo, not that layout. Branch later would be `donita/rt9-gym-pins`.

## User journey

### UJ4. State tokens
- Goal: The new phone states have class names in tokens.css, using colors the design file already names.
- Files: public/tokens.css.
- Depends on: D2.
- Done when: tokens.css names Almost, Go now, Skipped once, Cancelled, and the step-rail check, and it adds no hex value that is not already in docs/DESIGN-PUP-Enrollment-Queue.md. That design file is unchanged.
- Branch: `donita/uj4-state-tokens`

```
Branch from a fresh main using `donita/uj4-state-tokens`.
Read docs/delegation.md for UJ4. Read the design-file conflicts in docs/user-journey.md. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
In public/tokens.css, name classes for Almost, Go now, Skipped once, Cancelled, and the step-rail check. Use only colors that file already names. Add no new hex. Do not resolve the conflicts by editing the design file.
Do not edit src/contract.ts.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

### UJ3. Staff Skip
- Goal: Staff can Skip the ticket they just called.
- Files: public/staff.html.
- Depends on: D1, UJ2.
- Done when: While a ticket is called, Skip posts POST /api/tickets/:id/skip. The page does not add Hold, Recall, Restore, Remove, Accept, or Change course.
- Branch: `donita/uj3-staff-skip`

```
Branch from a fresh main using `donita/uj3-staff-skip`.
Read docs/delegation.md for UJ3 and the Decisions section of docs/user-journey.md.
On public/staff.html, while a ticket is called, add Skip. It posts POST /api/tickets/:id/skip from UJ2. Do not add Hold, Recall, Restore, Remove, Accept, or Change course.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build live course slots, the stuck-ticket reminder, lines at every step, course after Step 1, Accept, Change course, venue code, Restore, Remove, Profile, or gym exits.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

# Justin

## Tonight

### J1. About 40 simulated tickets
- Goal: The seed looks like a busy morning on the three existing stalls.
- Files: src/store.ts, docs/product.md
- Depends on: T1b (done)
- Done when: seed() still creates stalls BSCS-1, BSIT-1, and BSEE-1 only, still logs a stall count of 3, and creates about 40 tickets with simulated true. The five existing names stay. Queue lengths on the three stalls are not equal. The five-ticket sentence in docs/product.md matches the new count.
- Branch: `justin/j1-sim-morning`

```
Branch from a fresh main using `justin/j1-sim-morning`.
Read docs/delegation.md for J1.
Change the seed so a morning looks busy on the three stalls that already exist. seed() must still create only BSCS-1, BSIT-1, and BSEE-1, must still log a stall count of 3, and must create about 40 tickets with simulated set to true. Keep Ana Reyes, Ben Santos, Cara Lim, Dan Cruz, and Eva Tan. Do not add any other student name. Make the queue lengths on those three stalls unequal. Do not add a program other than BSCS, BSIT, or BSEE. Do not present the tickets as real students. docs/product.md currently says five tickets and lists those five names. Update that sentence to the new count. src/server.test.ts asserts stalls.length === 3 after POST /api/admin/seed. Keep that assertion true.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### P0. Poll status text
- Goal: The shared poller exposes last-updated time and an offline state the pages can read.
- Files: public/poll.js
- Depends on: F0 (done)
- Done when: After a successful poll, dataset.online is true and a dataset attribute holds the last success time. After a failed poll, dataset.online is false.
- Branch: `justin/p0-poll-status`

```
Branch from a fresh main using `justin/p0-poll-status`.
Read docs/delegation.md for P0.
Edit public/poll.js only. It already defaults ms to 2000 and sets document.body.dataset.online. After a successful poll, set dataset.online to true and set a dataset attribute to the last success time. After a failed poll, set dataset.online to false. Plan.md says public/js/poll.js. That path does not exist. Do not create it. Do not edit the three HTML files.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### J2. Printable ticket
- Goal: A ticket prints with code and course.
- Files: public/phone.html
- Depends on: none
- Done when: Printing the phone ticket shows the ticket code and course and hides the rest of the page chrome.
- Branch: `justin/j2-printable-ticket`

```
Branch from a fresh main using `justin/j2-printable-ticket`.
Read docs/delegation.md for J2.
Add print CSS to public/phone.html. There is no print stylesheet yet. Do not add a CDN. Printing the phone ticket must show the ticket code and course and hide the rest of the page chrome. Those fields already exist on GET /api/tickets/:id (code, course). Plan.md says this waits on W1. Do not wait for W1.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## Tomorrow AM

### RT5. Pin labels
- Goal: data/locations.json has one row per rooms.json label on IBM_7739 (27), IBM_7741 (39), and IBM_7742 (76).
- Files: data/locations.json, docs/floorplans/rooms.json
- Depends on: RT2, RT4
- Done when: Each row has id, floorId, label, kind, x, y, aliases as an empty array, source, and verified. x and y are inside 0..1 and come from map.html?edit=1 console logs. Labels that contain ? stay unverified.
- Branch: `justin/rt5-location-pins`

```
Branch from a fresh main using `justin/rt5-location-pins`.
Read docs/delegation.md for RT5.
Create data/locations.json. It does not exist yet. Source labels are docs/floorplans/rooms.json. Write one row per label on IBM_7739 (27 labels), IBM_7741 (39 labels), and IBM_7742 (76 labels). Each row has id, floorId, label, kind, x, y, aliases as an empty array, source, and verified. x and y are inside 0..1 and come from map.html?edit=1 console logs. Labels that contain ? stay unverified. Do not add a label that is not in rooms.json. Do not add aliases. Do not invent rooms.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### G1. Guardian page
- Goal: Read-only guardian view for a ticket code.
- Files: src/server.ts, public/guardian.html
- Depends on: L2
- Done when: GET /api/guardian/:code returns the GuardianStatus shape L2 put in the contract, and public/guardian.html renders station and label for that code. No outbound call.
- Branch: `justin/g1-guardian`

```
Branch from a fresh main using `justin/g1-guardian`.
Read docs/delegation.md for G1.
Add a read-only guardian view for a ticket code. Add the route in src/server.ts. Create public/guardian.html. It does not exist yet. GET /api/guardian/:code returns the GuardianStatus shape L2 put in the contract. public/guardian.html renders station and label for that code. No outbound call.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### J3. QR on the ticket
- Goal: The printed ticket has a QR that opens the student page.
- Files: public/phone.html
- Depends on: J2
- Done when: The printed ticket shows a QR that opens the phone page for that ticket on the hub, using a relative URL.
- Branch: `justin/j3-ticket-qr`

```
Branch from a fresh main using `justin/j3-ticket-qr`.
Read docs/delegation.md for J3.
On the printed ticket in public/phone.html, show a QR that opens the phone page for that ticket on the hub. Use a relative URL so it works before the Render URL exists. No CDN. A local package is allowed only if it works offline on the hub.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## User journey

### UJ5. Guardian copy
- Goal: The guardian page uses the journey's sentences on top of G1.
- Files: public/guardian.html.
- Depends on: G1.
- Done when: The page maps the station to Step N of 5 using the table in docs/user-journey.md. It shows the journey's guardian sentences for waiting, being served, finished, skipped once, cancelled, and fully enrolled. Place in line and the estimate show only at stall, and only when the guardian payload already includes them. It does not show a ticket number, a QR, a permit number, or course slots. It does not show gym exits.
- Branch: `justin/uj5-guardian-copy`

```
Branch from a fresh main using `justin/uj5-guardian-copy`.
Read docs/delegation.md for UJ5 and sections 4 and the Decisions of docs/user-journey.md.
On public/guardian.html, on top of G1, map the station to Step N of 5: checkin and docs are Step 1 Admission, stall is Step 2 College / Department, validation is Step 3 Medical, main is Step 4 Registration Card, enrolled is Step 5 ID. Use the guardian sentences in section 4 for waiting, being served, finished, skipped once, cancelled, and fully enrolled. Show place in line and the estimate only when the station is stall and the payload already has those numbers. Do not add fields to the contract. Do not show a ticket number, a QR, a permit number, or course slots. Do not show gym exits. Stale copy is "Not updating since" plus the last time G1 already shows.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build live course slots, the stuck-ticket reminder, lines at every step, course after Step 1, Accept, Change course, venue code, Restore, Remove, Profile, or gym exits.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

# Ayen

## Tonight

### A1. Phone ticket and banner
- Goal: Join form, ticket code, position, wait, and the call banner.
- Files: public/phone.html
- Depends on: F0 (done)
- Done when: GET /api/tickets/:id via public/poll.js shows code, position, and estWaitMin. Within 2 seconds of POST /api/stalls/:stall/next the page shows Ikaw na, Iskolar!.
- Branch: `ayen/a1-phone-ticket`

```
Branch from a fresh main using `ayen/a1-phone-ticket`.
Read docs/delegation.md for A1.
Build the phone join form, ticket code, position, wait, and call banner in public/phone.html. Banner and enrolled words come from src/contract.ts: BRAND.callScreen is Ikaw na, Iskolar! and BRAND.enrolledFinal is the enrolled line. The design doc has different banner words. Use the contract strings. Layout components are named in docs/DESIGN-PUP-Enrollment-Queue.md. Do not edit that file. GET /api/tickets/:id via public/poll.js must show code, position, and estWaitMin. Within 2 seconds of POST /api/stalls/:stall/next the page shows Ikaw na, Iskolar!.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT6. Empty station file
- Goal: data/station-locations.json exists and maps nothing.
- Files: data/station-locations.json
- Depends on: none
- Done when: The file is an empty mapping from station or stall id to location id. No gym rows. No invented table layout.
- Branch: `ayen/rt6-station-locations`

```
Branch from a fresh main using `ayen/rt6-station-locations`.
Read docs/delegation.md for RT6.
Create data/station-locations.json. It does not exist yet. Make it an empty mapping from station or stall id to location id. No gym rows. No invented table layout. Do not invent rooms.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## Tomorrow AM

### A4. Step away and enrolled card
- Goal: Hint when estWaitMin is over 20, and the final enrolled card.
- Files: public/phone.html
- Depends on: A1
- Done when: The enrolled screen shows exactly: You're fully enrolled. Welcome, Iskolar ng Bayan. When estWaitMin is over 20 the page says the student can step away.
- Branch: `ayen/a4-enrolled-card`

```
Branch from a fresh main using `ayen/a4-enrolled-card`.
Read docs/delegation.md for A4.
In public/phone.html, when estWaitMin is over 20, say the student can step away. The enrolled screen shows exactly: You're fully enrolled. Welcome, Iskolar ng Bayan. Do not invent a second enrolled sentence.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### A3. Pitch and demo script
- Goal: Pitch draft and a day-2 demo script with an online beat and an offline beat.
- Files: a new doc under docs/
- Depends on: none
- Done when: The doc contains the contract pitch line, a LAN beat, and a Render beat, and it does not claim Render is live unless T4 has merged a real URL.
- Branch: `ayen/a3-pitch-script`

```
Branch from a fresh main using `ayen/a3-pitch-script`.
Read docs/delegation.md for A3.
Add a new doc under docs/ with a pitch draft and a day-2 demo script. Include an online beat and an offline beat. The pitch line already in the contract is: IsQolar shows every freshman where they are in line, when they can step away, and when they're truly done. The doc must contain that line, a LAN beat, and a Render beat. Do not claim Render is live unless T4 has merged a real URL. plan.md says this waits on K1. Do not wait for K1. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT8. Find your classes
- Goal: The enrolled phone screen links to the map.
- Files: public/phone.html
- Depends on: RT3, A4
- Done when: A link reads Find your classes and opens map.html. The enrolled sentence stays the contract string. The queue pages still load if that link and the map files are removed.
- Branch: `ayen/rt8-find-your-classes`

```
Branch from a fresh main using `ayen/rt8-find-your-classes`.
Read docs/delegation.md for RT8.
On the enrolled phone screen in public/phone.html, add a link that reads Find your classes and opens map.html. The enrolled sentence stays exactly: You're fully enrolled. Welcome, Iskolar ng Bayan. The queue pages must still load if that link and the map files are removed.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### A2. Demo check
- Goal: Check the demo against the script, including staff tap Call next live.
- Files: none unless a fix is required
- Depends on: W1
- Done when: On the hub, Call next changes the phone banner within 2 seconds.
- Branch: `ayen/a2-demo-check`

```
Branch from a fresh main using `ayen/a2-demo-check` only if a fix is required.
Read docs/delegation.md for A2.
Check the demo against the script, including staff tap Call next live. Until A3 exists, the script source is the demo steps in docs/product.md. On the hub, Call next must change the phone banner within 2 seconds. This is part of the 11:00 dry run.
Do not edit src/contract.ts.
Open a pull request into main only if a fix was required. If you open one, run npm run check first.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### A5. Both modes check
- Goal: Demo check for LAN and Render.
- Files: none unless a fix is required
- Depends on: X1, X2
- Done when: The LAN offline beat and the Render beat from A3 both pass, or a mode that is not up is recorded without blocking the 12:30 freeze.
- Branch: `ayen/a5-demo-check-2`

```
Branch from a fresh main using `ayen/a5-demo-check-2` only if a fix is required.
Read docs/delegation.md for A5.
Demo check for LAN and Render. The LAN offline beat and the Render beat from A3 must both pass. If either mode is not up, record that and do not block the 12:30 freeze.
Do not edit src/contract.ts.
Open a pull request into main only if a fix was required. If you open one, run npm run check first.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### S1. Pitch rehearsal
- Goal: Final pitch rehearsed twice, after the 12:30 freeze and before the 2:00 submit.
- Files: none
- Depends on: A3, 12:30 freeze
- Done when: The pitch has been rehearsed twice. No product code after 12:30.
- Branch: `ayen/s1-pitch-rehearsal`

```
Read docs/delegation.md for S1.
Rehearse the final pitch twice, after the 12:30 freeze and before the 2:00 submit. No product code after 12:30.
Do not open a code PR. Do not branch from main unless you already have a branch for a doc fix.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

Held, no task prompt: RT10 alias text waits until the team supplies at least five real other names. Do not invent aliases.

## User journey

### UJ6. Phone states
- Goal: The phone shows the five-step rail and the states from the decisions.
- Files: public/phone.html.
- Depends on: A4, UJ2.
- Done when: The rail reads Step N of 5 with a check on each finished step. checkin and docs show Step 1 Admission. stall shows Step 2 College / Department. validation shows Step 3 Medical. main shows Step 4 Registration Card. enrolled shows Step 5 ID and the contract enrolled sentence. Place in line and estWaitMin show only on stall. Waiting, Almost, Go now, Called, Finished, Skipped once, Cancelled, and Fully enrolled are distinct. Almost is estWaitMin 30 or less, or 5 or fewer people ahead. Go now is estWaitMin 10 or less, or 2 or fewer people ahead, and "You're next." when nobody is ahead. Called shows Ikaw na, Iskolar!. Almost, Go now, and Called vibrate where the browser allows it. The server station order is unchanged.
- Branch: `ayen/uj6-phone-states`

```
Branch from a fresh main using `ayen/uj6-phone-states`.
Read docs/delegation.md for UJ6 and the Decisions section of docs/user-journey.md.
In public/phone.html, show a step rail, "Step N of 5", with a check on each finished step. Map stations like this: checkin and docs are Step 1 Admission, stall is Step 2 College / Department, validation is Step 3 Medical, main is Step 4 Registration Card, enrolled is Step 5 ID. People ahead is TicketDetail.position minus 1. Show place in line and estWaitMin only when the station is stall. States: Waiting; Almost when estWaitMin is 30 or less or people ahead is 5 or fewer; Go now when estWaitMin is 10 or less or people ahead is 2 or fewer, and "You're next." when people ahead is 0; Called when status is called, using BRAND.callScreen (Ikaw na, Iskolar!); Finished when staff mark a step done; Skipped once and Cancelled from the Skip route; Fully enrolled uses BRAND.enrolledFinal and no second sentence. Go now wins over Almost. Called wins over Go now. Vibrate on Almost, Go now, and Called where the browser allows it, using the pattern already in the design file (200ms, pause 100ms, 200ms). Do not change nextStation. Do not show a line on Steps 1, 3, 4, or 5.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build live course slots, the stuck-ticket reminder, lines at every step, course after Step 1, Accept, Change course, venue code, Restore, Remove, Profile, or gym exits.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

### UJ7. Stay-near copy
- Goal: The phone shows the stay-near rule and the EN/FIL sentences from the journey.
- Files: public/phone.html.
- Depends on: UJ6.
- Done when: The ticket shows the English stay-near paragraph from section 3.1 of docs/user-journey.md, and the Filipino paragraph under it when FIL is selected. The state sentences for Almost, Go now, Skipped once, and Cancelled match section 3.2 in the selected language. The Filipino lines are copied as written. The called line stays Ikaw na, Iskolar!. The enrolled line stays the contract string.
- Branch: `ayen/uj7-stay-near-copy`

```
Branch from a fresh main using `ayen/uj7-stay-near-copy`.
Read docs/delegation.md for UJ7 and sections 3.1 and 3.2 of docs/user-journey.md.
On public/phone.html, show the English stay-near paragraph from section 3.1, and the Filipino paragraph when FIL is selected. Use the section 3.2 sentences for Almost, Go now, Skipped once, and Cancelled in the selected language, including "Go to Step N." Copy the Filipino lines as written. Do not rewrite them. Keep BRAND.callScreen and BRAND.enrolledFinal as they are. Do not add gym exits.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

### UJ8. Live Count of Courses
- Goal: The phone lists the courses in data/courses.csv, with PUP links only when the phone is online.
- Files: public/phone.html, src/server.ts only if the phone cannot read data/courses.csv yet.
- Depends on: data/courses.csv on main.
- Done when: The page groups the CSV by college, leaves out Juris Doctor, and keeps every other row, including rows whose notes say to confirm. It shows no slot count. Course names link to https://www.pup.edu.ph/academic/undergrad, college names link to https://www.pup.edu.ph/academic/colleges, and the iTech section links to https://www.pup.edu.ph/itech/, only when the phone is online. Offline, those names are plain text. The server does not request pup.edu.ph.
- Branch: `ayen/uj8-live-count`

```
Branch from a fresh main using `ayen/uj8-live-count`.
Read docs/delegation.md for UJ8 and section 3.4 of docs/user-journey.md.
Show a static Live Count of Courses from data/courses.csv on public/phone.html. Follow section 3.4 for grouping, order, and the three PUP links. Leave out Juris Doctor. Keep every other row, including diploma rows whose notes say to confirm. Show no slot number and no "Full". Show the links only when the phone is online. When it is not, show the names as plain text. If the phone cannot read the CSV, serve that file and do not change ticket or stall routes. The server must not request pup.edu.ph.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md. Do not edit data/courses.csv.
Do not build live course slots.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

### UJ9. Explore PUP
- Goal: The phone opens the Room TBA map and shows how many are waiting at each stall.
- Files: public/phone.html.
- Depends on: RT3, RT8.
- Done when: Explore PUP has a Find your classes link to map.html and lists each stall from GET /api/stalls with its queueLength. It adds no stall, room, alias, or exit.
- Branch: `ayen/uj9-explore-pup`

```
Branch from a fresh main using `ayen/uj9-explore-pup`.
Read docs/delegation.md for UJ9 and section 3.5 of docs/user-journey.md.
On public/phone.html, Explore PUP links Find your classes to map.html and lists every stall returned by GET /api/stalls with its queueLength. Do not add a stall, a room, an alias, or an exit. The queue pages still load if the map link and the map files are removed.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build gym exits or lines at every step.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

# Viv

## Tonight

### V1. TV board
- Goal: Board shows stalls, now serving, queue length, and estimated wait.
- Files: public/board.html
- Depends on: F0 (done)
- Done when: The page renders the seeded stalls grouped by the department field already on each stall (IT & CS, Engineering), with nowServing and queueLength.
- Branch: `viv/v1-tv-board`

```
Branch from a fresh main using `viv/v1-tv-board`.
Read docs/delegation.md for V1.
Build the TV board in public/board.html. The header string is the contract BRAND.boardHeader: IsQolar Live Board. Load data from GET /api/stalls. Poll with public/poll.js. Render the seeded stalls grouped by the department field already on each stall (IT & CS, Engineering), with nowServing and queueLength. Do not invent a department.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## Tomorrow AM

Order: RT3, then RT4, then V3, then V2.

### RT3. Map page
- Goal: A floor-plan page with search and pins.
- Files: public/map.html, public/map.js, src/server.ts
- Depends on: RT1, RT2
- Done when: Floor switcher, floor image, SVG pin overlay, search by label, detail card, and links map.html?loc=<id> and map.html?floor=<id> work. Usable at 360 px.
- Branch: `viv/rt3-map-page`

```
Branch from a fresh main using `viv/rt3-map-page`.
Read docs/delegation.md for RT3.
Create public/map.html and public/map.js. Neither exists. The page reads data/floors.json and data/locations.json. src/server.ts only serves public/ via express.static. If the page cannot fetch data/*.json, add a static mount in this PR. Do not change ticket or stall routes. Floor switcher, floor image, SVG pin overlay, search by label, detail card, and links map.html?loc=<id> and map.html?floor=<id> must work. Usable at 360 px. No CDN. No unsanitized innerHTML. No room that is not in the JSON. Do not invent rooms.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### RT4. Log pin clicks
- Goal: Edit mode logs click coordinates.
- Files: public/map.html
- Depends on: RT3
- Done when: map.html?edit=1 logs x and y to the console, each between 0 and 1, relative to the image. No editor UI. The click is not written to disk.
- Branch: `viv/rt4-edit-pins`

```
Branch from a fresh main using `viv/rt4-edit-pins`.
Read docs/delegation.md for RT4.
In public/map.html, map.html?edit=1 logs x and y to the console, each between 0 and 1, relative to the image. No editor UI. Do not write the click to disk. Do not invent coordinates for rooms.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### V3. Board polish
- Goal: Board fits a 1920 by 1080 TV, uses department colours from the design tokens, and shows a simulated-morning label.
- Files: public/board.html
- Depends on: V1
- Done when: The board layout is drawn for 1920 by 1080 and seeded tickets show as simulated.
- Branch: `viv/v3-board-polish`

```
Branch from a fresh main using `viv/v3-board-polish`.
Read docs/delegation.md for V3.
Polish public/board.html so it fits a 1920 by 1080 TV, uses department colours from the design tokens, and shows a simulated-morning label. Follow docs/DESIGN-PUP-Enrollment-Queue.md. Do not edit that file. Do not add a colour the design doc does not already define. The board layout is drawn for 1920 by 1080 and seeded tickets show as simulated. Do not invent a department.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### V2. Admin desktop
- Goal: Counts per station and the slowest stall.
- Files: public/admin.html
- Depends on: V1
- Done when: The page shows byStation counts and the stall id with the largest queueLength.
- Branch: `viv/v2-admin`

```
Branch from a fresh main using `viv/v2-admin`.
Read docs/delegation.md for V2.
Create public/admin.html. It does not exist yet. GET /api/admin/summary returns byStation only. GET /api/stalls has queueLength. Derive the slowest stall from queueLength. The page shows byStation counts and the stall id with the largest queueLength. Do not add a contract field. plan.md also says W1. Do not wait for W1. The admin routes already exist.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

### S2. README screenshots
- Goal: README has a screenshot for the phone, staff, and board viewports. After 12:30, docs only.
- Files: README.md and the image files it links
- Depends on: 12:30 freeze, V1, D1, A1
- Done when: README links a screenshot of the phone page, the staff page, and the board page.
- Branch: `viv/s2-readme-shots`

```
Branch from a fresh main using `viv/s2-readme-shots`.
Read docs/delegation.md for S2.
After the 12:30 freeze, docs only. README.md links a screenshot of the phone page, the staff page, and the board page. Add the image files those links use. V1, D1, and A1 must have merged. No product code after 12:30.
Do not edit src/contract.ts.
Run npm run check.
Open a pull request into main.
Stop after opening the PR and report the PR link. Do not merge. Troy reviews and merges.
```

## User journey

### UJ10. Projector on the board
- Goal: The board is the projector for the five steps, and only the stall line has numbers.
- Files: public/board.html.
- Depends on: V1, P0.
- Done when: The page shows "Now serving · Tinatawag na" and five columns, Steps 1 to 5, using the names in docs/user-journey.md. Step 2 lists each stall from GET /api/stalls with nowServing, the first three codes from that stall's queue, and queueLength. When nowServing is null, that spot shows "—". Steps 1, 3, 4, and 5 show no waiting count. If poll.js has had no successful poll for 60 seconds, the page shows "Not updating since" and the last time. No stall is invented.
- Branch: `viv/uj10-projector`

```
Branch from a fresh main using `viv/uj10-projector`.
Read docs/delegation.md for UJ10 and the Decisions section of docs/user-journey.md.
On public/board.html, show "Now serving · Tinatawag na" and five columns in order: Step 1 Admission, Step 2 College / Department, Step 3 Medical, Step 4 Registration Card, Step 5 ID. Step 2 lists each stall from GET /api/stalls. For each stall show nowServing, the first three codes from GET /api/stalls/:stall/queue in that array's order, and queueLength. When nowServing is null, show "—". Steps 1, 3, 4, and 5 do not show a waiting count. Keep BRAND.boardHeader. Poll with public/poll.js. If there has been no successful poll for 60 seconds, show "Not updating since" and the last time P0 exposes. Do not invent a stall. Do not add a venue code.
Do not edit src/contract.ts. Do not edit docs/DESIGN-PUP-Enrollment-Queue.md.
Do not build lines at every step.
Run npm run check.
Open the PR with gh pr create --fill --base main, report the link, and stop. No auto-merge and no bob log.
```

## Dependency graph

The picture matches docs/diagrams/task-graph.md.

```mermaid
flowchart TD
  classDef held stroke-dasharray: 5 5
  classDef mile fill:#1565c0,color:#fff

  subgraph doneBand ["On main"]
    subgraph doneTroy ["Troy"]
      T1b["T1b · Troy · merge seed fix"]
      F0["F0 · Troy · public shells"]
      T3["T3 · Troy · Store interface"]
      T2["T2 · Troy · ADR 005 and 006"]
    end
  end

  subgraph tonight ["Tonight"]
    subgraph troyN ["Troy"]
      T4["T4 · Troy · connect Render"]
      RT1["RT1 · Troy · clean floor images"]
      RT2["RT2 · Troy · floors file"]
    end
    subgraph donitaN ["Donita"]
      H0["H0 · Donita · hub laptop"]
      D1["D1 · Donita · Call next, Mark done"]
      D3["D3 · Donita · lookup and undo"]
    end
    subgraph justinN ["Justin"]
      J1["J1 · Justin · about 40 tickets"]
      P0["P0 · Justin · poll status text"]
      J2["J2 · Justin · printable ticket"]
    end
    subgraph ayenN ["Ayen"]
      A1["A1 · Ayen · phone ticket and banner"]
      RT6["RT6 · Ayen · empty station file"]
    end
    subgraph vivN ["Viv"]
      V1["V1 · Viv · TV board"]
    end
  end

  subgraph tomorrow ["Tomorrow AM"]
    subgraph troyD ["Troy"]
      L2["L2 · Troy · contract additions"]
      O1["O1 · Troy · wake before demos"]
      O2["O2 · Troy · public URL in README"]
      UP1["UP1 · Troy · health pinger"]
      RT7["RT7 · Troy · map check"]
      X2["X2 · Troy · online guardian test"]
      RT11["RT11 · Troy · library 2F"]
      RT12["RT12 · Troy · map cut"]
      S4["S4 · Troy · submission"]
    end
    subgraph donitaD ["Donita"]
      D2["D2 · Donita · tokens.css"]
      H1["H1 · Donita · hub file"]
      H2["H2 · Donita · offline staff queue"]
      W1["W1 · Donita and Troy · LAN integration"]
      X1["X1 · Donita · offline test"]
      S5["S5 · Donita · backup demo"]
      RT9["RT9 · Donita · gym pins"]
    end
    subgraph justinD ["Justin"]
      RT5["RT5 · Justin · pin labels"]
      G1["G1 · Justin · guardian page"]
      J3["J3 · Justin · QR on ticket"]
    end
    subgraph ayenD ["Ayen"]
      A4["A4 · Ayen · step away and enrolled"]
      A3["A3 · Ayen · pitch and demo script"]
      RT8["RT8 · Ayen · Find your classes"]
      A2["A2 · Ayen · demo check"]
      A5["A5 · Ayen · both modes check"]
      S1["S1 · Ayen · pitch rehearsal"]
      RT10["RT10 · Ayen · alias text"]
    end
    subgraph vivD ["Viv"]
      RT3["RT3 · Viv · map page"]
      RT4["RT4 · Viv · log pin clicks"]
      V3["V3 · Viv · board polish"]
      V2["V2 · Viv · admin desktop"]
      S2["S2 · Viv · README screenshots"]
    end
  end

  subgraph clocks ["Clocks"]
    R2["R2 · all · full dry run"]
    K2["K2 · all · plan said 3:30"]
    m1100["11:00 · all · R2 full dry run"]
    m1230["12:30 · all · code freeze"]
    m1400["2:00 · Troy · S4 submit"]
  end

  subgraph passed ["Day 1 clock passed"]
    R1["R1 · all · dry run"]
    K1["K1 · all · 3:30 checkpoint"]
  end

  F0 --> V1
  F0 --> D1
  F0 --> A1
  F0 --> P0
  T1b --> H0
  T1b --> J1
  T3 --> T4
  T3 --> H1
  T3 --> O1
  D1 --> D3
  D1 --> D2
  A1 --> D2
  V1 --> D2
  V1 --> V3
  V1 --> V2
  A1 --> A4
  J2 --> J3
  P0 --> H2
  L2 --> H2
  L2 --> G1
  H1 --> X1
  H2 --> X1
  T4 --> O1
  O1 --> O2
  T4 --> UP1
  O2 --> X2
  G1 --> X2
  X1 --> A5
  X2 --> A5
  V1 --> W1
  D1 --> W1
  A1 --> W1
  P0 --> W1
  J1 --> W1
  H0 --> W1
  W1 --> A2
  A2 --> R2
  R2 --> m1100
  m1100 --> m1230
  RT1 --> RT2
  RT1 --> RT3
  RT2 --> RT3
  RT3 --> RT4
  RT2 --> RT5
  RT4 --> RT5
  RT2 --> RT7
  RT5 --> RT7
  RT7 --> RT12
  RT3 --> RT8
  A4 --> RT8
  RT8 --> RT12
  RT12 --> m1230
  RT6 --> RT9
  RT3 --> RT9
  RT5 --> RT10
  A3 --> S1
  m1230 --> S1
  m1230 --> S2
  m1230 --> S5
  m1230 --> S4
  S4 --> m1400
  R1 --> K1

  class RT9,RT10,RT11 held
  class m1100,m1230,m1400 mile
```

## Held

- Gym table layout. Unblocks RT9 (Donita). IBM_7734 is the gym photo, not a table layout. docs/plan-room-tba.md.
- At least five real alias examples. Unblocks RT10 (Ayen). The repo has no alias examples. docs/plan-room-tba.md.
- A real lobby plan. Unblocks clearing approximate true on the IBM_7739 floor row. IBM_7739 is a 1st floor directory stand-in. docs/floorplans/ROOM-TBA-PLAN.md. This is not an RT id.
- Library 2F confirmation. Unblocks RT11 (Troy). Catalog titles IBM_7721 as PUP ICT Office 2F. docs/plan-room-tba.md.
- 4F names that contain ?. Unblocks verified true on those RT5 rows. RT5 still pins them and leaves verified false. docs/plan-room-tba.md task RT5. IBM_7741.

## GC summary

📍 IsQolar · Thu 15 Oct, 6 PM
✅ Done
PR 12 is merged. T1b, F0, T3, and T2 are on main. Pages are shells. Seed is 5 tickets. Render /health is still 404.
👉 Your task now
- Troy: Connect the Render Blueprint so GET /health on the public URL returns ok (T4). Clean the three tonight floor images (RT1, taken from Viv). Then the floors file (RT2).
- Donita: Hub laptop (H0), then staff Call next and Mark done (D1), then undo (D3).
- Justin: About 40 simulated tickets (J1), poll last-updated text (P0), printable ticket (J2).
- Ayen: Phone ticket and the Ikaw na, Iskolar! banner (A1). Empty station file (RT6) in parallel.
- Viv: TV board (V1). RT1 moved to Troy.
User journey, after this doc is on main. Do not build the after-Bobathon list in docs/user-journey.md.
- Troy: Skip in the contract (UJ1), then the Skip route (UJ2).
- Donita: State tokens (UJ4) after D2. Staff Skip (UJ3) after UJ2.
- Justin: Guardian copy (UJ5) after G1.
- Ayen: Phone states (UJ6), stay-near copy (UJ7), Live Count of Courses (UJ8), Explore PUP (UJ9).
- Viv: Projector on the board (UJ10) after V1.
⚠️ Render is not connected yet. Gym layout, five real aliases, a real lobby plan, library 2F confirmation, and the 4F ? names stay held.
⏰ 11:00 AM Oct 16, full dry run. Code freeze 12:30 PM. Submit 2:00 PM.
