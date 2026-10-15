# IsQolar User Journey Map

**Status:** Draft, proposed (Oct 15, 2026). Not yet agreed by the whole team.
**Future ideas:** a short list in section 10. They are not in use.
**Changes in this version:** (1) line order at each step is by queue entry, not ticket number, (2) Skip sends the ticket to the back once and a second miss cancels, with a single time-based stay-near rule, (3) joining needs a venue code so tickets cannot be taken from outside the venue, (4) staff assigned to each course know and set that course's slots, (5) Step 2 is one short line per course desk, the student picks the course after Step 1, and every step's line is ordered by when the student joined it, with place in line and the next three numbers shown so the order is clear, (6) only staff mark a step done, with Accept at the next step and a stuck-ticket reminder as safeguards.
**Scope:** First-year, on-site enrollment at PUP Manila (see PRD v0.3)
**Viewports:** Student, Guardian, Staff, Projector

---

## 1. Overview

IsQolar's core is **where am I in line, and about how long will it take.** Around it, the student can see which courses still have room and read about them.

| Viewport | Device | Sections |
|---|---|---|
| Student | Phone | Dashboard, Live Count of Courses, Explore PUP, Profile |
| Guardian | Phone (outside venue) | Dashboard, Explore PUP |
| Staff | Laptop or tablet | Dashboard |
| Projector | Projector (or TV) at the venue | Now serving and number waiting, for each of the five steps |

### 1.1 Enrollment steps (source of truth)

These are the five enrollment-day steps from PUP SINTA for AY 2026-2027. They replace the placeholder stations in the design file and the README. Every screen reads the steps from data and never hardcodes them.

| Step | Station | What happens |
|---|---|---|
| 1 | Admission | Submit admission documents and entrance credentials |
| 2 | College / Department | **The student picks their course and joins that course's line (usually about 20 or fewer).** Interview, enrollment, program tagging |
| 3 | Medical Services Department | Submit chest X-ray and Health Information Form |
| 4 | Admission and Registration Services Section | Printing of the Registration Card |
| 5 | Identification Card | ID issuance. The last official step |

- **The status is shown as "Step N of 5".** PUP's official procedure has five steps. Medical sub-steps, the scholarship QR banner, the psychological survey with a stamp and COR release were reported by a student and are not official, so they are not counted as steps until PUP confirms them. If the team counts more than five steps, they need PUP's confirmation first (open question 2).
- **The ticket gets its course at Step 2.** Step 1 is one line for everyone. After Step 1 the student picks a course and joins that course's line. A student with no phone tells the course staff, who add the ticket.
- **Line order after Step 1 (decided fix).** The ticket number equals the line order only at Step 1. After the Step 2 interviews, students finish at different times. So every step has its own line, ordered by when the student joined it, which is the moment staff mark the previous step done. The ticket number says who you are and never changes. Place in line says where you are. The phone leads with place in line, and the projector shows the next three numbers in true line order.
- **Before enrollment day (online):** confirm the slot in PUP iApply and download the admission documents. SAR-FORM 1 carries the assigned enrollment date and time. Enrollment is first-come, first-served and PUP does not accommodate students who come earlier than scheduled.
- **Fully enrolled (decided):** the student is fully enrolled once they hold their stamped COR (Certificate of Registration) and the last staff confirm they are good. That confirmation is the staff's Mark done at the last step. If staff undo it, the status goes back to "In progress".
- **Route and Approval Slip (RAS):** the paper slip signed at each station. IsQolar does not replace it. Marking a step done in IsQolar mirrors the signature, it does not replace it.

---

## 2. Onboarding

| User | Flow |
|---|---|
| Student | Scan the venue QR (on printed posters at the entrance, at the check-in desk and on the projector), enter the current venue code and the Student Permit number, get a Queue Ticket. One ticket per permit number. Once they have the ticket they know their place in line |
| Student with no phone | Go to the check-in desk, placed right next to the venue QR, where staff create and print the ticket. The number comes from the same ascending sequence as phone tickets. They can check the projector again any time to see where the line is, or ask staff to look up their ticket |
| Staff | Open the staff page, pick the step and desk this device runs |
| Guardian | Open the link or scan the QR the student shared, land on Dashboard |
| Projector | No sign-in. Open the board page on the host laptop, set it full screen |

