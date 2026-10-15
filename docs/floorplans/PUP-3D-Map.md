# PUP 3D map spec (reference only)

ROOM-TBA-PLAN.md replaces this file. Do not build from it.
The accepted map is 2D floor plans with SVG pins. See [../decisions/007-room-tba-2d.md](../decisions/007-room-tba-2d.md).

The notes below are the earlier 3D spec, kept so the replacement stays traceable. They supersede `AI-INSTRUCTIONS-PUP-Room-Finder.md` (the standalone version).

---

## 1. Mission

The repository (https://github.com/Troy-LL/bobathon) is becoming one web app for **Polytechnic University of the Philippines (PUP)** with two parts:

1. **Enrollment queue**: a queue and checklist system for first-year enrollment after the PUPCET (specified in `PRD-PUP-Enrollment-Queue.md`, if present in the repo).
2. **3D campus map**: a searchable 3D map where students find buildings, rooms, offices and colleges.

**Your task is the 3D map part**, added as a **module that fits the existing project**, not a separate app bolted on the side. The result must feel like one product: same navigation, same styling, same deployment.

The map idea is inspired by Room TBA (https://room-tba.uplb.tools/, a room and building finder for UPLB). Copy the concept only (search, map, offline-friendly cached data). Do **not** copy its code, branding, text or assets.

---

## 2. Phase 0: Inspect the repo before writing code (mandatory)

The repo's contents were **not known** when this file was written. Do not assume its stack. First, discover it:

1. Read `README`, any `PRD*.md`, `docs/`, and contribution notes.
2. Identify: language and framework, package manager, folder layout, routing, templating or component system, CSS approach (Bootstrap, Tailwind, plain CSS, etc.), how data is stored and served, how it runs locally, how it is deployed, and whether it has tests, a linter or CI.
3. Check `git log` and branches to learn the commit style and what is in progress.
4. Write your findings to `docs/INTEGRATION-NOTES.md` (stack, conventions, where the map module will live, the planned routes, and any risks).
5. If something blocks you (for example the repo is empty, or two approaches are equally valid and the choice matters), **stop and ask the human** one clear question. Otherwise proceed.

---

## 3. Integration rules

1. **Follow the existing stack and conventions.** Match its language, folder structure, naming, code style, templating and CSS framework. Reuse its layout, navbar and components.
2. **Do not introduce a new framework, bundler or backend service** unless the repo has none of what the map needs and the human approves. The map data is static files; it must not require a new server.
3. **Isolate the feature.** Put map code in its own folder or module (for example `map/` or the repo's equivalent of a feature folder) and add it through the repo's normal routing. Touch existing files only where integration requires it (navigation link, route registration, shared config).
4. **Do not break existing features.** Run the repo's existing tests, linter and build before and after your changes.
5. **Work on a new branch** (for example `feature/3d-map`) and make small, clearly named commits in the repo's existing commit style.
6. **Add dependencies the way the repo already does** (its package manager). Pin exact versions. If the repo has no package manager, vendor the libraries locally (see Section 4).
7. **Reuse before you add.** If the repo already has auth, roles, config, API helpers, a database or a shared data folder, use them.

---

## 4. Deployment context: assume a possibly offline venue network

The enrollment queue is designed to run on a **local network at the enrollment venue**, where internet access may be slow or missing. Therefore:

- **Do not load JS, CSS or fonts from a CDN.** Install or vendor MapLibre GL JS (and anything else) so it is served by the app itself.
- The **basemap must not depend on the internet.** Preferred: a self-hosted **PMTiles** file for the campus area (add a documented script or instructions to produce it). **Fallback (must always work):** if basemap tiles fail to load, render the extruded buildings over a plain background, with search and info panels fully functional.
- Never point production at `tile.openstreetmap.org`.
- Add a service worker that caches the map module's assets and `data/` files, so the map keeps working offline after the first load, **only if** it does not conflict with an existing service worker in the repo. If one exists, extend it.
- Keep the map payload small (compress GeoJSON, keep the number of buildings to what the campus needs).

---

## 5. Tech for the map module

- **MapLibre GL JS** with a `fill-extrusion` layer for 3D buildings.
- **Data:** building footprints from **OpenStreetMap** (exported via Overpass Turbo) stored as GeoJSON, plus JSON files for rooms, colleges and offices.
- **UI:** use whatever UI approach the repo already uses (if it uses Bootstrap, use Bootstrap components).
- **Keep OSM attribution visible** on the map ("© OpenStreetMap contributors"), plus any tile source credit.

---

## 6. Data integrity rule (most important)

You do **not** know the real PUP campus layout. Do not guess building names, room numbers, floors, heights or coordinates and present them as real.

- All sample data you create must be clearly marked: add `"verified": false` to every record and prefix placeholder names with `[SAMPLE]`.
- Show an "Unverified" badge in the UI for any record where `verified` is not `true`.
- Use `null` for unknown fields. Never fabricate.
- The map center (about lat 14.5978, lng 121.0105, PUP Sta. Mesa) is a **placeholder** the human must verify. Put it in one config constant.
- Build the data pipeline and validator so the human can drop in real data easily.

---

## 7. Data schemas

Store these in the repo's data location (or `map/data/` if there is none).

**`buildings.geojson`**: FeatureCollection of Polygons

```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [[[0,0],[0,0],[0,0],[0,0]]] },
  "properties": {
    "id": "bldg-sample-1",
    "name": "[SAMPLE] Building One",
    "code": "B1",
    "levels": 4,
    "height": 14,
    "collegeId": null,
    "verified": false
  }
}
```

`height` is in meters. If `null`, use `levels * 3.5`, then a default of 10.

**`rooms.json`**

```json
[{ "id": "room-sample-1", "name": "[SAMPLE] Room 101", "buildingId": "bldg-sample-1",
   "floor": 1, "type": "classroom", "collegeId": null, "verified": false }]
```

`type` is one of: `classroom`, `laboratory`, `office`, `library`, `restroom`, `canteen`, `other`.

**`colleges.json`**

```json
[{ "id": "col-sample-1", "name": "[SAMPLE] College of Example", "abbr": "CEX",
   "buildingIds": ["bldg-sample-1"], "verified": false }]
```

**`offices.json`**

```json
[{ "id": "off-sample-1", "name": "[SAMPLE] Registrar", "buildingId": "bldg-sample-1",
   "floor": 1, "hours": null, "verified": false }]
```

Create **5 to 8 sample buildings** with simple rectangular footprints near the placeholder center so the module can be demoed end to end.

---

## 8. Features and acceptance criteria

### F1. 3D map page
- Reachable from the app's main navigation (for example a "Campus Map" link) via the repo's normal routing.
- Opens centered on the campus, pitch about 60°, slight bearing. Rotate, tilt and zoom work on touch and mouse. Include a "reset view" button.
- Buildings render as extruded blocks. Tapping or clicking one selects it (color changes using `feature-state`) and opens the detail panel.
- Attribution is visible.

### F2. Search
- One always-visible search box searching buildings, rooms, colleges and offices (name, code, abbreviation), case-insensitive, debounced about 150 ms, max 10 results grouped by type.
- Selecting a result flies the camera to the building's **polygon centroid**, selects it and opens the panel.
- Friendly "no results" message. Fully keyboard accessible.
- Respect `prefers-reduced-motion` (use `jumpTo` instead of `flyTo`).

### F3. Detail panel
- Bottom sheet on mobile, side panel on desktop.
- Shows name, code, floors, college(s), rooms grouped by floor, offices, and the "Unverified" badge when needed.

### F4. Deep links (important for integration)
- Support a URL such as `/map?building=<id>` or `/map?office=<id>` that opens the map focused on that place.
- Expose one small helper (for example `getMapLink(placeId)`) so other parts of the app can link into the map.
- **Optional, only if the enrollment checklist in the repo has steps tied to offices** (for example "Go to the Registrar"): add a "Show on map" link on those steps using the helper. Do not change the queue logic itself. If the checklist data model has no place reference, add a nullable `officeId` field only after confirming with the human.

### F5. Offline and resilience
- Works with the network off after the first load (basemap aside, see Section 4).
- Shows a small "Offline" indicator when `navigator.onLine` is false.
- Failed fetches, empty datasets and missing files must not crash the page.

### F6. Accessibility and performance
- Semantic HTML, labeled inputs, visible focus, sufficient contrast.
- Everything is reachable through search and lists without using the map itself.
- Usable at 360 px width. No console errors on a clean load.

### Optional (build only if the human asks)
- A class planner (add classes, pick rooms, detect time overlaps, export or import JSON). This is not needed for enrollment and is left out by default.

---

## 9. Build order

1. **Phase 0:** inspect the repo, write `docs/INTEGRATION-NOTES.md`, create the branch.
2. **Scaffold:** add the map route and nav link, install or vendor MapLibre, load the sample data, show extruded buildings.
3. **Data layer and validator.**
4. **Search and detail panel** (F2, F3).
5. **Deep links** (F4).
6. **Offline and local-network readiness** (F5, Section 4).
7. **Accessibility, polish and docs** (F6).

After each phase, run the app and the repo's existing checks. Confirm nothing existing broke before moving on.

---

## 10. Validator requirements

Add a script (in the repo's language or Node, no extra dependencies where possible) that fails with a non-zero exit code and clear messages for:

- Duplicate ids within or across data files
- Rooms, offices or colleges referencing a building id that doesn't exist
- Buildings with no name or invalid polygon geometry
- `height` or `levels` that are not positive numbers (or null)
- Room `type` values outside the allowed list
- It also prints how many records are still `verified: false`

---

## 11. Documentation to deliver

- `docs/INTEGRATION-NOTES.md`: what you found in the repo and how the module plugs in.
- `docs/MAP-DATA-GUIDE.md`: a plain-language guide for a non-expert covering: exporting footprints with Overpass Turbo (query below), cleaning them in geojson.io, collecting room and office data with PUP's permission, estimating heights from floor counts, running the validator, setting `verified: true` only after checking in person, and producing the campus PMTiles file.
- A short section in the main `README` about the map module and how to run it.

Overpass query to include:

```
[out:json][timeout:25];
( way["building"]({{bbox}}); relation["building"]({{bbox}}); );
out body; >; out skel qt;
```

---

## 12. Code quality rules

- Match the repo's style. Small functions, clear names, short comments that explain *why*.
- Escape or use safe text insertion for all data shown in the UI. No unsanitized `innerHTML`.
- Keep the code readable for a developer who is still learning. Prefer simple solutions over clever ones.
- No secrets, API keys or personal data in the repo. The map module collects no personal data.

---

## 13. Legal and ethical notes (put in the docs)

- OpenStreetMap data is under the ODbL licence and requires attribution.
- Ask PUP administration for permission to publish floor plans and internal room data.
- Do not publish restricted or sensitive locations unless PUP approves.

---

## 14. Definition of done

- [ ] `docs/INTEGRATION-NOTES.md` exists and accurately describes the repo
- [ ] Map route and nav link work, in the app's existing look and feel
- [ ] Existing features, tests and build still pass
- [ ] Sample 3D buildings render, and clicking one opens the panel
- [ ] Search finds buildings, rooms, colleges and offices and flies to the result
- [ ] Deep links work, and the `getMapLink` helper exists
- [ ] No CDN dependencies. The app works on a network with no internet (basemap may fall back to a plain background)
- [ ] Validator passes on the sample data
- [ ] All placeholder data is marked `[SAMPLE]` and `verified: false`
- [ ] Attribution is visible
- [ ] Docs are complete

---

## 15. When to stop and ask the human

Ask instead of guessing if:
- You need real PUP building names, room numbers, coordinates or hours
- The repo's stack makes a requirement here impossible or unreasonable
- You would need to change the enrollment queue's logic or data model
- You would need to add a framework, bundler or backend service

Do not add features beyond this spec (indoor floor plans, routing, accounts, admin panels). List them as "future work" in the docs instead.
