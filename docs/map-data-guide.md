# Map data guide

How to turn a floor-plan photo into a pin on Room TBA. The rules are in [floorplans/ROOM-TBA-PLAN.md](floorplans/ROOM-TBA-PLAN.md) and [decisions/007-room-tba-2d.md](decisions/007-room-tba-2d.md). Tasks are in [plan-room-tba.md](plan-room-tba.md).

`public/map.html` was added by RT14 (routing). RT3 and RT4 build on it. `map.html?edit=1` logs clicks only after RT4. The steps below are the ones those tasks implement.

## Files

| File | Role |
|---|---|
| `docs/floorplans/*.JPG` and `library-3F.png` | Source photos. Do not edit these to "fix" a label. |
| `docs/floorplans/rooms.json` | Transcribed labels. 263 rows. Fields: `building`, `floor`, `label`, `kind`, `source`. No `id`, `x`, `y`, or `aliases`. |
| `docs/floorplans/catalog.md` | Which photo is which floor, and which shots are not plans. |
| `public/maps/<floorId>.(jpg\|png)` | Cleaned image the page shows. Added by RT1. |
| `data/floors.json` | One row per floor the page can open. Added by RT2. |
| `data/locations.json` | Not in the repo. Pins are the `rooms` on each floor in `data/paths.json`. |
| `data/station-locations.json` | Station or stall id to location id. Empty until the gym layout exists (RT6, then RT9). |
| `data/stairs.json` | Shared stairwell ids and one `x,y` per floor for each (RT13). |
| `data/paths.json` | Walk graph per floor: corridor nodes, edges, stair and room points (RT13). |
| `data/campus-osm.json` | PUP Main campus outline, building footprints, names and heights, the main gate and the outdoor walk, all from OpenStreetMap (ODbL). Entrance spot and estimated heights are marked `?` (RT14). |

`kind` in the transcription is one of: `room`, `office`, `other`, `cr`, `exit`, `assembly`, `elevator`, `stairs`. The v2 plan spells the same set. An unknown kind fails the validator.

A `?` in a label, building, or floor means the photo was only partly legible. Copy it through. Do not guess the rest.

## Clean an image

1. Start from the source file in `docs/floorplans/`.
2. Straighten it so the walls sit level.
3. Crop to the plan. Keep a legend only when the labels you need are printed on it.
4. Save jpg or png under `public/maps/`. The filename is the floor `id` you will put in `data/floors.json`.

Tonight images, and only these:

| Floor | Source | What to do |
|---|---|---|
| Main Building ground lobby | `IBM_7739.JPG` | This is the Main Academic Building 1st floor directory, 27 labels in `rooms.json`. It is a stand-in. There is no ground-floor evacuation plan of the Main Building in the set. Set `approximate` to `true` on this floor. `IBM_7726` is a different unnamed ground floor. Do not use it as the lobby. |
| Main Building 4F | `IBM_7741.JPG` | Straighten and crop. 39 labels. Labels that contain `?` stay unchecked. The catalog notes the wing orientation is mirrored compared with the 2012 directories (East and West swapped). That note is unresolved. Do not flip the image to "correct" it. |
| Main Building 5F | `IBM_7742.JPG` | Already a good straight-on directory. 76 labels. Still copy it into `public/maps/` so the page has a file to serve. |

Leave these out of tonight:

- `IBM_7734.JPG`, the gym. Held until the table layout exists.
- `IBM_7721.JPG`, library 2F. Unconfirmed. The catalog titles it PUP ICT Office 2F. Building and floor in `rooms.json` are `Ninoy Aquino Learning Resource Center? (ICT Office wing)` and `2F?` (24 rows).
- `library-3F.png`. The plan calls Library (NALRC) 3F Good, and `rooms.json` has 30 rows from this file. `catalog.md` lists that image as present. It is not a tonight floor. Do not add it to `data/floors.json` or `public/maps/` in the tonight tasks.
- Campus overview `IBM_7737.JPG` and legend `IBM_7738.JPG`. Not tonight.
- Extras, not in `rooms.json`: `IBM_7740` (Main 2F), `IBM_7726`.
- Not plans: `IBM_7723`, `IBM_7724`.
- Glare, skip: `IBM_7728`, `IBM_7730`, `IBM_7733`.