### Onboarding decisions needed
- **Guardian access.** A permit number alone is not proof, because classmates and relatives can see it. Suggested, not approved: the student gets a guardian code and QR (on the printed ticket and in Profile) and shares it with their guardian by any chat app. Opening the link proves the student chose that person. Optional second check: the guardian also enters the permit number. The code expires at the end of the day, the student can revoke it, at most two or three guardians per student, wrong attempts are rate-limited. No SMS is needed.
- **Staff sign-in.** Suggested: pick the step and desk, with an optional PIN per desk so a student cannot open the staff page.
- **Permit check.** IsQolar has no list of admitted students, so it cannot check the permit number itself. Suggested: staff check it at Step 1. Preloading the admitted list from the registrar would be stronger but needs PUP to share the data.
- **Joining only at the venue.** Once the app is online, anyone with a permit number could take a ticket from home and become a ghost ticket. Suggested: joining needs a short venue code shown on the projector footer and at the check-in desk. It changes every 15 minutes (to be confirmed). The QR on posters opens the join page, but the page asks for the current code. One ticket per permit number, and staff can remove a ghost ticket.

---

## 3. Student

### 3.1 Dashboard
- **Queue number (ticket):** four digits, for example 0427. It never changes. Numbers are given out in ascending order as tickets are created, on a phone or at the check-in desk. At Step 1 a lower number is ahead. From Step 2 on, the line at each step is ordered by when the student finished the previous step, so ticket numbers on the board will not be in order. People ahead is counted by that order, not by ticket number.
- **Place in line:** "You are 5th in line at Step 3", shown big above the ticket number. After a Step 2 interview the line follows when students finished, so the ticket number is not the order. One line explains it: "Your place in each line follows when you finish the step before, not your ticket number." Filipino (draft): "Ang pwesto ninyo sa bawat pila ay base sa oras ng pagtapos ninyo sa naunang step, hindi sa numero ng ticket."
- **Choosing a course (after Step 1):** the student picks from the list in Live Count of Courses. Each course shows "N slots left · M in line". If the line is longer than the slots left, a warning says to have a second choice ready. If a course fills up while a student is waiting, they get "This course is now full. Please choose another." and keep their original join time in the new line, so they are not pushed back. A student's join time at Step 2 is the moment Step 1 was marked done, not the moment they pick a course (suggested).
- **People ahead and estimated wait:** "**11** ahead of you · about **25** min", for the student's current step. Rounded to 5 minutes, always labeled an estimate.
- **Enrollment status:** "Step 2 of 5", with the five steps from section 1.1. The current one is marked and finished ones are checked.
- **Course slots (updates):** a short line linking to Live Count of Courses, for example "12 of 55 courses still open". Student only. PRD item O1 (confirmed: courses can run out).
- **Stay-near rule,** shown at join and kept on the ticket, one rule tied to time: "You can step away while your wait is more than 30 minutes. When it is 30 minutes or less, be near your step. If you are not there when your number is called, your ticket goes to the back of that step's line. Miss it a second time and it is cancelled. Steps you finished are kept." Filipino (draft): "Maaari po kayong umalis saglit kung higit 30 minuto pa ang paghihintay. Kapag 30 minuto na lang o mas kaunti, pumunta na po malapit sa step ninyo. Kapag wala po kayo pagtawag sa numero ninyo, mapupunta ang ticket sa dulo ng pila ng step na iyon. Kapag wala po kayo sa pangalawang tawag, makakansela ang ticket. Hindi mawawala ang mga natapos ninyong step." The 30 minutes is our own number (open question 9).
- **Second-choice line:** one fixed sentence, no numbers: "Courses can fill, so it's a good idea to have a second choice ready." Filipino (draft): "Maaaring mapuno ang mga kurso, kaya mabuting may pangalawang pagpipilian kayo."
- **Language:** EN | FIL switch in the header.
- **Last updated** time always visible, with a warning if updates stop.

