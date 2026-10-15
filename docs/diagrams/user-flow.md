# Freshman journey

The phone shows five steps, "Step N of 5". The station value on each step is the `Station` in [src/contract.ts](../../src/contract.ts). The names and the locks are in [../user-journey.md](../user-journey.md).

The server still advances `checkin` → `docs` → `validation` → `main` → `stall` → `enrolled` with `POST /api/tickets/:id/done`. `docs` is not its own step. While the ticket is at `checkin` or `docs`, the rail shows Step 1. Only Step 2 (`stall`) shows place in line and wait. Course is chosen on `POST /api/tickets`.

Call next at the stall is `POST /api/stalls/:stall/next`. The banner is `BRAND.callScreen` (`Ikaw na, Iskolar!`). The enrolled line is `BRAND.enrolledFinal`. Skip is UJ1 and UJ2: the first Skip sends the ticket to the back of that stall line, the second cancels it, and finished steps stay finished.

Explore PUP is the Room TBA map (RT8, RT3, RT5) plus the number waiting at each stall from `GET /api/stalls`. If the map is not in by the 12:30 cut, the journey stops at the enrolled line and the queue stays.

```mermaid
flowchart TD
  join["Check-in · course picked · POST /api/tickets"]
  s1["Step 1 of 5 · Admission · checkin · docs stays on this step"]
  s2["Step 2 of 5 · College / Department · stall · place in line and wait"]
  called["Called · Ikaw na, Iskolar!"]
  skip1["Skipped once · back of that stall line"]
  skip2["Cancelled · finished steps kept"]
  s3["Step 3 of 5 · Medical · validation · no line"]
  s4["Step 4 of 5 · Registration Card · main · no line"]
  s5["Step 5 of 5 · ID · enrolled · You're fully enrolled. Welcome, Iskolar ng Bayan."]
  explore["Explore PUP · Find your classes · waiting count per stall"]
  search["RT3 · search a transcribed label"]
  pin["RT5 · pin on the floor image"]

  join --> s1
  s1 --> s2
  s2 -->|POST /api/stalls/:stall/next| called
  called -->|first Skip| skip1
  skip1 -->|second Skip| skip2
  called -->|Mark done| s3
  s3 --> s4
  s4 --> s5
  s5 --> explore
  explore --> search
  search --> pin
```

The arrows from Step 1 through Step 5 are the rail the student reads. They are not a change to the server's station order. Steps 3 and 4 can be reached before Step 2, because `validation` and `main` still come before `stall`.
