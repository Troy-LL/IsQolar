# AGENTS.md

Routing guide for Bob and any AI agent working in this repo.
Read this first. Then read the doc that owns the topic you are working on.

## Docs map

- **What it is, how to run it:** [README.md](README.md)
- **One product, users, demo, pitch, out of scope:** [docs/product.md](docs/product.md)
- **Data flow, processes, poll interval, state:** [docs/architecture.md](docs/architecture.md)
- **Shared types and endpoint shapes (the contract):** [src/contract.ts](src/contract.ts)
- **UI design system, tokens, and components (Donita):** [docs/DESIGN-PUP-Enrollment-Queue.md](docs/DESIGN-PUP-Enrollment-Queue.md)
- **Room TBA tasks:** [docs/plan-room-tba.md](docs/plan-room-tba.md)
- **How to clean a plan, place pins, add aliases, validate:** [docs/map-data-guide.md](docs/map-data-guide.md)
- **Floor-plan photos, catalog, transcribed labels:** [docs/floorplans/](docs/floorplans/)
- **Architectural decisions:** [docs/decisions/](docs/decisions/)
  - [001-no-live-ai-lan-only.md](docs/decisions/001-no-live-ai-lan-only.md)
  - [002-polling-over-websockets.md](docs/decisions/002-polling-over-websockets.md)
  - [003-contract-freeze-at-11-15.md](docs/decisions/003-contract-freeze-at-11-15.md)
  - [004-simulated-morning-labeled.md](docs/decisions/004-simulated-morning-labeled.md)
  - [005-online-on-render.md](docs/decisions/005-online-on-render.md)
  - [006-store-interface.md](docs/decisions/006-store-interface.md)
  - [007-room-tba-2d.md](docs/decisions/007-room-tba-2d.md)
- **Team, two-day tasks, and dependency graph (temporary):** [docs/plan.md](docs/plan.md)

## Commands

```bash
npm install       # install dependencies
npm start         # start the server on port 3000
npm run seed      # reset state and load the simulated morning
npm run check     # typecheck, lint, and test — run before every PR
```

Before a PR: `npm run check`.

## Rules for every agent run

- Never make live AI calls or outbound internet requests of any kind.
- Never change [src/contract.ts](src/contract.ts) after 11:15 unless you are the project manager. See [docs/decisions/003-contract-freeze-at-11-15.md](docs/decisions/003-contract-freeze-at-11-15.md).
- Do not create docs/api.md. The contract lives in src/contract.ts.
- Do not edit [docs/DESIGN-PUP-Enrollment-Queue.md](docs/DESIGN-PUP-Enrollment-Queue.md). UI design is owned by Donita.
- One owner per fact. If a fact fits two files, put it in the more specific one and link from the other.
- Never merge a PR or turn on auto-merge. Open the PR and stop.

## Scratch folder

A `scratch/` folder at the repo root is gitignored and safe to use for throwaway files.
Do not link to anything inside `scratch/` from any tracked doc.