> Two different numbers. **Course slots** = places left in a course. **People ahead** = students in line before you at your current step. They are never mixed on one line.

### 3.2 Student states

| Moment | What the student sees |
|---|---|
| Waiting | The ticket with people ahead and estimated wait |
| Almost | About 30 minutes or less, or 5 or fewer ahead, whichever comes first: "Almost your turn. Be near Step N." A banner and vibration, so a student who stepped away knows to come back |
| Go now | About 10 minutes or less, or 2 or fewer ahead: "Go to Step N now." With nobody ahead: "You're next." |
| Called | A gold banner at the top: "Ikaw na, Iskolar! Go to Step N." The board shows the same number. The page title and vibration carry the call too |
| Finished a step | The step turns done and the ticket shows the next step's line straight away, with place in line and "Go to Step N" |
| Skipped once | "You weren't there when your number was called. You are now at the back of the line for Step N. Please stay near." |
| Cancelled | "Your ticket was cancelled because you weren't there the second time your number was called. Your finished steps are kept. Please go to the help desk." In calm wording, no alarm color |
| Fully enrolled | "You're fully enrolled. Welcome to PUP, Iskolar ng Bayan." Below it: "Possible exits of the PUP Gym" with the list, for information only. Nothing to tap |

- A student cannot cancel their own ticket. If they want to leave, they tell staff, who remove it.
- A student with no phone uses the printed ticket and watches the projector. They can look at it again whenever they like, or ask staff at any desk to look up their ticket number.
- Suggested, not decided: mark printed tickets so staff announce the number aloud and look around longer before skipping, because a student without a phone gets no banner or vibration.

### 3.3 Estimated wait
- One estimate for the current step only. It is the people ahead multiplied by the average service time of the last 10 tickets at that step, with a 3 minute default until there are 10.
- A total time until fully enrolled is not shown (decided). It would need service times for every step.

### 3.4 Live Count of Courses
Shows which courses are still open and how many places are left.

- **Top line:** "Courses open: N of M". N is the number of courses with at least one slot left.
- **List:** grouped by college, alphabetical by full official name, with the acronym beside it. Courses are alphabetical inside each college, shown without the "Bachelor" prefix. The Institute of Technology (iTech) is a separate section after the colleges, labeled "Institute of Technology (iTech) · Diploma". Only diploma programs that first-year students can take are listed. Diploma programs meant for experienced students are left out. The College of Law (Juris Doctor) is not first-year undergraduate and is also left out.
- **Each course row:** the course name, then "N slots left" or "Full".
- **Links:**
  - **Course name** links to PUP's undergraduate programs page, https://www.pup.edu.ph/academic/undergrad, for the course description.
  - **College name** links to PUP's colleges page, https://www.pup.edu.ph/academic/colleges. The iTech section links to https://www.pup.edu.ph/itech/.
  - On Oct 15, 2026 I could not find a separate PUP page for each course or college, only these general pages. If PUP has per-course pages, the exact links go into the colleges and courses file (open question 3).
  - The links need the internet, so they are shown only when the phone is online. On the venue network without internet the course and college names show as plain text. This is an optional extra, so nothing else depends on it.
- **Picking a course:** at Step 2 this same list is how the student picks and joins a course line (see 3.1). Full courses show "Full" and cannot be joined.
- **How slots change:** a slot goes down only when staff confirm the student's course at Step 2. It does not go down when a ticket is created, and a cancelled ticket never takes a slot. The staff assigned to each course know its slots, so they enter the starting number for their course at the start of the day and can correct it.
- **Only the slot numbers are live.** The course list and links are static reference content.
- A college with no first-year course open that day is hidden, not shown empty.
- The real list of colleges and courses must come from the registrar, including which iTech diploma programs are open to first-year students. Until then, the starter file (`pup-colleges-courses-draft.csv`) is a placeholder. Slots are not in that file: the staff assigned to each course enter them at the start of the day.

### 3.5 Explore PUP
- **PUP map**
- **Lines now:** how many are waiting at each of the five steps
- **Number of enrollees:** total only

