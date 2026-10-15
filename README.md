# IsQolar

**Every Iskolar, in the right line.**

IsQolar shows every freshman where they are in line, when they can step away, and when they're truly done.

A local web app for first-year enrollment at PUP Manila.
It gives each freshman a ticket for their course stall and a live board of every stall.
Staff tap "Call next" at their stall and the board updates for everyone.
It does not add interviewers or make the office faster.
It takes away the guessing and the wasted waiting.

## Who it is for

- **Freshmen** — see your position at your stall, an estimated wait, and a checklist that ends with "You're fully enrolled."
- **Stall staff and interviewers** — call the next student, mark them done, look up by permit number, and undo a wrong move.
- **Coordinators** — see which stalls are clogged and average wait per stall.

## How to run it

**Requirements:** Node 20, npm.

```bash
npm install
npm start
```

The server starts on port 3000.
Open `http://localhost:3000` on the host laptop.
Other devices on the venue LAN open `http://<laptop-ip>:3000`.
Check the server is up: `GET /health` returns `{"ok":true}`.

### Load the simulated morning

```bash
npm run seed
```

This resets all state and loads a simulated enrollment morning.
Every ticket created by the seed is labeled **simulated**.

## Stations (in order)

1. Check-in
2. Document check
3. Validation
4. Main waiting line
5. Course stall (grouped by department, 1 or 2 interviewers, second document check)
6. You're fully enrolled

See [docs/architecture.md](docs/architecture.md) for data flow between stations.

## Limits

- Designed for 200 to 300 freshmen on one enrollment day.
- Runs on localhost or the venue LAN only. No internet is needed or used.
- Pages poll the server every 2 seconds. There is no push or live connection.
- No native mobile app. Students use a browser on their phone or a printed ticket.
- First-year students only. Continuing students, transferees, and graduate students are out of scope.
- Does not connect to PUP's enrollment system (SIS) or handle payments.
- Guardian outbound sync (viewing status from outside the venue) is not in the MVP.

## Contract

The shared data types and endpoint shapes live in [src/contract.ts](src/contract.ts).
The contract was frozen at 11:15 on October 15, 2026.
Only the project manager may change it after that time.
See [docs/decisions/003-contract-freeze-at-11-15.md](docs/decisions/003-contract-freeze-at-11-15.md).
