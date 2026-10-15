# Room TBA for IsQolar: build plan (v2, replaces PUP-3D-Map.md)

## What changed from the 3D plan and why
| 3D plan said | v2 says | Why |
|---|---|---|
| MapLibre 3D extruded buildings from OSM | 2D floor plan images with SVG pins | Troy prefers light 2D. Real PUP evacuation plans exist; OSM has no rooms or floors. No new dependency. |
| Repo stack unknown, write INTEGRATION-NOTES | Stack is known: Node 20, Express, TS via tsx, static `public/` pages, `npm run check` | Skip discovery, read AGENTS.md and plan.md instead. |
| `[SAMPLE]` placeholder data | Real labels from `docs/floorplans/rooms.json` (transcribed from photos, `?` = unsure) | We have real data. Never invent, keep `?` flagged. |
| Indoor floor plans are future work | Indoor floor plans ARE the product | That is the whole point of Room TBA. |
| Add `officeId` to the checklist model | Contract is frozen (11:15 AM Oct 15). Locations live in a static file keyed by station and stall id | A missing pin just shows the station name; the queue never breaks. |
| Service worker, PMTiles | Static JSON + images served by Express, works on the LAN hub as-is | Nothing to tile, no internet needed. |

Kept from the 3D plan: one product (same nav, look, deploy), isolated module, deep links, safe text insertion (no unsanitized innerHTML), validator, offline-safe, 360 px usable, attribution and permission notes.

## Product (one app)
1. Enrollment day: phone ticket shows next station; once the gym layout exists, a gym map pins it.
2. "You're fully enrolled" has a **Find your classes** button that opens Room TBA search on the same phone.
3. Room TBA: search a room or office by any name it goes by, land on a pin on the right floor plan.

## Data
- `public/maps/<floorId>.(jpg|png)`: cleaned, straightened base images.
- `data/locations.json`: `[{ id, floorId, label, kind, x, y, aliases: [], source, verified }]`. `x,y` are 0..1 of the image. `kind` is room, office, cr, stairs, exit, elevator, assembly, other.
- `data/floors.json`: `[{ id, building, floor, label, image, approximate }]`.
- Station link: a separate `data/station-locations.json` mapping station/stall id to a location id. Empty until the gym layout exists.

Source of truth: `docs/floorplans/rooms.json` plus `docs/floorplans/catalog.md`.

## Floors, in priority order
| # | Floor | Source image | Status |
|---|---|---|---|
| 1 | Main Building ground lobby | IBM_7739 (1F directory) | Stand-in, `approximate: true` until a real lobby plan arrives |
| 2 | Main Building 4F | IBM_7741 | Needs straighten and crop; `?` names stay unchecked |
| 3 | Main Building 5F | IBM_7742 | Good |
| 4 | Gym (enrollment venue) | IBM_7734 plus team's table layout | HELD: needs table layout |
| 5 | Library 3F (NALRC) | library-3F.png | Good, clean drawing |
| 6 | Library 2F | IBM_7721 | Unconfirmed it is the library |
| 7 | Campus overview | IBM_7737 + IBM_7738 legend | Good, slightly angled |
Extras later: IBM_7740 (Main 2F), IBM_7726 (unnamed ground floor). Not plans: IBM_7723, 7724. Glare, skip: 7728, 7730, 7733.

## Tonight / held
- Tonight: floors 1 to 3 images and pins for already transcribed labels only.
- Held: gym pins and station links (need layout), alias search content (need 5+ real other names from the team), library 2F.

## Pages
- `public/map.html` + `public/map.js`: floor switcher, image with SVG pin overlay, search box, detail card, deep link `map.html?loc=<id>` and `?floor=<id>`.
- Phone ticket: "Find your classes" link to `map.html`; later, "Show on map" for the current station if a link exists.
- Pin placement: `map.html?edit=1` logs clicked x,y to the console. No editor UI.

## Validator (`npm run check` includes it)
Fails on: duplicate ids, unknown floorId, x/y outside 0..1, unknown kind, image file missing. Prints count of `verified: false` and `?` labels.

## Rules
No em dashes. Never invent rooms, names or aliases. Bob writes most feature code; non-Bob help logged under Troy, never faked in docs/bob-log.md. One task per branch, PR, CI `check` must pass. Ask PUP before publishing floor plans publicly.

## Cut line
If not solid by the 12:30 PM freeze on Oct 16: remove the map link and files; the queue is untouched.