## Write the floor and location rows

`data/floors.json` is a list of objects with `id`, `building`, `floor`, `label`, `image`, `approximate`, and `osm`. Copy `building` and `floor` from `rooms.json`. The lobby row is the only tonight row with `approximate: true`. `osm` is the footprint id in `data/campus-osm.json`: every `main-*` row uses `relation/6752508`, `gym-gf` uses `way/583440438`, and `library-2f` and `library-3f` use `way/126342422`.

A floor with a known fit also has `corners`: four `[lng, lat]` points in image order top-left, top-right, bottom-right, bottom-left. They are the oriented bounding box of that footprint's outer ring, in local meters, then converted back to longitude and latitude. For Main, the box axis is the bearing from the South Wing label to the North Wing label in `data/campus-osm.json` (14.1°). `mainBearing` (164.1°) is about 30° off that wing line, so it is not the axis. 4F puts North toward the bottom of the poster, so its up-axis is 194.1° (the northward bearing plus 180). 1F, 2F, and 5F put North to the right, so their up-axis is 284.1°. The same four box corners are stored; only the corner order changes. `gym-gf`, `library-2f`, and `library-3f` leave `corners` unset. Their rings exist, but nothing in the floor data says which way the poster faces.

Pins are the `rooms` on each floor in `data/paths.json`. Each room has `id`, `label`, `kind`, `x`, `y`, and `node`. `x` and `y` are fractions of the image width and height, from 0 to 1. The room `id` matches a node `id` on that floor. There is no `data/locations.json`.

`data/station-locations.json` starts empty. It later maps a station or stall id from the contract (`checkin`, `docs`, `validation`, `main`, `stall`, `enrolled`, or a stall id such as `BSCS-1`) to a location `id`. No gym mapping until RT9.

## Stairs and walk paths

The stairs are in the same physical place on every Main Building floor, so every floor uses the same stairwell ids in `data/stairs.json` (for example `stair-east-dome`). Each floor still stores its own `x,y`, because each floor image is a different poster. The 4F poster is turned compared with 1F and 5F (South is at the top), so match a stairwell by which wing it is in and which end, not by where it sits on the page. Only add a stairwell that is drawn on that plan. If one is missing, leave it out and say so with a `?` in that floor's `notes`.

`data/paths.json` has, per floor, corridor nodes along each wing and around the dome, edges between neighbors, and room and stair points. Each room and stair point links to its nearest corridor node, so a route never cuts through a room. All `x` and `y` values are 0..1 of the image. Room labels come from `rooms.json` only. On 4F the same classroom numbers repeat in every wing, so those rows carry a `wing` field. The route finder (`public/route.js`) goes from the start to the nearest stairwell that exists on both floors, then from that same stairwell to the room. `npm run check` fails if a node is outside 0..1, an edge points at a missing node, or a floor graph is not connected.

A floor that has `corners` and a file at `maps/<floorId>.webp` or `maps/<floorId>.svg` is drawn on that building's footprint in MapLibre: the webp, or the SVG rasterized to a canvas, sits on a dimmed extrusion of that building. Route lines, stairs, and the destination pin use the same corners to turn 0..1 floor coordinates into longitude and latitude. The floor switcher lists only the current building, and only a floor whose SVG exists. `library-2f` stays off while RT11 is held. A floor with no `corners` stays on the separate `#indoor` plan, drawn from this graph: corridors as wide bands, rooms as labeled tiles, stairs as black squares. To move a point, open `map.html?edit=1`, go inside, click the spot, copy the logged `x,y` (already turned back to the poster's 0..1), and edit the JSON. Compare with the poster in `public/maps/` while you do it.

