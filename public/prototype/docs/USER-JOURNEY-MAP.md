# IsQolar User Journey Map

**Status:** Draft v0.1 (Oct 15, 2026)
**Scope:** First-year, on-site enrollment at PUP Manila (see PRD v0.3)
**Viewports:** Student, Guardian, Staff, TV Board

---

## 1. Overview

| Viewport | Device | Sections |
|---|---|---|
| Student | Phone | Dashboard, Live Count of Courses, Explore PUP, Profile |
| Guardian | Phone (outside venue) | Dashboard |
| Staff | Laptop or tablet | Dashboard |
| TV Board | TV or projector | Course counts |

---

## 2. Onboarding

| User | Flow |
|---|---|
| Student | Scan venue QR, enter Student Permit, choose Course, get Queue Ticket |
| Staff | Sign in with stall PIN, pick Course Stall |
| Guardian | Enter Student Permit, enter OTP, land on Dashboard |

### Onboarding decisions needed
- **Guardian OTP delivery.** An SMS needs signal, and guardians outside the venue may have little. Suggested: staff capture the guardian's mobile number at check-in and send the OTP there. Keep the share code as a fallback.
- **Staff sign-in.** Not in the original map. Suggested: a per-stall PIN, one console per desk.

---

## 3. Student

### 3.1 Dashboard
- **Updates:** course slots (depends on PRD item O1, see Open Questions)
- **Queue Number (Ticket):** number, people ahead, estimated wait
- **Enrollment Status:** the enrollment steps, with a Requirements Checklist

> Two different checklists. **Requirements Checklist** = documents to bring (useful before arrival). **Enrollment Steps** = the day's stations (useful on the day). Show both, labeled clearly.

### 3.2 Live Count of Courses
A list of courses with the live line count. Tapping a course opens:
- Description
- Offers
- Subjects
- Links

### 3.3 Explore PUP
- PUP Map
- Features: how long each line is
- Number of enrollees (total only)

### 3.4 Profile
- Masked permit number
- Course
- Language (EN | FIL)
- Accessibility settings (see section 7)
- Guardian link management

---

## 4. Guardian

### 4.1 Dashboard
- **Updates:** course slots
- **Child Enrollment Status:** the enrollment steps
- Last updated time is always visible, with a stale warning

**Never shown to a guardian:** ticket number, QR code, permit number, wait estimate.

---

## 5. Staff

### 5.1 Dashboard
- **Course Stall:** the stall this desk runs
- **Ticket Serving, Status:** Call next, Mark done, Hold, Recall, Undo
- **Line Overview:** next tickets in line, and the held list
- **Ticket # Search:** lookup by permit number or ticket number

---

## 6. TV Board

- Per course: the number now being served, and the count of people waiting
- Ticket numbers only. Never names or permit numbers
- Up to four courses per screen, grouped by college row
- Nothing rotates. Every course is always on screen

---

## 7. Accessibility

### 7.1 Deaf and hard of hearing

| Feature | Detail |
|---|---|
| Visual-only cues | Every call shows the gold banner, a vibration pattern and the tab title. Two short pulses = "you're next", three = "your turn" |
| Board audio | If a chime is added (decision D6), it must always come with a visual change. No flashing, to avoid seizure risk |
| Communicate-in-writing mode | Student can flag this at join. The staff console shows a notice and big text cards: "Show your ticket", "Wait here", "Go to Stall X" |
| No voice-only steps | OTP goes by text. Any video has captions |

### 7.2 Vision deficiency (color blindness and low vision)

| Feature | Detail |
|---|---|
| Mark + word + color | Already in the design: every status has all three, never color alone |
| Text size | Up to 200%, set in Profile |
| High-contrast mode | Turns gradients off, uses plain ink on white with thicker borders |
| Show-to-staff mode | The ticket number shown full screen in huge digits |
| Screen reader | Live announcements for "your turn" and position changes |
| Read my status | A button that reads the status aloud with the phone's built-in voice (works offline) |
| Board for blind students | If a chime is added, it should speak the number. Staff see a "guide needed" flag |

### 7.3 Privacy for accessibility data
Disability information is sensitive personal data under the Data Privacy Act of 2012.
- Optional, never required to enroll
- Visible only to the staff at that student's stall
- Never on the board or the guardian page
- Deleted at the end of the day

---

## 8. Mapping to PRD v0.3

| Journey item | PRD |
|---|---|
| Student onboarding, Queue Ticket | S1, S2 |
| Queue number, wait, steps | S2 |
| Course slots | O1 (pending) |
| Live Count of Courses | B1 |
| Guardian Dashboard | G1 (mock), G2 (Next) |
| Staff Dashboard | ST1, ST2, ST3 |
| Line Overview | A1 |
| TV Board | V1 |
| Explore PUP, course details, Profile, accessibility | New, add as Should or Next |

---

## 9. Open questions

1. Could a course run out of slots on the day? If yes, "slots left" leads the Dashboard and the guardian updates (PRD Q1).
2. Where does the guardian OTP go, and who captures the guardian's number?
3. What does "count number" on the TV board mean: number being served, number waiting, or both? Suggested: both.
4. The design file says the student has one page and no tabs. Four sections need a small bottom navigation. Who approves this change, and is the ticket kept above the fold on Dashboard?
5. Where does Course content (Description, Offers, Subjects, Links) come from? Suggested: pup.edu.ph, kept short for the MVP.
6. Does PUP offer a Filipino Sign Language interpreter request, or a priority lane for students with disabilities? This is a PUP policy decision for the registrar.
7. Does the Explore PUP map need to work offline? If yes, it must be a bundled image or SVG.