### 3.6 Profile
- Masked permit number
- Course, shown after it is confirmed at Step 2
- Language (EN | FIL)
- Guardian link management (only if the guardian view is approved)

---

## 4. Guardian

### 4.1 Dashboard
The guardian only needs to know where their student is, what comes next, and when it will be done.

- **Where they are:** "Step 2 of 5 · College interview", with a progress rail of the five steps (done, now, next)
- **Position in line:** "3 people ahead", only at steps that have a queue
- **Almost there:** when the student is close to a step (about 30 minutes or less, or 5 or fewer ahead): "Almost at Step 2 · College interview"
- **Next step:** "Next: Step 3 · Medical"
- **Estimated wait:** "About 25 minutes", labeled as an estimate
- **Enrollment status:** "In progress" until the last staff confirm the student is good and has the stamped COR, then "Fully enrolled" with the time it was confirmed
- **Possible exits of the PUP Gym:** shown as a plain list, for information only. IsQolar does not assign an exit, ask which one the student uses, or show the guardian which one. Student and guardian tell each other which door they mean. The list of exits comes from a separate file still to be provided (open question 12).
- **Last updated** time always visible, with a stale warning

| Student moment | What the guardian sees |
|---|---|
| Waiting for a step | "Waiting at Step N", people ahead, estimate |
| Being served at a step | "At Step N now" |
| Finished a step | "Done with Step N. Next: Step N+1" and the new estimate |
| Skipped once | "Your student was called but was not there. They are now at the back of the line for Step N." |
| Cancelled by staff | "Your student's ticket was cancelled. They should go to the help desk." |
| Last staff confirm | "Fully enrolled", with the time, and the progress rail all done |
| No updates for a while | "Not updating since 10:42". Their place is safe |

**Never shown to a guardian:** ticket number, QR code, permit number. **Not shown to a guardian:** course slots.

### 4.2 Explore PUP
The same as the student's: PUP map, lines now at each step, total enrollees.

The guardian view works only when the guardian is online, so it needs the online mode (Render), not the venue network alone.

---

## 5. Staff

### 5.1 Dashboard
- **Step and desk:** the step this device runs, and the desk letter if the step has more than one desk
- **Now serving:** the ticket being served
- **Actions:** Call next, Mark done, Skip, Undo, Restore, Remove, Accept (steps after Step 1), Change course (Step 2). At the check-in desk only: Create ticket (prints a paper ticket)
- **Who marks a step done:** only staff. The student never marks themselves done, so nobody can skip a step or jump the line. The flow at a desk is Call next (the ticket shows as being served on the staff screen), do the interview or check, sign the Route and Approval Slip, tap Mark done, and tell the student they are done and which step is next. The student's phone changes to the next step's line right away.
- **Accept (suggested):** if staff forgot Mark done, the staff at the next step search the ticket by number or scan the QR and tap Accept. That marks the previous step done and puts the student in this step's line. The join time is estimated as the time they were called at the previous step plus that step's average service time, so they are not pushed back.
- **Stuck ticket reminder (suggested):** if a ticket has been "being served" for about 15 minutes (our guess), the staff screen shows a reminder to finish or skip it.
- **Coming soon (suggested):** at shared steps, how many students are still at the step before, so staff can open another desk early
- **Line overview:** the next tickets in line
- **Search:** lookup by permit number or ticket number
- **At Step 2:** The line is already for one course. Mark done confirms the student in that course, which lowers that course's slots in Live Count of Courses. If the interviewer places the student in a different program, staff tap Change course first. Staff assigned to a course also enter that course's starting slots at the start of the day and can correct them.

