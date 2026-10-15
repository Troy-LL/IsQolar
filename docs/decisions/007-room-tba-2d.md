# 007. Room TBA uses 2D floor plans

**Status:** Accepted

## Context

IsQolar is one product. Enrollment day and campus wayfinding share the phone. Wayfinding is Room TBA: search a room or office, land on a pin on the right floor plan. The product story is in [../product.md](../product.md).

An earlier spec, [../floorplans/PUP-3D-Map.md](../floorplans/PUP-3D-Map.md), described a 3D campus model with MapLibre GL JS, a fill-extrusion layer, building footprints from OpenStreetMap, PMTiles, and a service worker. That file is reference only. [../floorplans/ROOM-TBA-PLAN.md](../floorplans/ROOM-TBA-PLAN.md) replaces it.

The contract in [src/contract.ts](../../src/contract.ts) froze at 11:15 AM on October 15, 2026. After that, only the project manager may change it ([003-contract-freeze-at-11-15.md](003-contract-freeze-at-11-15.md)). The frozen types have no room, floor, or office field.

Day 2 can deploy the same Express server to Render ([005-online-on-render.md](005-online-on-render.md)). Render auto-deploys main to a public URL. The app still makes no outbound calls ([001-no-live-ai-lan-only.md](001-no-live-ai-lan-only.md)).

## Decision

Room TBA is 2D floor plan images with SVG pins, served as static files by the existing Express server.

Locations live in static JSON, keyed by station id and stall id where a link exists. They are not a change to `src/contract.ts`. A missing pin shows the station name. The queue still runs.

We set aside the 3D MapLibre plan for four reasons already recorded in the v2 plan:

- Troy prefers a light 2D page.
- The team has real PUP evacuation plans and directories in [../floorplans/](../floorplans/).
- OpenStreetMap has no rooms and no floors for this campus, so a 3D building shell cannot answer "where is this room".
- A new map library is a dependency the hub does not need. Static images and JSON already run on the LAN.

The lobby image `IBM_7739` is a 1st floor directory used as a stand-in. Its floor row stays `approximate: true` until a real lobby plan arrives.

## Consequences

- Runtime files are `public/maps/`, `data/floors.json`, `data/locations.json`, and `data/station-locations.json`. The transcription source is `docs/floorplans/rooms.json` plus `docs/floorplans/catalog.md`. How to fill them is in [../map-data-guide.md](../map-data-guide.md).
- Tasks are RT1 and up in [../plan-room-tba.md](../plan-room-tba.md).
- `npm run check` includes the map validator once RT7 lands. Until then the check is typecheck, lint, and test only.
- Floor plan images on `main` ship to the public Render URL, because Render auto-deploys main. Ask PUP before that merge. The hub can serve the images on the venue LAN before then.
- If the map is not solid by 12:30 PM on Oct 16, remove the map link and the map files. The queue stays.
- Kept from the earlier spec: one product, an isolated module, deep links, safe text insertion, a validator, offline-safe assets, a page that works at 360 px, and attribution. Ask PUP before publishing the plans.
