# Data gaps

Rooms, wings, and floors the Room TBA map still cannot open. Explore PUP in [user-journey.md](user-journey.md) is this map. Search and directions read `data/paths.json`. A shape on a floor drawing is clickable only when its id is a room row there. Owners are the task owners in [delegation.md](delegation.md). Nothing below adds a room or a coordinate.

| Room, wing, or floor | What's missing | File | Owner |
|---|---|---|---|
| 5F W501, W502, W503, W504, W505, W506, W507, W508, W509, W510, W511, W512, W513, W514, W515, W516, W517, W518, W519 | `public/maps/main-5f.svg` draws these as `main-5f-w501` through `main-5f-w519`. The IBM_7742 labels in `rooms.json` are E500–E519, N500–N519, S501–S518, and the named offices. Those west codes are not among them, and `data/paths.json` has no matching room, so search and a click do not open them. The placed west label on 5F is Bayan Muna/NNARA/Gabriela Office (W519), a separate office row. | `docs/floorplans/rooms.json` | Justin (RT5). Troy (RT13) adds a `data/paths.json` row only after the label is in that file. |
| 5F W520 | No W520 on the 5F drawing, in the IBM_7742 labels, or in `data/paths.json`. The drawing stops at W519. | `docs/floorplans/rooms.json` | Justin (RT5) |
| 4F South classrooms | No 4F row has `wing` "South wing" and no 4F code starts with S. The south block in `public/maps/main-4f.svg` is room shapes with no `data-room` and no room number. The catalog calls that side of IBM_7741 "South offices?". | `docs/floorplans/rooms.json` | Justin (RT5) |
| 4F wing tags | The 17 IBM_7741 labels that contain `?`, plus Office (North wing), have no `wing` field. Those rows attach to nodes `c-S-0`, `c-S-1`, and `c-S-2`. North, East, and West classrooms on the same floor have `wing`. The drawing has N, E, and W on those room numbers and no wing name on the south block. | `data/paths.json` | Troy (RT13) |
| PUP PEM Center? | The `?` is the partly legible name from IBM_7741. Pinned with `flag` "?". Delegation holds verified true on these 4F names until the poster name is confirmed. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Inst. of Social History? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Faculty Office/Lounge? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Dept. of Advertising and Public Relations? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Accenture Ideas Exchange? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Speech Laboratory? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Training Center? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Extension Center? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Student Center? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Student Lounge? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Institutional Planning Office? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| OU Audio Visual Room? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| OU Library? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Vacant Room? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Canteen? | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Female toilet? (East) | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Male toilet? (West) | Same 4F hold. | `docs/floorplans/rooms.json` | Justin (RT5) |
| Office (North wing) | Label names the North wing. The row has no `wing` field, and its node is `c-S-2`. | `data/paths.json` | Troy (RT13) |
| Main Building entrance | Label is "Main Building entrance ?". The note says OSM has no door on the Main Building, and the spot is where the walk from the main gate meets the outline. The 1F directory calls its You Are Here the East Wing entrance. | `data/campus-osm.json` | Troy (RT14) |
| Main Building floor count | `heightSource` is "design override ? (6 floors x 3.2 m; OSM says 11 levels; real floor count unconfirmed)". | `data/campus-osm.json` | Troy (RT14) |
| Gym plan | `data/floors.json` has `gym-gf` and `data/paths.json` has the IBM_7734 rooms. `public/map.js` loads floor images only for `main-1f-lobby`, `main-4f`, and `main-5f`. There is no gym drawing under `public/maps/`. `data/station-locations.json` does not exist. RT9 stays held until the team supplies the gym table layout. IBM_7734 is the gym photo, not that layout. The journey's gym-exit list (open question 12) has no file yet. | `data/station-locations.json` | Donita (RT9). Ayen (RT6) adds the empty file first. |
| EXIT (front x3) | Unplaced. Reason in `data/paths.json`: not drawn as one spot on this plan. | `data/paths.json` | Donita (RT9) |
| Fire Exit (rear x2) | Unplaced, same reason. | `data/paths.json` | Donita (RT9) |
| Fire Pump Room? | `?` on the IBM_7734 label. Pinned with `flag` "?". | `docs/floorplans/rooms.json` | Donita (RT9) |
| Maintenance Office? | `?` on the IBM_7734 label. Pinned with `flag` "?". | `docs/floorplans/rooms.json` | Donita (RT9) |
| Library 2F | RT11 holds IBM_7721 out of the tonight floors until the team confirms it is the library. The catalog titles that image PUP ICT Office 2F. `data/floors.json` already has `library-2f`, and `public/map.js` does not load a library plan image. `data/stairs.json` notes a stair on the left edge as unclear, marked `?`. The floor `start` is null. | `data/floors.json` | Troy (RT11) |
| Storage Room | `data/paths.json` sets `flag` "?" on library 2F. The IBM_7721 label in `rooms.json` has no `?`. | `data/paths.json` | Troy (RT11) |
| Library 3F | `library-3F.png` has 30 labels and a `library-3f` floor row. It is not a tonight floor. `public/map.js` does not load a library plan image. `data/stairs.json` notes the stair at the north end of the plan as unlabeled, marked `?`. The floor `start` is null. | `data/floors.json` | Troy (RT1 keeps `library-3F.png` out of the tonight images) |
| Office of the University Registrar - Records Retrieval Section (W5) | Unplaced on `main-1f-lobby`. Reason: not drawn as one spot on this plan. | `data/paths.json` | Troy (RT13) |
| EXIT (multiple, each wing end + dome) | Unplaced on `main-4f`. Same reason. | `data/paths.json` | Troy (RT13) |
| Fire Exit (South wing x2) | Unplaced on `main-5f`. Same reason. | `data/paths.json` | Troy (RT13) |
| Area 2 (Obelisk-Parking) 603 pax? | `?` on the IBM_7737 campus label. No delegation task pins the campus overview. | `docs/floorplans/rooms.json` | Troy (RT14 owns the campus map) |
| Area 3 (Lagoon) 495 pax? | Same IBM_7737 `?`. | `docs/floorplans/rooms.json` | Troy (RT14) |
| Alternative Area 1 (294 pax?) | Same IBM_7737 `?`. | `docs/floorplans/rooms.json` | Troy (RT14) |