### 5.2 Skip replaces Hold
- There is no Hold and no Recall.
- Staff tap **Call next**. If the student is not there, staff tap **Skip**. The first Skip sends the ticket to the **back of that step's line** and the next number is called right away. A second Skip **cancels** the ticket. There is no timer. Staff decide how long to look around.
- A student's finished steps are kept, even after a cancel.
- **Just marked done (suggested):** a student marked done at the previous step has about 5 minutes to walk to this one. Call next passes over them without counting a Skip. The 5 minutes is our guess.
- **Undo** reverses the last action only, for example a wrong Mark done. It also gives back a slot if a Step 2 confirmation is undone.
- **Restore** brings back a cancelled ticket if the student shows up and staff agree. The ticket goes next in line, right after the number being served, so it does not bump the student who was just called. Suggested, to confirm.
- **Remove** takes a ghost or duplicate ticket out of the line (for example a student who left without telling staff). A student cannot remove their own ticket.
- Fairness comes from the stay-near rule in 3.1, not from a countdown.
- **Where a cancelled student goes:** the help desk, where staff decide.

---

## 6. Projector

The one screen everyone in the venue shares. Read from across the room. No touch, no scrolling, no menus.

### 6.1 Display rules
- Drawn for a 1920 x 1080 (16:9) canvas, scaled to fit the projector
- Ticket numbers only. Never names, permit numbers or course names
- All five steps always on screen. Nothing rotates or pages
- Page polls the server every 2 seconds, so a change shows within about 2 seconds
- Both languages paired: "Now serving · Tinatawag na"
- Silent unless a chime is decided later. If a chime is added, every call must also change something visually, with no flashing
- Works on the venue network with no internet

### 6.2 Screen layout

| Area | Shows |
|---|---|
| Header band | "Now serving · Tinatawag na", PUP wordmark, clock |
| Step area | Five columns, one per step, in order 1 to 5 |
| Footer | Venue QR code to join the queue and the current venue code, plus the last-updated indicator in a corner |

```
        Now serving · Tinatawag na

 1 Admission    2 College       3 Medical     4 Reg. Card   5 ID Card
    0412         interview        0388           0361          0340
 18 waiting       0397         9 waiting     6 waiting     4 waiting
                 42 waiting
```

### 6.3 Step card

| Element | Shows |
|---|---|
| Band | Step number and name (and desk letter if the step has more than one desk) |
| Now serving | The ticket number being served, in the largest type on the card |
| Waiting | "N waiting · naghihintay" |
| Next · Susunod | The next three ticket numbers in true line order, so a student can watch their number come up even when numbers are not in order |
| Just-called highlight | Gold fill with "→ Now · Ngayon" on the number just called, until that step calls again |

Step 2 has one line per course desk, which could be about 60 desks, too many to show. Suggested: the Step 2 column shows only the total waiting across all course desks. Each course desk shows its own number on its staff screen. The order is fixed, steps 1 to 5 left to right. It never changes with line length.

### 6.4 Display flow: what changes when something happens

| What happens | What the projector shows |
|---|---|
| Student gets a ticket | Step 1 **waiting** goes up by 1 |
| Staff taps **Call next** | **Now serving** changes to the called ticket and turns gold with "→ Now". That step's waiting goes down by 1. The previous gold clears |
| Staff taps **Mark done** | The ticket leaves this step. The next step's waiting goes up by 1. See open question P1 for what this step's serving number shows |
| Staff taps **Skip** | First time: the ticket goes to the back of that step's line, the next number is called and turns gold, and waiting stays the same (one leaves, one joins). Second time: the ticket is cancelled and waiting goes down by 1 |
| Staff taps **Undo** | The card returns to its previous number and count, within about 2 seconds |
| Step has had no call yet | "—" with "Waiting for first call · Naghihintay" |
| Nobody waiting at a step | Waiting shows 0. The serving number stays as it is |
| Page cannot reach the server | The last known numbers stay on screen. A "Not updating since 10:42" warning shows in the corner after about 60 seconds |
| Server is reachable again | Numbers catch up and the warning clears |

### 6.5 Setup flow (before doors open)
1. Host laptop runs the server
2. Laptop is connected to the projector
3. Open the board page and set it full screen
4. Check: all five steps show, the clock is right, the footer QR scans, the venue code shows and changes
5. Leave it running all day. No one needs to touch it

### 6.6 Projector open questions
- **P1. After Mark done,** should the serving number stay until the next call, or change to "—"? Suggested: "—", so a finished ticket is not shown as still being served.
- **P2. Step 2 on the projector.** About 60 course desks are too many to show. Suggested: show only the total waiting at Step 2. Confirm, or choose another way (for example only the longest lines).
- **P3. Does every step have a line?** The board assumes all five steps have a queue IsQolar tracks. If Step 1, 3, 4 or 5 are open desks, those columns could show only now serving.

