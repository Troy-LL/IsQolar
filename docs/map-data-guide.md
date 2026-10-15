# Map data guide

How to turn a floor-plan photo into a pin on Room TBA. The rules are in [floorplans/ROOM-TBA-PLAN.md](floorplans/ROOM-TBA-PLAN.md) and [decisions/007-room-tba-2d.md](decisions/007-room-tba-2d.md). Tasks are in [plan-room-tba.md](plan-room-tba.md).

`public/map.html` is not in the repo until RT3. `map.html?edit=1` logs clicks only after RT4. The steps below are the ones those tasks implement.

## Files

| File | Role |
|---|---|
| `docs/floorplans/*.JPG` and `library-3F.png` | Source photos. Do not edit these to "fix" a label. |
| `docs/floorplans/rooms.json` | Transcribed labels. 263 rows. Fields: `building`, `floor`, `label`, `kind`, `source`. No `id`, `x`, `y`, or `aliases`. |
| `docs/floorplans/catalog.md` | Which photo is which floor, and which shots are not plans. |
| `public/maps/<floorId>.(jpg\|png)` | Cleaned image the page shows. Added by RT1. |
| `data/floors.json` | One row per floor the page can open. Added by RT2. |
| `data/locations.json` | One row per pin. Added by RT5. |
| `data/station-locations.json` | Station or stall id to location id. Empty until the gym layout exists (RT6, then RT9). |

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

`data/floors.json` is a list of objects with `id`, `building`, `floor`, `label`, `image`, and `approximate`. Copy `building` and `floor` from `rooms.json`. The lobby row is the only tonight row with `approximate: true`.

`data/locations.json` is a list of objects with `id`, `floorId`, `label`, `kind`, `x`, `y`, `aliases`, `source`, and `verified`. Copy `label`, `kind`, and `source` from the matching `rooms.json` row. `floorId` matches a floor `id`. `aliases` is `[]`. `x` and `y` are fractions of the image width and height, from 0 to 1.

`data/station-locations.json` starts empty. It later maps a station or stall id from the contract (`checkin`, `docs`, `validation`, `main`, `stall`, `enrolled`, or a stall id such as `BSCS-1`) to a location `id`. No gym mapping until RT9.

## Place pins with `map.html?edit=1`

1. Start the server (`npm start`) and open `http://localhost:3000/map.html?edit=1`.
2. Switch to the floor you are pinning.
3. Click the spot on the image that matches the label.
4. Read `x` and `y` from the browser console. Both are between 0 and 1.
5. Write those two numbers onto that label's row in `data/locations.json`.

Nothing is saved for you. There is no editor form. A click only logs.

Set `verified` to `false` when the label contains `?`, and when you have not checked the pin against the photo. The validator prints how many rows are still `verified: false`.

## Add an alias

`rooms.json` has no aliases, and this repo has no sample other-names. Leave every `aliases` array empty until the team supplies at least five real other names (task RT10).

When a name is supplied:

1. Find the row whose `label` is the room they meant.
2. Append that exact string to `aliases`.
3. Search can match the alias only after it is on the row.

Do not invent a short name, a nickname, or a translation.

## Run the validator

RT7 adds the check to `npm run check`. Until that task merges, `npm run check` is typecheck, lint, and test, and it does not read map JSON.

After RT7, `npm run check` fails when it finds:

- a duplicate `id`
- a `floorId` that is not in `data/floors.json`
- an `x` or `y` outside 0..1
- a `kind` outside the set above
- an `image` path that is not a file on disk

It also prints the count of `verified: false` rows and the count of labels that contain `?`. Those two counts are a report. A `?` label is allowed to remain. A failure is only the five cases above.

## Lobby stand-in

The Main ground lobby floor is approximate. `IBM_7739` is a directory of the 1st floor, not an evacuation plan of the lobby. Say so with `approximate: true`. Replace that image only when a real lobby plan is in `docs/floorplans/`. Do not draw a lobby that the photos do not show.
