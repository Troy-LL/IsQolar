# RT12 map cut

Freeze list for 12:30 PM on Oct 16. Read from main at `953ab23`. What the map still cannot open is in [data-gaps.md](data-gaps.md). This file owns what stays on screen.

Keep the map. A search on 1F, 4F, or 5F lands on a pin. Leave `public/map.html`, the Find your classes link, and the map files in place.

## Smallest hide list

Hide a row when its name contains `?`, when it has no name (the From picker prints `Unnamed building ?`), or when it is the unconfirmed Main Building entrance. Hide no floor. Hide no building that already has an OSM name.

The From picker also appends ` ?` when `heightSource` contains `?`. That mark is an estimated height, or the Main Building floor-count override. Those names stay.

### Entrance

Hide the outdoor label only.

| What | Where | Why |
|---|---|---|
| `Main Building entrance ?` | `data/campus-osm.json` `entrance.label`, the map text `Main entrance ?`, and the Main Building sheet line that repeats it | OSM has no door. The spot is where the walk from the main gate meets the outline. |

Keep the main gate. Its label is `Main gate (OSM entrance=main)` (`node/5740861623`). Keep the walk geometry. On 1F, "You are here" is the directory start, not this outdoor door.

### Rooms

Hide these 20 rows from search, the sheet, and clicks. The floor stays.

| Floor | Id | Label |
|---|---|---|
| 4F | `main-4f-pup-pem-center` | PUP PEM Center? |
| 4F | `main-4f-inst-of-social-history` | Inst. of Social History? |
| 4F | `main-4f-faculty-office-lounge` | Faculty Office/Lounge? |
| 4F | `main-4f-dept-of-advertising-and-public-relations` | Dept. of Advertising and Public Relations? |
| 4F | `main-4f-accenture-ideas-exchange` | Accenture Ideas Exchange? |
| 4F | `main-4f-speech-laboratory` | Speech Laboratory? |
| 4F | `main-4f-training-center` | Training Center? |
| 4F | `main-4f-extension-center` | Extension Center? |
| 4F | `main-4f-student-center` | Student Center? |
| 4F | `main-4f-student-lounge` | Student Lounge? |
| 4F | `main-4f-institutional-planning-office` | Institutional Planning Office? |
| 4F | `main-4f-ou-audio-visual-room` | OU Audio Visual Room? |
| 4F | `main-4f-ou-library` | OU Library? |
| 4F | `main-4f-vacant-room` | Vacant Room? |
| 4F | `main-4f-canteen` | Canteen? |
| 4F | `main-4f-female-toilet-east` | Female toilet? (East) |
| 4F | `main-4f-male-toilet-west` | Male toilet? (West) |
| Gym | `gym-gf-fire-pump-room` | Fire Pump Room? |
| Gym | `gym-gf-maintenance-office` | Maintenance Office? |
| Library 2F | `library-2f-storage-room` | Storage Room (`flag` is `?`; the IBM_7721 label has no `?`) |

`Office (North wing)` on 4F has no `?`. Keep it.

### From choices and buildings

Hide these 11 footprints from the From picker and from the building sheet. Each OSM `name` is empty, so the picker labels them `Unnamed building ?`. Search already skips a building with no name.

| OSM id | heightSource |
|---|---|
| `way/1039537656` | estimate ? (roof only) |
| `way/1039682645` | estimate ? (no height in OSM) |
| `way/1039682646` | estimate ? (no height in OSM) |
| `way/1039682647` | estimate ? (no height in OSM) |
| `way/561324851` | estimate ? (no height in OSM) |
| `way/561440563` | estimate ? (no height in OSM) |
| `way/566155322` | estimate ? (no height in OSM) |
| `way/583440437` | OSM building:levels x 3 m |
| `way/961977254` | estimate ? (no height in OSM) |
| `way/973353305` | estimate ? (roof only) |
| `way/973371607` | estimate ? (roof only) |

## Demo-ready

### Floors

The switcher paints a floor only when `public/map.js` has a webp and an svg. That set is 1F, 4F, and 5F.