---

## 7. Mapping to PRD v0.3

The PRD IDs below were carried over from the earlier map. I have not seen the PRD, so check them.

| Journey item | PRD |
|---|---|
| Student onboarding, Queue Ticket | S1, S2 |
| People ahead, estimated wait, steps | S2 |
| Course slots | O1 (confirmed: courses can run out) |
| Live Count of Courses | B1 |
| Called banner | S6 |
| Guardian Dashboard | G1, G2 |
| Staff Dashboard | ST1, ST2, ST3 |
| Projector | V1 |
| Explore PUP, course links, Profile | New, add as Should or Next |

---

## 8. Build impact

The current README, architecture notes, design file and server use placeholder stations and a stall per course, with a course on each ticket. This map needs:
- a queue per **step**
- a course chosen after Step 1, before the ticket joins the Step 2 line, plus a Change course action for staff
- an Accept action for the next step and a stuck-ticket reminder
- a **Skip** action in place of Hold and Recall: first Skip to the back, second Skip cancels, plus Restore and Remove
- a **venue code** for joining, one ticket per permit number
- a **Create ticket** action at the check-in desk
- line order by queue entry per step, not by ticket number
- place in line per step on the phone, and the next three numbers per step on the projector
- a projector by step
- the confirmed course recorded when Step 2 is marked done, so slots can go down
- slot numbers per course, entered by the staff assigned to each course at the start of the day

This is for the team to reconcile before the screens are built (design file owned by Donita).

---

## 9. Open questions

1. What happens to a student who arrives after their SAR-FORM 1 schedule? PUP has not published a late-arrival rule. Only PUP can answer this.
2. Are the scholarship banner, psychological survey and COR release, which a student reported, official steps? If PUP counts more than five, the status changes to "Step N of M".
3. Course and college links: PUP's undergraduate programs page and colleges page are the only pages found. Does PUP have a page per course?
4. The design file says one page and no tabs. Student has four sections (Dashboard, Live Count of Courses, Explore PUP, Profile) and needs a small bottom navigation. Who approves, and is the ticket kept above the fold on Dashboard?
5. Does the Explore PUP map need to work offline? If yes, it must be a bundled image or SVG.
6. Guardian access: is the student-shared code (section 2) approved, with or without the permit number as a second check?
7. Do Steps 1, 3, 4 and 5 each have a line IsQolar should track? Confirm with someone who knows the venue layout. (Step 2 is one short line per course desk, usually about 20 or fewer.)
8. Who checks the permit number, and where? Suggested: staff at Step 1.
9. The stay-near numbers are our own: be near the step at about 30 minutes or 5 ahead, and go now at about 10 minutes or 2 ahead. We found no published PUP waiting times for the face-to-face steps, so check them against real waits in the first hours of the day and adjust. Early in the day the estimate uses the 3 minute default, so the people-ahead count is the safer backstop.
10. Projector questions P1 to P3 (section 6.6).
11. The Filipino strings are drafts and need a native speaker check.
12. The list of PUP Gym exits, with the name the screens use for each, will come from a separate markdown file that is still to be provided. The student and guardian screens wait on it. It is information only, not tracked.
13. Paper tickets and extra desks (suggested, not decided): mark printed tickets so staff announce the number aloud. Who runs the check-in desk and the help desk, and what can each one do in IsQolar?
14. Venue code: how often should it change, and does the check-in desk also show it? Suggested every 15 minutes, shown on the projector and at the check-in desk.

---

## 10. Future ideas (NOT IN USE)

> **These are ideas for later. They are not part of the current scope, not requirements, and not decided. Do not build them, do not design around them, and do not treat anything below as a fact about how IsQolar works today.** Sections 1 to 9 are the only source of truth.

- Requirements checklist, showing which documents to bring
- Showing how many students are targeting each course, or letting a student pick up to 3 target courses
- Accessibility features