## Outdoor map and licenses

The campus view uses MapLibre GL JS (BSD-3-Clause), served from `node_modules` at `/vendor/maplibre`, with the OpenFreeMap "liberty" style (`https://tiles.openfreemap.org/styles/liberty`, no key). Map data is © OpenStreetMap contributors under ODbL, and the page keeps that credit in the corner at all times. The street map needs internet. Without it the page says so, and search plus the floor plans still work.

`data/campus-osm.json` was cut from OpenStreetMap on Oct 15, 2026: every building whose center is inside the PUP campus area (`way/131706188`), the four Main Building wings (relations `6752506`, `6752507`, `8022786`, `8022788`) and the dome (`way/561433438`). Names are the OSM `name` tags. Heights use OSM `height`, else `building:levels` x 3 m, else 9 m marked `?`. OSM tags the wings with 11 levels, which is taller than the floors we have plans for. The outdoor walk is the shortest path on OSM footways and service roads from the main gate (`node/5740861623`, `entrance=main`). The four wings and the dome are merged into one Main Building shape, each grown by 1.5 m so they read as one solid block; the wing names stay as label points (`wingLabels`). The Main Building height is a design override: 6 floors x 3.2 m = 19.2 m. The real floor count is unconfirmed (OSM says 11 levels). OSM has no door on the Main Building, so the entrance is placed where the OSM walk from the main gate meets the building outline and is marked `?`. To refresh, re-download that area from OpenStreetMap and keep the same rules: no building or name that is not in OSM or on our posters.

## Place pins with `map.html?edit=1`

1. Start the server (`npm start`) and open `http://localhost:3000/map.html?edit=1`.
2. Switch to the floor you are pinning.
3. Click the spot on the image that matches the label.
4. Read `x` and `y` from the browser console. Both are between 0 and 1.
5. Write those two numbers onto that label's room in `data/paths.json`.

Nothing is saved for you. There is no editor form. A click only logs.

A pin that is not confirmed has `flag` set to `?`, including when the label contains `?`. The validator counts those rows, and any row with `verified: false`, as verified false.

## Add an alias

`rooms.json` has no aliases, and this repo has no sample other-names. Leave every `aliases` array empty until the team supplies at least five real other names (task RT10).

When a name is supplied:

1. Find the row whose `label` is the room they meant.
2. Append that exact string to `aliases`.
3. Search can match the alias only after it is on the row.

Do not invent a short name, a nickname, or a translation.

## Run the validator

`npm run check` runs the map check after typecheck, lint, and test. The check reads `data/floors.json`, the rooms in `data/paths.json`, the floor ids in `data/stairs.json`, and the image files named on each floor.

It fails when it finds:

- a duplicate floor `id`, room `id`, node `id` on the same floor, or stair `id` in the shared list
- a floor id on the walk graph, the stair file, or an unplaced row that is not in `data/floors.json`
- an `x` or `y` outside 0..1 on a room, a node, or a stair point
- a room `kind` outside the set above
- an `image`, `imageWebp`, or `poster` path that is not a file on disk

A room `id` that matches that room's node `id` is the link to the walk graph. The same stair `id` on two floors is one stairwell. Neither is a duplicate. Node kinds such as `corridor` and `start` are graph kinds. The kind check applies to rooms.

It prints the count of verified false rows and the count of labels that contain `?`. A verified false row has `verified: false` or a `flag`. Those two counts are a report. A `?` label is allowed to remain. A failure is only the five cases above.

## Lobby stand-in

The Main ground lobby floor is approximate. `IBM_7739` is a directory of the 1st floor, not an evacuation plan of the lobby. Say so with `approximate: true`. Replace that image only when a real lobby plan is in `docs/floorplans/`. Do not draw a lobby that the photos do not show.