| Floor id | Rooms | `?` names | Switcher | Freeze |
|---|---|---|---|---|
| `main-5f` | 74 | 0 | on | Show the floor. |
| `main-1f-lobby` | 25 placed | 0 | on | Show the floor. `approximate` is true because IBM_7739 is a stand-in directory. |
| `main-4f` | 72 | 17 | on | Show the floor. Hide the 17 rooms in the table above. |
| `main-2f` | 68 | 0 | off | Names are confirmed, `start` is set, and the stair note has no `?`. `public/maps/main-2f.jpg` is on disk. The page does not load it. Leave the floor off the switcher. |
| `gym-gf` | 16 | 2 | off | Leave the floor off the switcher. Hide the two `?` rooms. RT9 still waits on the gym table layout. |
| `library-3f` | 30 | 0 | off | Room names have no `?`. The north stair note says unlabeled. Leave the floor off the switcher. It is not a tonight floor. |
| `library-2f` | 24 | 0 in the poster labels | off | Leave the floor off the switcher. RT11 still holds IBM_7721 until the team confirms it is the library. `start` is null. Hide Storage Room only. |

No floor goes on the hide list. 5F has no W501–W520 rows to hide. 4F has no South-wing classroom numbers to hide. Unplaced exits have no pin.

### From choices that stay

Main gate, plus every building that has an OSM name (31). The gate and these fourteen buildings already display with no `?`:

| OSM id | Name |
|---|---|
| `gate` | Main gate |
| `way/330772152` | Apolinario Mabini Shrine |
| `way/131706201` | Charlie Del Rosario Hall |
| `way/330772153` | Museo ni Apolinario Mabini – PUP |
| `way/126342422` | Ninoy Aquino Library and Learning Resource Center |
| `way/1039554051` | PUP Commercial Building |
| `way/961977252` | PUP Engineering and Science Research Center |
| `way/1039682259` | PUP Food Processing and Testing Center |
| `way/583440438` | PUP Gymnasium |
| `way/1178535808` | PUP Laboratory High School |
| `way/330781634` | PUP Millennium Tower |
| `way/1462058112` | PUP Open University System |
| `way/561446416` | PUP Pumping Station |
| `way/741077558` | PUP Souvenir Shop |
| `way/131706205` | Sampaguita Building |

These 17 also stay. The picker prints a trailing ` ?` because `heightSource` contains `?`. The OSM name does not.

| OSM id | Name | heightSource |
|---|---|---|
| `relation/6752508` | PUP Main Building | design override ? (6 floors x 3.2 m; OSM says 11 levels; real floor count unconfirmed) |
| `way/330772144` | Community Building | estimate ? (no height in OSM) |
| `way/330781658` | P.U.P. Ferry Station | estimate ? (no height in OSM) |
| `way/330772178` | PUP Ampitheater | estimate ? (no height in OSM) |
| `way/562503761` | PUP Bahay Pulungan | estimate ? (no height in OSM) |
| `way/176463920` | PUP Campus Development and Maintenance Building | estimate ? (no height in OSM) |
| `way/1462058116` | PUP Facility Management Office | estimate ? (no height in OSM) |
| `way/330772143` | PUP Grandstand | estimate ? (no height in OSM) |
| `way/330772142` | PUP Interfaith Ecumenical Chapel | estimate ? (no height in OSM) |
| `way/176463919` | PUP Nutrition and Food Science Building | estimate ? (no height in OSM) |
| `way/131706215` | PUP Physical Education Building | estimate ? (no height in OSM) |
| `way/330781650` | PUP Printing Press | estimate ? (no height in OSM) |
| `way/330781651` | PUP Property Building and Motorpool Office | estimate ? (no height in OSM) |
| `way/330781628` | PUP Tahanan ng Alumni | estimate ? (no height in OSM) |
| `way/330781626` | PUP Tennis Courts | estimate ? (no height in OSM) |
| `way/330781659` | PUP Visitor Information Center | estimate ? (no height in OSM) |
| `way/330781640` | Student Canteen | estimate ? (roof only) |

Wing labels on the Main Building stay: South Wing, West Wing, North Wing, East Wing.

The three IBM_7737 campus labels that contain `?` (Area 2, Area 3, Alternative Area 1) are not buildings on this map. They stay out of this list. [data-gaps.md](data-gaps.md) owns them.
