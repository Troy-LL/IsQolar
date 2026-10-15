# System

How the running app is wired. A node is either a file or endpoint that exists, or a task id for a page or data file the plans name and the repo does not have yet.

`src/server.ts` serves `public/` as static files and the JSON API. `GET /health` returns `HealthResponse`. Pages that exist today are shells: `public/staff.html`, `public/phone.html`, `public/board.html`. They load `public/poll.js`, which polls every 2 seconds (`ms` defaults to 2000). Nothing in those pages calls `poll` yet.

`getStore()` in `src/store.ts` returns one `MemoryStore` for the process. The LAN hub (`npm run dev`, port 3000 unless `PORT` is set) and the Render service in `render.yaml` are separate processes with separate memory. Render is not connected yet. `healthCheckPath` is `/health` and `SEED` is `"1"`. There is no file persistence (H1).

The dashed line from `data/station-locations.json` is RT9. That task is held until the gym table layout exists. The file itself is RT6, and it maps nothing until then.

`docs/floorplans/rooms.json` is the transcribed labels. `data/floors.json`, `data/locations.json`, and `data/station-locations.json` are not in the repo. The server does not serve a `data/` folder today. RT3 has to make those files reachable on the LAN without changing ticket or stall behavior.

`GuardianStatus` is a type in `src/contract.ts`. `GET /api/guardian/:code` is not in the contract and not in `src/server.ts`. G1 adds the route after L2. `POST /api/admin/seed` is in `src/server.ts` and is not listed in the contract comments.

```mermaid
flowchart LR
  subgraph pages ["Pages"]
    staff["public/staff.html"]
    phone["public/phone.html"]
    board["public/board.html"]
    mapPage["RT3 · public/map.html"]
    adminPage["V2 · admin desktop"]
    guardianPage["G1 · guardian page"]
  end

  poll["public/poll.js · every 2s"]
  server["src/server.ts"]
  store["src/store.ts · MemoryStore"]
  hub["H0 · LAN hub · port 3000"]
  render["T4 · render.yaml · Render"]

  health["GET /health"]
  createTicket["POST /api/tickets"]
  getTicket["GET /api/tickets/:id"]
  listStalls["GET /api/stalls"]
  stallQueue["GET /api/stalls/:stall/queue"]
  callNext["POST /api/stalls/:stall/next"]
  markDone["POST /api/tickets/:id/done"]
  undo["POST /api/tickets/:id/undo"]
  summary["GET /api/admin/summary"]
  seed["POST /api/admin/seed"]
  guardianApi["G1 · GET /api/guardian/:code"]

  rooms["docs/floorplans/rooms.json"]
  floorImages["RT1 · public/maps/"]
  floors["RT2 · data/floors.json"]
  locations["RT5 · data/locations.json"]
  stationLinks["RT6 · data/station-locations.json"]

  staff --> poll
  phone --> poll
  board --> poll
  poll --> server
  mapPage --> floors
  mapPage --> locations
  mapPage --> floorImages
  adminPage --> summary
  adminPage --> listStalls
  guardianPage --> guardianApi
  server --> store
  server --> health
  server --> createTicket
  server --> getTicket
  server --> listStalls
  server --> stallQueue
  server --> callNext
  server --> markDone
  server --> undo
  server --> summary
  server --> seed
  hub --> server
  render --> server
  rooms --> locations
  stationLinks -.-> mapPage
```
