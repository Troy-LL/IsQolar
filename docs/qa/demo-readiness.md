# Demo readiness

Checked on 16 Oct 2026, 02:54–03:06 UTC+8 (15 Oct 2026, 18:54–19:06 UTC). Browser pane was 870×906 for the Render map pass, then 966×906 for localhost. No code was changed. The local server was already answering, so it was not restarted.

## Health and keep-awake

`GET https://isqolar.onrender.com/health` returned `200` `{"ok":true}` in 516ms.

`GET http://localhost:3000/health` was already `200` `{"ok":true}`. The process is node pid 15284, started 16 Oct 2026 02:15 local, from `C:\Users\admin\bobathon` on `troy/rt13-routing` at `9118835`. That checkout is older than `main` (`519076e`). It has no From picker.

The keep-awake workflow is active and scheduled `*/10 * * * *`. The last run is [schedule run 38761467676](https://github.com/Troy-LL/bobathon/actions/runs/38761467676), success, started 15 Oct 2026 15:34:04 UTC, head `a7d3f99`. The only other run is a manual dispatch at 11:00:20 UTC the same day. At 19:05 UTC that is 3 hours 31 minutes since the last ping, so it has not run within the last hour.

## What worked

On Render (`/map.html`):

- Campus tiles drew. Street labels, the river, and the building footprints were visible. No blank map tile.
- Search `412` opened Which wing? with E412, N412, and W412.
- N412 and S508 flew into a floor image. `main-4f.webp` 569ms, `main-1f-lobby.webp` 403ms, `main-5f.webp` 432ms. The room pin sat on the room.
- Directions for N412 from Main gate: walk 265m to the entrance, enter the lobby, walk to the East wing stairs, go up to 4F, walk to N412. Next step stayed on screen.
- Changing From to PUP Gymnasium rewrote step 1 to "Walk from the PUP Gymnasium to the Main Building entrance ? (294 m)" and redrew the campus line. S508 from the gym used the same outdoor start, then go up to 5F and walk to S508.

On localhost (`/map.html`), the same search, wing list, fly-in, and directions worked for N412 and S508. Plans are the vector drawing, not the photo floors. Tiles were not blank. There is no From control to change.

## Findings

### 1. Keep-awake has not pinged in the last hour

- **Steps:** Open the keep-awake runs on `main`. Compare the latest `schedule` run to the current time.
- **Expected:** A successful run within the last hour. The cron is every 10 minutes.
- **Actual:** Last success is 15:34:04 UTC. Checked at 19:05 UTC. Health was still warm (516ms), so Render had not gone to sleep yet. The next idle stretch has no ping keeping it awake.

### 2. The site root is a 404

- **Steps:** Open `https://isqolar.onrender.com/` and `http://localhost:3000/`.
- **Expected:** The demo opens.
- **Actual:** Both return HTTP 404. Render's page text is `Cannot GET /`. The map is at `/map.html`.

### 3. The live board is blank

- **Steps:** Open `https://isqolar.onrender.com/board.html`.
- **Expected:** The IsQolar Live Board, with the simulated morning.
- **Actual:** The document title is "Board — IsQolar". `#app` is empty and the body text is empty. `poll.js` loads (206ms) and does not draw a board. `phone.html` is the same empty `#app` plus `poll.js`.

### 4. Floor tabs sit on the zoom buttons

- **Severity:** major on the Render map, at 870×906 (under the 900px layout).
- **Steps:** Search `412`, choose N412, or search `S508`. Look at the right edge.
- **Expected:** Each floor name is readable, and zoom sits clear of the floor list.
- **Actual:** The list is 3F, 2F, gym-gf, 2F, 5F, 4F, 1F. Buttons are 48×44. `gym-gf` wraps to two lines. Zoom + (y=337–381) covers 4F (y=328–372). Zoom − covers 1F. On the S508 fly-in, + covers the bottom of the pressed 5F button.
- **Screenshot:** [render-n412-flyin.png](demo-readiness/render-n412-flyin.png), [render-s508-flyin.png](demo-readiness/render-s508-flyin.png)

Localhost at 966px wide only has 5F, 4F, and 1F, and zoom sits at the bottom of the pane, so those three do not collide.

### 5. Opening search clips the From picker

- **Steps:** On Render, at about 870px wide, click the search icon and type `412`.
- **Expected:** From still shows the selected start, and the wing list is readable.
- **Actual:** The wing list is fine (E412, N412, W412). The From pill collapses to the letters "Fro". The search field itself works after the icon click. At 900px and wider the search field stays open.
- **Screenshot:** [render-wing-picker.png](demo-readiness/render-wing-picker.png)

### 6. Most From choices are unconfirmed names

- **Steps:** On Render, open Directions for N412 or S508. Open From and read the options. Choose PUP Gymnasium.
- **Expected:** A demo can pick a known building, and the first step names that start and the entrance.
- **Actual:** The picker has 43 options. 28 contain `?` or "Unnamed", including "PUP Main Building ?" and "Unnamed building ? (way/…)". Choosing PUP Gymnasium does update the route. Step 1 then reads "Walk from the PUP Gymnasium to the Main Building entrance ? (294 m)". The map label "Main entrance ?" is the same mark. The route still draws.
- **Screenshot:** [render-s508-directions.png](demo-readiness/render-s508-directions.png)

### 7. Localhost has no From picker

- **Steps:** Open `http://localhost:3000/map.html`. Search a room and open Directions.
- **Expected:** The same From control as Render, defaulting to Main gate.
- **Actual:** The header is only the search field. Directions always start at the main gate ("Walk from the main gate to the Main Building entrance (265 m)"). The process on port 3000 is `troy/rt13-routing` at `9118835` in `C:\Users\admin\bobathon`, not this repo's `main`. `/health` was already ok, so that process was left running.
- **Screenshot:** [local-campus.png](demo-readiness/local-campus.png), [local-s508-flyin.png](demo-readiness/local-s508-flyin.png)
