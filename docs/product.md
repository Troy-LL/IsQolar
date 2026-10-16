# IsQolar

IsQolar is one product for PUP Manila. It gets freshmen through enrollment day in the gym queue, and it is planned to help students get around campus. Campus wayfinding is Room TBA, the reference product, on the same phone as the ticket. The prototype is the front door (`/` opens it). It links to the live map and the chatbot, and those pages link back.

The queue and the map are planned to share one server, one look, and one deploy. Room TBA, once the map page exists, searches a room or office and lands on a pin on a 2D floor plan. See [decisions/007-room-tba-2d.md](decisions/007-room-tba-2d.md).

## Pitch line

The pitch line in [src/contract.ts](../src/contract.ts) is:

> IsQolar shows every freshman where they are in line, when they can step away, and when they're truly done.

Tagline: "Every Iskolar, in the right line."

## Users

- **Freshmen** on enrollment day. A phone ticket shows position, estimated wait, and a checklist. The checklist ends at "You're fully enrolled."
- **Stall staff and interviewers.** They call the next student, mark them done, look up by permit number, and undo a wrong move.
- **Coordinators.** They see which stalls are clogged and the average wait per stall.
- **PUP Manila students** looking up a room or office. A planned "Find your classes" link opens Room TBA on the same phone. That link is not on the phone page yet.

How to run the app is in [README.md](../README.md). Stations, polling, and wait math are in [architecture.md](architecture.md). Look and components are in [DESIGN-PUP-Enrollment-Queue.md](DESIGN-PUP-Enrollment-Queue.md), which Donita owns. That file's four steps (Check-in, Interview, Photo, Documents) are placeholders. The stations the contract uses are check-in, document check, validation, main waiting line, course stall, and enrolled.

## The 3-minute demo

The phone, staff, and board pages are shells today (`public/phone.html`, `public/staff.html`, `public/board.html`). The prototype is the front door (`/` opens it). It links to the live map and the chatbot, and those pages link back. This is the demo to run once those screens are filled in. If the map is not solid by the 12:30 PM cut on Oct 16, stop after the enrolled line. The queue still stands. See [plan-room-tba.md](plan-room-tba.md).

`npm run seed` loads the morning that is in `src/store.ts`: stalls `BSCS-1`, `BSIT-1`, and `BSEE-1`, and 41 simulated tickets on those stalls. The tickets repeat Ana Reyes, Ben Santos, Cara Lim, Dan Cruz, and Eva Tan. Seeded tickets are labeled simulated.

1. **Board (about one minute).** Open the live board on the hub laptop. The header is "IsQolar Live Board". The simulated label is visible. Three stalls, 41 tickets.
2. **Call next (about one minute).** On the phone, open one of those tickets. It is already waiting at its course stall. Staff tap Call next. Within 2 seconds the phone shows "Ikaw na, Iskolar!" and the board shows the new now-serving ticket. Pages poll every 2 seconds.
3. **Find your classes (about one minute).** Staff mark the ticket through to enrolled. The phone shows "You're fully enrolled. Welcome, Iskolar ng Bayan." Then **Find your classes** opens Room TBA. Search a label that is already transcribed, for example "JPIA Office (E500)" on the Main Academic Building 5F plan (`IBM_7742` in [floorplans/rooms.json](floorplans/rooms.json)). The pin for that label shows only after the tonight pin task is done. The lobby plan is the `IBM_7739` directory, marked approximate, until a real lobby plan arrives.

Estimated wait on the ticket follows [architecture.md](architecture.md). The design file's wait note is the look spec.

## Out of scope

- Continuing students, transferees, and graduate students in the enrollment queue. The queue is first-years only.
- A connection to PUP SIS, and payments.
- A native app. Students use a browser, or a printed ticket.
- Live AI at runtime. Bob is development-only. The app makes no outbound calls.
- Guardian outbound sync. `GuardianStatus` is in the contract and is not implemented in the MVP.
- A 3D campus map. The replaced spec is [floorplans/PUP-3D-Map.md](floorplans/PUP-3D-Map.md), kept for reference.
- An `officeId` field on the contract. The contract froze at 11:15 AM on Oct 15, 2026. Locations are static data. See [decisions/007-room-tba-2d.md](decisions/007-room-tba-2d.md).
- Gym pins and station links, until the team supplies the gym table layout.
- Alias strings, until the team supplies at least five real other names. No alias examples are in the repo.
- Publishing floor plan images on the public Render URL before PUP has been asked. See ADR 007.
