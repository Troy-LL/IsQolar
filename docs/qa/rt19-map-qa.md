# RT19 map QA

Tested `http://localhost:3000/map.html` on `origin/troy/rt13-routing` at `9118835` (Search fix: poster room codes, exact wing prefix, sorted results). Phone layout 390×844. Desktop layout 1280×800. No code was changed.

Screenshots are phone captures. Desktop notes below are from on-screen positions at 1280×800.

RT17 (`troy/rt17-floor-svg`, PR #34) merged while this pass was running. This log is rt13 only. It has not been re-run on that branch.

## Top 5 fixes

1. **Blocker.** On a phone, Directions opens in the peek sheet, which hides Next step. The only control left is the unlabeled handle.
2. **Major.** The last step parks the room pin on the bottom edge, so the sheet cuts the pin in half.
3. **Major.** The "Arrive … stairs" chip is under the phone sheet, and on desktop it runs off the right edge.
4. **Major.** "Enter the lobby" and "Walk to the East wing stairs" draw a route a few pixels tall, sitting on the sheet edge.
5. **Major design.** The location chip, floor tabs, and zoom buttons sit on top of wing names, room numbers, and the route pin.

## What worked

- `S` shows "Type a room number, e.g. S513". `S5` lists South wing 5F rooms, eight at a time, sorted from S501. `412` shows Which wing? for E412, N412, and W412. `N412` and `north 412` open N412 on 4F. `Cashier` opens Cashier (S6) on 1F. `gym` opens PUP Gymnasium. `Facility` opens PUP Facility Management Office.
- Floor tabs are 5F, 4F, and 1F. During a route they mark 1F Start and the goal room.
- Searching S508 flies into 5F. Back returns to the campus map. The compass returns the campus to north and then hides.
- The handle cycles the phone sheet: peek 132px, half 422px, full 743px.
- With reduced motion on, the S508 fly-in finished in about 19ms, transitions were 0s, the pin pulse was off, and the 5F plan was visible.
- With `tiles.openfreemap.org` blocked, the page says "The street map needs internet. Search and the floor plans still work." Cashier search and the S508 plan still loaded.
- On desktop the side sheet keeps Next step visible. The peek-hides-Next bug is phone only.

## Functional bugs

### F1. Phone Directions hides Next step

- **Severity:** blocker
- **Steps:** At 390×844, search S508, tap Directions.
- **Expected:** Next step is on screen so the walk can be followed.
- **Actual:** The sheet snaps to peek. Peek hides the step nav, so Next step and Back are not displayed. The current step and Close remain. Tapping the handle once moves to half and shows Next step. Same on N412.
- **Screenshot:** [docs/qa/rt19/phone-s508-step1-peek.png](rt19/phone-s508-step1-peek.png), [docs/qa/rt19/phone-n412-peek-crop.png](rt19/phone-n412-peek-crop.png)

### F2. Last step clips the room pin with the sheet

- **Severity:** major
- **Steps:** From F1, expand the sheet, then Next step through to "Walk to S508" or "Walk to N412".
- **Expected:** The room pin sits in the open map above the sheet.
- **Actual:** On S508 the pin anchor is y=406 and the sheet starts at y=422, so the pin and S508 label are cut by the sheet. On N412 the pin is y=412 and the label row (N406–N418) is sliced in half. Desktop does not do this: the S508 pin sat near the middle of the 1280×800 map (x=818, y=425).
- **Screenshot:** [docs/qa/rt19/phone-n412-step5.png](rt19/phone-n412-step5.png), [docs/qa/rt19/phone-s508-step5-goal.png](rt19/phone-s508-step5-goal.png)

### F3. Arrive chip is off the map

- **Severity:** major
- **Steps:** On the "Go up to 5F" or "Go up to 4F" step, look for the arrival chip.
- **Expected:** "Arrive 5F · East wing stairs by the dome" (or 4F) is readable on the plan.
- **Actual:** The chip exists and is not hidden, but on the phone it is under the half sheet. N412 step 4: chip at x=32, y=456, sheet top y=422. S508 step 4: chip at x=290, y=517, and it also runs off the right edge. On the goal step it is further off (S508 phone: x=687, y=806). Desktop "Go up to 5F": chip at x=1136, width 250, so it ends at x=1386 on a 1280-wide screen. Goal step desktop: x=1495, y=935, fully outside 1280×800.
- **Screenshot:** [docs/qa/rt19/phone-s508-step4-arrive.png](rt19/phone-s508-step4-arrive.png) (the go-up step with no chip on the plan), [docs/qa/rt19/phone-n412-step4.png](rt19/phone-n412-step4.png)

### F4. Lobby walk steps draw a tiny route

- **Severity:** major
- **Steps:** Directions for S508 or N412. Open the sheet and go to "Enter the lobby (1F)", then "Walk to the East wing stairs by the dome".
- **Expected:** A corridor line from the entrance to the east stairs, clear of the sheet.
- **Actual:** The drawn route is a stub. Phone "Walk to the East wing stairs": bounding box 2×16 px at y=404–420, against the sheet at y=422. The east-stair icon is y=405–425, so its bottom is under the sheet. N412 "Enter the lobby": route box 1×7 px. Desktop "Walk to the East wing stairs": 6×42 px. "You are here (entrance)" is readable. The walk is not.
- **Screenshot:** [docs/qa/rt19/phone-s508-step3-stairs.png](rt19/phone-s508-step3-stairs.png)

### F5. Floor tab and sheet disagree

- **Severity:** minor
- **Steps:** Open S508, then tap 4F or 1F before Directions.
- **Expected:** The sheet matches the floor on screen, or it says the room is on another floor.
- **Actual:** The chip and tab switch to 4F or 1F. The sheet still says S508, "5F · South wing".
- **Screenshot:** [docs/qa/rt19/phone-4f.png](rt19/phone-4f.png)

## Design flaws

### D1. Location chip covers WEST WING

- **Severity:** major
- **Steps:** At 390×844, open any room, then tap 4F or 1F so the whole floor fits (zoom 18).
- **Expected:** WEST WING, NORTH WING, EAST WING, and SOUTH WING are readable.
- **Actual:** The maroon "PUP Main Building · 4F" (and · 1F) chip covers WEST WING. The other three wing names are visible. Measured overlap on both floors.
- **Screenshot:** [docs/qa/rt19/phone-4f.png](rt19/phone-4f.png), [docs/qa/rt19/phone-1f-chip.png](rt19/phone-1f-chip.png)

### D2. Floor tabs cover room numbers

- **Severity:** major
- **Steps:** Phone, S508 directions, last step "Walk to S508".
- **Expected:** Room numbers next to the floor stack stay readable.
- **Actual:** The 1F Start tab covers S505 and the next label. Desktop "Go up to 5F" covers the Comfort Room label (label x=1231, floor stack x=1208–1268, y=24–180).
- **Screenshot:** [docs/qa/rt19/phone-s508-step5-goal.png](rt19/phone-s508-step5-goal.png)

### D3. Zoom button covers the route pin

- **Severity:** major
- **Steps:** Phone, N412 directions, "Go up to 4F".
- **Expected:** The stair pin and its label are clear of the zoom buttons.
- **Actual:** The + button sits on the pin and cuts the N4 label. Office labels on the left are clipped ("Adve…", "uty Offic…").
- **Screenshot:** [docs/qa/rt19/phone-n412-step4.png](rt19/phone-n412-step4.png)

### D4. Attribution covers zoom-out

- **Severity:** minor
- **Steps:** Open the campus map at 390×844.
- **Expected:** Zoom out is tappable, and the map credit is readable.
- **Actual:** The credit is two lines, y=804–844, full width. Zoom out is y=784–828, so the credit covers the bottom of the button. The second line is cut ("OpenFreeMa", "OpenStreetMap"). On desktop the credit is one line (height 20) at the bottom left and does not meet the zoom buttons.
- **Screenshot:** [docs/qa/rt19/phone-campus-initial.png](rt19/phone-campus-initial.png)

### D5. Campus names clip at the screen edge

- **Severity:** minor
- **Steps:** Look at the campus map at 390×844.
- **Expected:** Building names that are on screen can be read.
- **Actual:** Names are cut at the edges, including PUP Engineering and Science Research Center, PUP Grandstand, and a stray letter on the left. The compass also sits on a road shield. "Main entrance ?" is the data label, not a drawing error.
- **Screenshot:** [docs/qa/rt19/phone-campus-initial.png](rt19/phone-campus-initial.png)
