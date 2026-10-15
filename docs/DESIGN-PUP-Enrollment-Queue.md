# PUP Enrollment Queue design system

**Owner:** TODO.

> **Spec alignment.** This file is the visual source of truth. Where it disagrees with the product spec ([PRD-PUP-Enrollment-Queue.md](PRD-PUP-Enrollment-Queue.md), Draft v0.1), the PRD wins on *behavior* and this file wins on *look*. Known gaps, to resolve before building the affected screen:
>
> 1. **Steps and stations are placeholders** (PRD open question 1). This file uses four: Check-in, Interview, Photo, Documents. The checklist, the board and the dashboard read the list from data; never hardcode a step. TODO: confirm with the registrar.
> 2. **Check-in identifier** (PRD open question 2). Until decided, the join form asks for the permit number, with "Use my name instead" as a quiet link.
> 3. **Guardian view: Must or Next?** PRD section 6 marks S7, G1 and G2 as Must; section 10 puts "Guardian link and status page" in Next. This file designs it now; build order follows section 10 until the team decides. TODO: team.
> 4. **Being called (S6) is only a Should.** The `CallBanner` is designed here anyway, because "it's your turn" is the one message a student must not miss. Without it, the ticket's line changes to "It's your turn" and the board carries the call.
> 5. **Guardian sync path** (PRD open question 3). The guardian page is designed to be read late: the last-updated time is always visible (G3), and stale data says so.
> 6. **PUP's name, colours and seal.** Using them for a pilot needs the university's OK (D4). Until then the header uses the type wordmark only; the official seal is never redrawn.
> 7. **Fonts** must be bundled locally in `fonts/`, because the venue network may have no internet. TODO: add the woff2 files listed under Tokens · Type.


PUP Enrollment Queue · bobathon · v1, the ticket

PUP Enrollment Queue turns enrollment day from a day of guessing into a line you can see. Every incoming freshman gets one **ticket**: one number that follows them from the gym door to "You're fully enrolled". The same number is on their phone, on the paper ticket, on the staff screen and on the "Now serving" board. Two goals decide every screen:

1. **Calm and certain.** Enrollment is a freshman's first real day at PUP. Every screen answers three questions before anything else: *Where am I in line? About how long? What is left?* Nothing hurries, alarms or guesses.
2. **Unmistakably PUP, and minimal.** Maroon and gold on white, generous space, one signature object (the ticket) and nothing decorative. If a screen works with one thing fewer, remove it.

There are six surfaces:

- **Student phone** (`AppHeader`, `QueueTicket`, `StepChecklist`, `CallBanner`, `EnrolledCard`, `GuardianShare`, `LiveStatus`): one scrolling page. The ticket on top, the checklist under it.
- **Printed ticket** (`QueueTicket`, print variant): the same ticket in ink on paper, for students with no phone, no data or a dead battery.
- **Guardian phone** (`GuardianStatus`, `StepChecklist` read-only, `LiveStatus`): progress only, read from outside the venue.
- **Staff station** (`StationConsole`, `ScanPanel`, `CheckInForm`, `Toast`): one station per screen, on a tablet or laptop.
- **Admin dashboard** (`StationTable`, `LiveStatus`): one sentence and one table.
- **Venue display** (`NowServingBoard`): the "Now serving" board on a TV or projector, the one screen everyone shares.

## Principles

1. **One page per person.** Students and guardians never navigate: no menus, tabs, hamburger or back stack. Everything is on one page, in the order they need it. Staff get one station per screen; admins get one table.
2. **The number is the person.** A ticket number looks the same everywhere: four digits, zero-padded, in `num` (`0427`). It never changes during the day.
3. **Three answers above the fold.** On a 360 × 640 phone, the ticket number, the people ahead and the wait are visible without scrolling.
4. **Only the stated palette.** Nine colours, each with one job (see Colour). No new hues, no gradients, no tinted backgrounds.
5. **Maroon is PUP, not danger.** There is no red error colour. Problems are written in `ink` with ▲ and a next step.
6. **Gold means "look here now".** The moment you're called, the number just called on the board, the slowest station on the dashboard. Plus one brand rule under the header. Nothing else is gold.
7. **Status is always mark + word + colour.** Never colour alone. To a red-green colour-blind student, maroon and green look almost the same (1.35 : 1 in simulation).
8. **Estimates look like estimates.** "about 25 min", rounded to 5 minutes. No countdowns, no seconds, no ticking numbers. Early in the day the wait carries an "Early estimate" tag.
9. **Say where to go.** Every call names the station number, the step and the place: "Station 2 · Photo · Gym, Bay B". Never just "Next step".
10. **The phone is a bonus.** Everything a student needs is also on the printed ticket and the board. No screen may be the only place a student can learn they are being called.
11. **Offline by construction.** The app runs on the venue's local network: no CDN fonts, scripts, icons or images. Every live screen shows when it last updated.
12. **Every staff action can be undone,** and nothing is lost when a device restarts.
13. **Show the least.** Shared screens show ticket numbers only. Guardians see progress, never records. Permit numbers are masked everywhere except on staff screens (Data Privacy Act of 2012).

## Content fundamentals

- Every UI string comes from one strings file per language (`en`, `fil`), never hardcoded in a screen. Phones show one language at a time with an **EN | FIL** switch in the header; English is the default (D8). The venue display shows both, paired: "Now serving · Tinatawag na".
- Speak like the ate or kuya at the help desk: plain, short, specific. "You're in line for Photo." "3 ahead of you." "Go to Station 2."
- Lead with the number, then the words: **11** ahead of you · about **25** min.
- Buttons are verbs: **Get my ticket**, **Call next**, **Mark done**, **Share with guardian**, **Print ticket**, **Undo**. Never "OK" or "Submit".
- Waits are "about N min", rounded to 5. Under 5 minutes it is "a few minutes". Never "0 min", never "exactly".
- Count people ahead, not rank: "11 ahead of you", "You're next". Never "Position #12".
- Times are clock times ("10:42 AM"), plus "3 min ago" on live labels. Dates are written out: "October 15, 2026".
- No abbreviations beyond "min", "AM/PM" and the EN | FIL switch. No "est.", "pos.", "stn.", "no.".
- Problems say what happened, then what to do: "We couldn't find permit number ••••345. Check the number, or ask at the check-in desk by the gym door." No "Oops", no "Something went wrong", no error codes.
- The final screen is the only place the copy celebrates: "You're fully enrolled. Welcome to PUP, Iskolar ng Bayan."
- No emoji. Status uses six marks, drawn by `StatusMark`:

| Status | Mark | English · Filipino (draft) | Colour |
|---|---|---|---|
| Not yet | ○ | Not yet · Hindi pa | `ink-soft` ring, `ink-soft` word |
| In line | ● | In line · Nakapila | `maroon` dot, `ink` word |
| Your turn | → | Your turn · Ikaw na | `ink` arrow on a `gold` disc, `ink` word |
| Done | ✓ | Done · Tapos na | `green` mark and word |
| On hold | ‖ | On hold · Naka-hold | `ink` mark and word |
| Problem | ▲ | A sentence: what happened, what to do | `ink` mark and word |

- Filipino strings in this file are drafts. A native speaker on the team checks every one before the pilot. Names, stations and places in examples ("Juan", "Gym, Bay B") are placeholders.

## Colour

Nine colours, each with one job. Maroon and gold are sampled from PUP's own website (see Sources and gaps); the rest are quiet neutrals and one green.

| Name | Hex | Job in the UI | Never |
|---|---|---|---|
| `maroon` | `#880000` | PUP: the header, primary buttons, links, the ● In line mark, the ticket's top band, the station bands on the board | An error or a warning |
| `maroon-deep` | `#5C0000` | Pressed and hovered maroon buttons | Anything at rest |
| `gold` | `#FFCC00` | Look here now: the call banner, the number just called, the slowest station; the 4px brand rule under the header | Text on paper; a signal without its mark and word |
| `green` | `#1B6E3F` | Done: the ✓ mark and word; the fully enrolled card | A button |
| `ink` | `#1F1A1A` | All text, QR codes, ▲ problems, the toast, focus rings on light backgrounds, everything printed | Text on maroon |
| `ink-soft` | `#5E5656` | Secondary text (helper copy, last updated, Not yet steps); borders of inputs and quiet buttons | Headings; any number that matters |
| `line` | `#E2DCD8` | Dividers, card edges, the ticket's tear line | The only edge of an input or button |
| `paper` | `#FFFFFF` | Cards, the ticket, inputs, the board; text on maroon, maroon-deep, green and ink | |
| `shell` | `#F7F4F2` | The page behind the cards on phone, staff and admin screens | Print; the board |

- The page is `shell`; anything you read or act on sits on a `paper` card. That one step is the only layering. Cards have no shadow.
- Maroon owns every main action. Green is a result, never a button: **Mark done** is maroon, and the ✓ it produces is green.
- Gold never carries text by itself on paper (1.5 : 1). Text on a gold fill is `ink`. Every gold area also carries a mark and a word.
- The header is `maroon` with `paper` text and the gold rule beneath. Ink never sits on maroon (1.7 : 1).
- Print is `ink` on `paper` only. Thermal printers have no colour, so every status must survive in black and white.
- Every QR code is `ink` on `paper` with a 4-module quiet zone. Never coloured, never inverted, never on `shell`.

| Pair | Ratio | Use |
|---|---|---|
| `ink` on `paper` | 17.2 : 1 | All text |
| `ink` on `shell` | 15.7 : 1 | Text directly on the page |
| `paper` on `maroon-deep` | 14.4 : 1 | Pressed buttons |
| `ink` on `gold` | 11.4 : 1 | The call banner, the just-called number |
| `paper` on `maroon` | 10.3 : 1 | Header, primary buttons, station bands |
| `maroon` on `paper` | 10.3 : 1 | Links, the ● mark |
| `ink-soft` on `paper` | 7.1 : 1 | Secondary text, input borders |
| `gold` on `maroon` | 6.8 : 1 | The brand rule, focus rings inside the header |
| `ink-soft` on `shell` | 6.5 : 1 | Secondary text on the page |
| `green` on `paper` | 6.3 : 1 | ✓ Done mark and word |
| `paper` on `green` | 6.3 : 1 | The fully enrolled card |
| `ink` on `maroon` | 1.7 : 1 | **Never** |
| `gold` on `paper` | 1.5 : 1 | **Never** text or a lone signal |
| `line` on `paper` | 1.4 : 1 | **Not** an input or button edge; decoration only |

## Type

Two working families, and one face for three letters.

| Role | Face | Family token | Where |
|---|---|---|---|
| Words | Atkinson Hyperlegible Next | `text` | Everything read: headings, sentences, step names, labels, buttons |
| Numbers | Atkinson Hyperlegible Mono | `num` | Everything counted or read out: ticket numbers, people ahead, minutes, clock times, table figures, permit numbers, codes |
| Wordmark | Cinzel | `mark` | The letters "PUP" in the wordmark. Nothing else |

- **The rule:** if someone reads it aloud, compares it or watches it change, it is `num`. Everything else is `text`. A mono face keeps live numbers from shifting as digits change, and Atkinson Hyperlegible is drawn so that look-alike characters (0 and O; 1, l and I) stay distinct on poor screens and from across a room.
- **Wordmark:** "PUP" in Cinzel Bold, then "Enrollment Queue" in `heading-s`, both `paper` on maroon. Cinzel is the heading face on pup.edu.ph; its classical capitals are the PUP accent here, used for those three letters only. Do not draw another mark.
- Headings: `heading-l` 28 (one per screen), `heading-m` 20 (section and card titles), `heading-s` 16 (step names, row titles, status words), `eyebrow` 14 uppercase ("QUEUE NUMBER", "STATION 2"). All Bold.
- Text: `text-m` 18 for sentences on the student and guardian pages, `text-s` 16 for staff, admin and helper copy, `caption` 14 for last-updated lines and tags, `label` 16 Bold for buttons, `label-l` 20 Bold for the staff console's big buttons. **14px is the floor**, everywhere except print.
- Numbers: `ticket-number` 72 on the phone ticket, `num-l` 40 for people ahead and minutes, `num-m` 22 for lists and tables, `num-s` 14 for times and codes; on the board, `board-number` 160 and `board-next` 56.
- Left-aligned, never justified, short lines. Pages still work at 200% browser zoom; only the board scales with the screen.
- All three faces are SIL OFL.

## The ticket

The `QueueTicket` is the brand. It is how the app shows a student, everywhere.

- A `paper` card with `r-ticket` corners and a `hairline` edge. A `maroon` band across the top holds the wordmark and the date.
- "QUEUE NUMBER" in `eyebrow`, then the number in `ticket-number`, `ink`, nothing else beside it.
- The live line under it: **11** ahead of you · about **25** min, for **Station 2 · Photo**.
- A tear line: a dashed `outline` rule in `line`, with two half-circle `notch` cut-outs at the edges where the `shell` page shows through, like a real ticket stub. Below it, the stub: the QR that staff scan and the masked permit number.
- Printed, it is the same ticket in `ink` only: the band becomes the wordmark over a 2px ink rule, and the notches drop out, leaving the dashed line.
- One ticket per student per day. The number never changes, even after a hold.

## Shape, line and space

- **Line:** `hairline` (1px, `line`) for card edges, dividers and table rules; `outline` (2px, `ink-soft`) for inputs, quiet buttons and the ○ ring; `rule-gold` (4px, `gold`) under the header and nowhere else.
- **Shadow:** none on cards. `shadow-float` only under things that float over content: the pinned call banner and the toast.
- **Radius:** `r-s` 6 for inputs and tags, `r-m` 10 for buttons and cards, `r-ticket` 16 for the ticket and the enrolled card, `r-round` for marks.
- **Space:** a 4px base. `space-4` (16) phone gutter and card padding, `space-6` (24) between cards, `space-8` (32) between sections, `space-12` (48) board margins.
- **Layout:** student and guardian pages are one column, at most `col-max` (480px), centred. Staff and admin screens use two columns from `bp-wide` (768px). The board is drawn for 1920 × 1080.
- **Buttons:** primary is `maroon` with a `paper` `label`, `r-m`, at least `tap-min` (48px) tall, full width on phones. Pressed or hovered: `maroon-deep`. Focus: a `focus-width` `ink` ring at `focus-offset`; inside the header the ring is `gold`.
- **Staff buttons** are `tap-staff` (64px) tall. Staff press them hundreds of times a day, often without looking.

## Motion

Only three things move:

- The **call banner** slides down from the top over `move` (200ms) when the student is called.
- A **step's mark** cross-fades from ● to ✓ over `move` when staff mark it done.
- On the board, the **number just called** fades to gold over `move`.

Live numbers (people ahead, minutes, queue lengths) just change: no counting up, no flashing, no spinners. With reduced motion on, all three appear instantly. No skeleton shimmer, bouncing, confetti, auto-advancing slides or loading animations.

### Sound and vibration

- When called, the student's phone vibrates once (200ms, pause 100ms, 200ms) where the browser allows it. No sound: the gym is loud and phones are on silent. iOS Safari does not vibrate, so the banner and the tab title must carry the call on their own.
- While called, the page title reads "(Your turn) PUP Enrollment Queue", so the call shows even in a background tab.
- The board and the staff screens make no sound until D6 is decided.

## Student phone: one page

The student scans the venue QR and lands on the join page: one field, one button. After that, everything is one page, top to bottom:

1. `AppHeader`: the wordmark, EN | FIL.
2. `CallBanner`, only while the student is being called.
3. `QueueTicket` (or `EnrolledCard` once every step is done).
4. `StepChecklist`: every step with its status, ending in "You're fully enrolled".
5. `GuardianShare`: one quiet button, "Share with guardian".
6. `LiveStatus`: "Updated 10:42 AM".

| State | On screen |
|---|---|
| Join · Sumali | The wordmark, "Get your queue ticket" in `heading-l`, a Permit number field, **Get my ticket**, and "Use my name instead" as a quiet link. Under it: "No phone with you? The check-in desk by the gym door can print a ticket." |
| In line · Nakapila | The ticket: "**11** ahead of you · about **25** min, for Station 1 · Interview". The checklist shows ● on that step. |
| Almost · Malapit na | 3 or fewer ahead: the line reads "Almost your turn. Stay near Station 2." With nobody ahead: "You're next." No colour change. |
| Your turn · Ikaw na | The gold `CallBanner` pinned on top: "→ Your turn", "Go to Station 2 · Photo", "Gym, Bay B · Show this ticket". The ticket and its QR stay right below. The banner stays until staff scan the ticket or mark the step. |
| Between steps | The step turns ✓ Done and the ticket shows the next station's line straight away. No screen in between. |
| On hold · Naka-hold | ‖ "You were called at 10:42 AM. Go back to Station 2 and show your ticket; staff will put you back in line." In ink, no colour. |
| Fully enrolled · Enrolled ka na | The green `EnrolledCard` takes the ticket's place at the top. The ticket number and QR stay below it for the exit check; every checklist row is ✓. |
| Problem | ▲ and a sentence in `ink`, in place, next to the field or card it is about. Never a modal, never a page of its own. |

- Until a station has served enough students to estimate (D5), its wait shows the "Early estimate" tag in `caption`.
- The page updates itself. Never ask the student to refresh; if updates stop, `LiveStatus` says so.
- No login, no install, no password. A student who closes the tab gets the same ticket back by scanning the venue QR on the same phone, or by giving their permit number at any station.

## Printed ticket

For students with no phone, no data or no battery (ST3, ST4). Printed at the check-in desk.

- Drawn for an 80mm thermal roll (72mm printable); the same layout fits A6 or a quarter of A4 (D7).
- Top to bottom: the wordmark and date; "QUEUE NUMBER" and the number at 48pt `num` Bold; the QR at 30mm square with its quiet zone; the masked permit number; the steps as a list with an empty box ☐ beside each, so staff can tick by pen if the system goes down; "Watch the Now serving screen for your number."; the guardian code and link.
- `ink` on white only. No gold, no maroon, no grey fills, no white-on-black bands, which print unevenly on thermal paper.
- The student's name is never printed. The masked permit number ties the ticket to its owner.

## Guardian phone

Read from outside the venue, often minutes behind (G1, G2, G3).

1. `AppHeader`.
2. `GuardianStatus`: "Juan's enrollment" (first name only), the current step as one sentence ("● In line for Photo · Station 2") and "2 of 4 steps done".
3. `StepChecklist`, read-only.
4. `LiveStatus`, always showing the time and how old it is: "Updated 10:42 AM · 3 min ago".

- No ticket number, no QR, no permit number, no wait estimate. A guardian's screen must never work as the student's ticket, and a synced estimate would already be wrong.
- Stale: "▲ No new updates since 10:42 AM. This page will catch up when the venue reconnects."
- Fully enrolled: the `EnrolledCard` in guardian wording: "Juan is fully enrolled."

## Staff station

One station per screen, on a tablet or laptop, run by someone after a short briefing (PRD usability).

- **Left column:** the station ("Station 2 · Photo") in `heading-l`, then the one big action. Ready: **Call next** with "42 in line" above it. Serving: the student card (number in `num-l`, full name, permit number, "Called at 10:42 AM") with **Mark done** (primary) and **Hold** (quiet). Under it, **Scan ticket** and a lookup field, "Permit number or name", always visible.
- **Right column:** "In line" with the next five numbers in `num-m`, and "On hold" with a **Recall** button per row.
- One primary button per state. **Call next** is hidden while someone is being served, so a student is never skipped by a double tap.
- A station with several desks runs one console per desk ("Station 2 · Photo · Desk B"); the board shows the desk letter.
- Every action leaves a `Toast` with **Undo**. Steps marked by mistake are undone from the student's checklist, found through lookup (ST7).
- On a laptop, shortcuts are shown on the buttons: N Call next, D Mark done, H Hold, S Scan, U Undo. They are off while a field has focus.

The check-in desk uses the same frame with `CheckInForm` in place of the console: one field, **Create ticket**, a ticket preview, **Print ticket**.

## Admin dashboard

One sentence, one table (A1 to A4).

1. The sentence, in `heading-m`: "Photo is the slowest station: about 18 min average wait, 42 in line."
2. `StationTable`: one row per station, in station order.
3. The day in one line (A3): "**1,204** fully enrolled · **380** in progress · **2,016** not yet arrived".
4. **Download day summary (CSV)**, a quiet button (A4).
5. `LiveStatus`.

- No charts in the MVP and no grid of number tiles. A table is the smallest thing that compares stations.

## Venue display: Now serving

The one screen everyone in the gym shares (V1): a TV or projector at 1920 × 1080, read from across the room.

- `paper` background. A `maroon` header band: "Now serving · Tinatawag na" in `board-title`, the wordmark, and the clock.
- One column per station, at most four per screen. More stations means another screen, never smaller numbers.
- Each column: a `maroon` station band, the number being served in `board-number`, and the next three numbers in `board-next`.
- The number just called sits on a `gold` fill with "→ Now · Ngayon" above it, until that station calls again.
- A footer band: the venue QR with "Scan to join · I-scan para sumali", and "No phone? Go to the check-in desk by the gym door." in both languages.
- Ticket numbers only. Never a name, never a permit number.
- Nothing rotates: no slides, news, ads or video. Every station is always on screen.

## Iconography

- No illustrations, photos or mascots. Space, type and the ticket carry every page.
- A handful of line icons, drawn as inline SVG (no icon font, no CDN): scan, share, copy, print, undo. 24px, 2px stroke, round joins, `currentColor`, always beside a text label. No icon-only buttons.
- The six status marks are inline SVG drawn by `StatusMark`, not typed characters, so they look the same on every phone, never turn into emoji, and print cleanly.
- The PUP seal appears only if the university approves (D4): in the header and on the printed ticket, never redrawn, recoloured or cropped.

## What we do not do

- No colours outside the nine. No gradients, tints, glass, or shadows on cards.
- No red, no alarm states, no "Oops". Problems are ink, ▲ and a next step.
- No countdowns, timers, seconds or ticking numbers.
- No menus, tabs, hamburger, carousel or onboarding slides on the student and guardian pages.
- No modals for students. The only thing that sits over their page is the call banner.
- No green buttons. Green is a result.
- No names or permit numbers on a shared screen. No QR on the guardian page.
- No grid of identical number tiles; one sentence, one table.
- No emoji, no stock photos, no mascots, no redrawn seal.
- No CDN anything. If it isn't in the build, it isn't on the screen.
- No staff action without Undo.

**Review every new screen** with four tests:

- **The glance test:** after 3 seconds, a student can say their number, how many are ahead and about how long.
- **The print test:** in black and white, every status still reads, because each has a mark and a word.
- **The removal pass:** take one thing away. If nobody misses it, leave it out.
- **The phone-optional test:** could a student without a phone learn the same thing from the ticket or the board?

## Sources and gaps

- Maroon `#880000` and gold `#FFCC00` were sampled from pup.edu.ph on October 15, 2026: `resources/css/colors/maroon.css` sets links, buttons and bars to `#800`, and `resources/css/style.css` uses `#fc0` as its accent. This is not an official brand guide. If PUP provides one, its values replace these and the contrast table is checked again.
- pup.edu.ph sets headings in Cinzel and body text in Noto Sans. This system keeps Cinzel for the letters "PUP" only, and uses Atkinson Hyperlegible Next and Mono for low-end phones and for reading from across a gym.
- Colour-blind check: a simulation (Machado 2009, full severity) puts maroon against green at 1.35 : 1 for deuteranopia and 2.30 : 1 for protanopia. That is why marks and words are never optional.
- Structure follows the Sino design system (`Troy-LL/Sino`, `docs/sino/design-system.md`); no Sino tokens, colours or components were reused.
- Fonts are SIL OFL releases from Fontsource 5.3.0, latin subset: Atkinson Hyperlegible Next 400 and 700, Atkinson Hyperlegible Mono 400 and 700, Cinzel 700.
- Components are specs, not built from code.

---

## Tokens

### Color

| Token | Hex | Usage |
|---|---|---|
| `maroon` | `#880000` | PUP's maroon: header, primary buttons, links, the ● In line mark, the ticket band, board station bands. Paper text on it is 10.3:1; it is 10.3:1 as text on paper. Never an error. |
| `maroon-deep` | `#5C0000` | Pressed and hovered maroon buttons. Paper text 14.4:1. |
| `gold` | `#FFCC00` | Look here now: the call banner, the just-called number, the slowest station's tab, the 4px header rule. Ink text on it is 11.4:1. Never text on paper (1.5:1). |
| `green` | `#1B6E3F` | Done: the ✓ mark and word (6.3:1 on paper) and the enrolled card (paper text 6.3:1). Never a button. |
| `ink` | `#1F1A1A` | All text (17.2:1 on paper), QR codes, ▲, the toast fill, focus rings on light backgrounds, all print. Never on maroon (1.7:1). |
| `ink-soft` | `#5E5656` | Secondary text (7.1:1 on paper, 6.5:1 on shell) and the 2px borders of inputs and quiet buttons. |
| `line` | `#E2DCD8` | Hairline dividers, card edges, the ticket's tear line. Decoration only (1.4:1). |
| `paper` | `#FFFFFF` | Cards, the ticket, inputs, the board; text on maroon, maroon-deep, green and ink. |
| `shell` | `#F7F4F2` | The page behind cards on phone, staff and admin screens. Ink text 15.7:1. |

### Type

| Font file | Source (Fontsource 5.3.0) | Family | Weight |
|---|---|---|---|
| `fonts/AtkinsonHyperlegibleNext-Regular.woff2` | `@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2` | Atkinson Hyperlegible Next | 400 |
| `fonts/AtkinsonHyperlegibleNext-Bold.woff2` | `@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2` | Atkinson Hyperlegible Next | 700 |
| `fonts/AtkinsonHyperlegibleMono-Regular.woff2` | `@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-400-normal.woff2` | Atkinson Hyperlegible Mono | 400 |
| `fonts/AtkinsonHyperlegibleMono-Bold.woff2` | `@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-700-normal.woff2` | Atkinson Hyperlegible Mono | 700 |
| `fonts/Cinzel-Bold.woff2` | `@fontsource/cinzel/files/cinzel-latin-700-normal.woff2` | Cinzel | 700 |

| Family token | Stack |
|---|---|
| `text` | `"Atkinson Hyperlegible Next", system-ui, sans-serif` |
| `num` | `"Atkinson Hyperlegible Mono", ui-monospace, monospace` |
| `mark` | `"Cinzel", Georgia, serif` |

| Style | Font | Size | Line height | Weight | Usage |
|---|---|---|---|---|---|
| `wordmark` | Cinzel | 22px | 1 | 700 | The letters "PUP" in the header, the ticket band and the board (48px there). Letter-spacing 0.04em. |
| `heading-l` | Next | 28px | 1.2 | 700 | One per screen: "Get your queue ticket", "Your turn", the station name on the console. |
| `heading-m` | Next | 20px | 1.3 | 700 | Section and card titles, the call banner's station line, the admin sentence. |
| `heading-s` | Next | 16px | 1.3 | 700 | Step names, row titles, status words, "Enrollment Queue" in the wordmark. |
| `eyebrow` | Next | 14px | 1.3 | 700 | Uppercase labels above a number: QUEUE NUMBER, STATION 2. Letter-spacing 0.06em. |
| `text-m` | Next | 18px | 1.5 | 400 | Sentences on the student and guardian pages. |
| `text-s` | Next | 16px | 1.5 | 400 | Staff and admin copy, helper text, list rows. |
| `caption` | Next | 14px | 1.4 | 400 | Last updated, the Early estimate tag, footnotes. The smallest text on any screen. |
| `label` | Next | 16px | 1.25 | 700 | Button labels. |
| `label-l` | Next | 20px | 1.2 | 700 | Call next, Mark done and Hold on the staff console. |
| `ticket-number` | Mono | 72px | 1 | 700 | The number on the phone ticket. |
| `num-l` | Mono | 40px | 1.1 | 700 | People ahead and minutes on the ticket; the current number on the console. |
| `num-m` | Mono | 22px | 1.2 | 700 | Queue lists, table figures, the admin day line, the guardian code. |
| `num-s` | Mono | 14px | 1.4 | 400 | Clock times, dates, masked permit numbers. |
| `board-title` | Next | 48px | 1.1 | 700 | "Now serving · Tinatawag na". |
| `board-station` | Next | 40px | 1.1 | 700 | Station bands and "→ Now" on the board. |
| `board-number` | Mono | 160px | 1 | 700 | The number being served at each station. |
| `board-next` | Mono | 56px | 1.1 | 700 | The next three numbers per station; the board clock. |

### Spacing

A 4px base.

| Token | Value | Usage |
|---|---|---|
| `tap-min` | `48px` | Minimum height of every button, field and tappable row on student, guardian and admin screens. |
| `tap-staff` | `64px` | Staff console buttons. |
| `space-1` | `4px` | Between a mark and its word. |
| `space-2` | `8px` | Stacked lines in a card; between a label and its field. |
| `space-3` | `12px` | Between buttons; checklist row padding. |
| `space-4` | `16px` | Phone side gutter; card padding. |
| `space-6` | `24px` | Between cards; the staff column gap; enrolled card padding. |
| `space-8` | `32px` | Between sections. |
| `space-12` | `48px` | Board margins and column gaps. |

### Layout

| Token | Value | Usage |
|---|---|---|
| `col-max` | `480px` | Maximum width of the student and guardian pages, centred on larger screens. |
| `bp-wide` | `768px` | Staff and admin screens switch to two columns at this width and up. |
| `board` | `1920 × 1080` | The canvas the venue display is drawn for. Scale to fit; keep 16:9. |

### Radius

| Token | Value | Usage |
|---|---|---|
| `r-s` | `6px` | Inputs and tags. |
| `r-m` | `10px` | Buttons, cards, the toast. |
| `r-ticket` | `16px` | The ticket and the enrolled card. |
| `r-round` | `999px` | Status marks and the gold disc behind →. |
| `notch` | `12px` | Radius of the two half-circle cut-outs at the ticket's tear line. |

### Border

| Token | Value | Usage |
|---|---|---|
| `hairline` | `1px` | `line`: card edges, dividers, table rules. |
| `outline` | `2px` | `ink-soft`: inputs, quiet buttons, the ○ ring. In `line`, dashed: the ticket's tear line. |
| `rule-gold` | `4px` | The gold rule under the header. Nowhere else. |
| `tab` | `6px` | The gold left edge of the slowest station's row. |
| `focus-width` | `3px` | Focus ring: `ink` on light backgrounds, `gold` inside the header. |
| `focus-offset` | `2px` | Gap between an element and its focus ring. |

### Shadow

| Token | Value | Usage |
|---|---|---|
| `shadow-float` | `0 4px 16px rgba(31, 26, 26, 0.18)` | Only the pinned call banner and the toast. Never cards. |

### Motion

| Token | Value | Usage |
|---|---|---|
| `move` | `200ms` | The call banner, a step's ✓, the board's gold. `0ms` with reduced motion. |

---

## Components

### AppHeader

The maroon bar at the top of every phone, staff and admin screen.

**Use** once per screen, at the top. The printed ticket and the board have their own bands.

**The consumer provides** the current language and, on staff and admin screens, the screen's name.

- `maroon` fill, 56px tall, `space-4` side padding, with the `rule-gold` beneath. The wordmark on the left: "PUP" in `wordmark`, "Enrollment Queue" in `heading-s`, both `paper`.
- On the right, **EN | FIL**: `paper` `label` text, the current language underlined and `aria-pressed`; screen readers hear "English" and "Filipino".
- Not sticky. On the student page, only the call banner pins.
- Focus rings inside the header are `gold`.

### QueueTicket

The ticket: one number per student for the whole day. The signature object.

**Use** at the top of the student page, as the preview at the check-in desk, and as the printed ticket.

**The consumer provides** the number, the date, the station and step the student is in line for, the people ahead, the wait in minutes and whether it is still an early estimate, the QR payload and the masked permit number; for print, also the step list and the guardian code.

- `paper` card, `hairline` edge, `r-ticket`, no shadow. A 48px `maroon` band on top with the wordmark and the date in `num-s`, both `paper`.
- "QUEUE NUMBER" in `eyebrow`, the number in `ticket-number`.
- The live line: the count in `num-l` with "ahead of you" in `text-m`; "about" + minutes in `num-l` + "min"; then "for Station 2 · Photo" in `heading-s`. Nobody ahead: "You're next." Called: "It's your turn."
- The tear line: dashed `outline` in `line`, with a `notch` half-circle cut from each side edge.
- The stub: the QR, at least 160px square, and the masked permit number in `num-s`. Under the QR in `caption`: "Turn your screen brightness up when you show this."
- **Print variant:** `ink` only, 72mm wide. The band becomes the wordmark over a 2px ink rule, the notches drop out, the number is 48pt, and the ☐ step list and guardian code are added.
- Never two tickets on one page; never a ticket without its number.

### StatusMark

The six marks with their words. Every status in the app is drawn by this component.

**Use** in checklist rows, staff lists, the guardian page, the board and the admin table.

**The consumer provides** the status (`not-yet`, `in-line`, `your-turn`, `done`, `on-hold`, `problem`) and its word from the strings file.

- Inline SVG, 20px (16px in tables), `space-1` before the word.
- ○ an `outline` ring in `ink-soft`; ● a filled `maroon` dot; → an `ink` arrow on a `gold` `r-round` disc; ✓ a `green` check; ‖ an `ink` pause; ▲ an `ink` triangle.
- The word is always shown. The SVG is `aria-hidden`; the word carries the meaning.

### StepChecklist

Every enrollment step and where the student is, ending in "You're fully enrolled" (S4, S5).

**Use** under the ticket on the student page, read-only on the guardian page, and in staff lookup.

**The consumer provides** the ordered steps from data (name, station number, place), each step's status, and the time each finished step was done.

- One `paper` card, `r-m`, with "Your enrollment steps" in `heading-m` and "2 of 4 done" in `num-s` on the same line. Rows ruled by `hairline`, each at least `tap-min` tall.
- Each row: a `StatusMark`, the step name in `heading-s`, and a second line in `caption`, `ink-soft`: "Station 2 · Gym, Bay B", or "Done at 10:42 AM".
- The current step is not filled or highlighted. Its ● and "In line" carry it; while called, its mark is →.
- The last row is always "You're fully enrolled": ○ until every step is done, then a green ✓.
- No progress bar. The list is the progress.

### CallBanner

"It's your turn": the one message a student must not miss (S6).

**Use** on the student page only, while the student is being called.

**The consumer provides** the station number, the step name, the place and the time called.

- A full-width `gold` band pinned to the top of the viewport, `shadow-float`, `space-4` padding, square corners.
- → and "Your turn" in `heading-l`, "Go to Station 2 · Photo" in `heading-m`, "Gym, Bay B · Show this ticket" in `text-m`, all `ink`.
- It slides in over `move`, the phone vibrates once, and the tab title changes.
- No close button. It goes away when staff scan the ticket or mark the step, or it becomes the On hold line.

### EnrolledCard

The final confirmation (S5).

**Use** at the top of the student page once every step is done, in place of the ticket's top half; on the guardian page in guardian wording.

**The consumer provides** the student's first name, the date and time, and the ticket number.

- `green` fill, `paper` text, `r-ticket`, `space-6` padding.
- A 48px `paper` ✓, "You're fully enrolled" in `heading-l`, "October 15, 2026 · 2:15 PM" in `num-s`, then "Welcome to PUP, Iskolar ng Bayan." in `text-m`.
- The ticket number and QR stay underneath for the exit check.
- No confetti, no animation. Make it look good as a screenshot; students will send it home.

### GuardianShare

How a student links a guardian (S7, G2).

**Use** as a quiet button near the bottom of the student page. The code also appears on the printed ticket.

**The consumer provides** the share link and a 6-character code.

- **Share with guardian** opens an inline panel, not a modal: the link with **Copy** and the phone's share sheet where the browser supports it, the code in `num-m` grouped as "7K3 Q9X", and one sentence: "Your guardian sees your steps, not your details."
- Codes never use look-alike characters (0, O, 1, I, L).

### GuardianStatus

The top of the guardian page (G1).

**Use** only on the guardian page.

**The consumer provides** the student's first name, the current step and status, the steps done and the total.

- "Juan's enrollment" in `heading-l`; the current step as a sentence in `text-m` with its `StatusMark` ("● In line for Photo · Station 2"); "2 of 4 steps done" in `caption`.
- Called: "→ Being called to Station 2 · Photo." On hold: "‖ On hold at Station 2. Juan needs to go back to the station." Done: the `EnrolledCard`, "Juan is fully enrolled."
- No ticket number, QR, permit number or wait.

### LiveStatus

When this screen last heard from the system (G3; PRD reliability).

**Use** at the bottom of the student and guardian pages, and top right on staff, admin and board screens.

**The consumer provides** the last update time and whether updates are arriving.

- Normal: "Updated 10:42 AM" in `caption`, `ink-soft`, the time in `num-s`. The guardian page adds "· 3 min ago".
- Stale (tunable; start at 60 seconds on the venue network and 3 minutes on the guardian page): "▲ Not updating since 10:42 AM" in `ink`. On the student page add: "Your place in line is safe. If this doesn't clear, ask any staff member."
- Never a spinner, never "Connection error".

### Button

**Use** for every action. Labels are verbs from the strings file.

**The consumer provides** the label, and on staff screens the shortcut key.

- **Primary:** `maroon` fill, `paper` `label`, `r-m`, at least `tap-min` tall, full width on phones. Pressed or hovered: `maroon-deep`. One per card.
- **Quiet:** `paper` fill, `ink` label, `outline` `ink-soft` border. For Share with guardian, Hold, Recall, Print again, Download CSV.
- **Link:** `maroon`, underlined, for "Use my name instead".
- **Staff:** `tap-staff` tall with `label-l`; the shortcut key in `num-s` at the right edge.
- Avoid disabled buttons: hide the action, or say why it can't be used yet.
- Focus: a `focus-width` `ink` ring at `focus-offset`; `gold` inside the header.

### StationConsole

The staff screen for one station desk (ST1, ST2, ST5, ST6, ST7).

**Use** on each desk's tablet or laptop.

**The consumer provides** the station number, name and desk, the line, the held list, and the student being served (number, full name, permit number, step, time called).

- **Ready:** "42 in line" in `num-m`, then **Call next**.
- **Serving:** the student card (`paper`, `r-m`): the number in `num-l`, the full name in `heading-m`, the permit number and "Called at 10:42 AM" in `num-s`. **Mark done** (primary) and **Hold** (quiet). **Call next** is hidden until the student is done or held.
- Scanning the called ticket shows "✓ Ticket checked". If the scan doesn't match, it shows "▲ This is ticket 0431, not 0427." with **Serve 0431** and **Keep 0427**.
- Right column: "In line" with the next five numbers in `num-m`; "On hold" with **Recall** per row.
- The lookup field ("Permit number or name") is always visible. A result opens that student's checklist, with **Undo** beside each finished step.
- Every action leaves a `Toast`. Shortcuts on a laptop: N, D, H, S, U; off while a field has focus.

### ScanPanel

The camera viewfinder for ticket QRs (ST2).

**Use** inside the console when staff press **Scan ticket**.

**The consumer provides** the camera stream and what to do with a scanned code.

- An inline panel, not full screen: a square viewfinder with `paper` corner brackets and "Point the camera at the ticket's QR." in `text-s`.
- A good scan closes the panel; the student card shows ✓ Ticket checked.
- No camera, or permission denied: the panel says so in one sentence and moves the cursor to the lookup field. A handheld scanner that types into the lookup field works the same way.

### CheckInForm

Staff-assisted check-in and printing (ST3, ST4).

**Use** at the check-in desk.

**The consumer provides** the lookup results and the created ticket.

- One field, "Permit number or name" (`paper`, `outline` `ink-soft`, `r-s`, `tap-min` tall), and **Create ticket**. A name search returns a short list with masked permit numbers to choose from.
- After creating: the `QueueTicket` preview, **Print ticket** (primary) and **Check in another student** (quiet).
- Already has a ticket: "▲ Permit ••••345 already has ticket 0427 (in line for Photo)." with **Print it again** and **Cancel**.
- Field problems appear under the field, in `ink` with ▲; the typed value stays.

### Toast

What just happened, with a way back (ST7).

**Use** after every staff action.

**The consumer provides** the sentence and the undo action.

- Bottom of the screen, `ink` fill, `paper` `text-s`, `r-m`, `shadow-float`: "Marked 0427 done at Photo." with **Undo** in `paper` Bold, underlined.
- It stays until the next action or until dismissed. It never times out, so Undo is still there when staff look back.
- One at a time; a new action replaces it.

### StationTable

The admin dashboard's one table (A1, A2).

**Use** on the admin dashboard, under the summary sentence.

**The consumer provides** each station's name, people in line, average wait and served count, and which station is slowest.

- A `paper` card, rows ruled by `hairline`. Columns: Station (`heading-s`), In line, Average wait (min), Served today, the figures in `num-m`, right-aligned.
- The column header names the averaging window: "Average wait (last 30 min)" (D5).
- The slowest station gets a `tab` `gold` left edge and "▲ Slowest" after its name. One row at a time.
- Rows stay in station order, so they never jump as numbers change.

### NowServingBoard

The "Now serving" board for the venue display (V1).

**Use** full-screen on a TV or projector, scaled from the 1920 × 1080 canvas.

**The consumer provides** the stations (up to four per screen), each one's current number and next three numbers, which number was called last, the venue join QR and the time.

- `paper` background. A 120px `maroon` header band: "Now serving · Tinatawag na" in `board-title`, the wordmark at 48px, the clock in `board-next`, all `paper`.
- Columns `space-12` apart. Each column: a 72px `maroon` station band ("2 · Photo" in `board-station`, `paper`), the current number in `board-number`, "Next · Susunod" in `eyebrow`, then three numbers stacked in `board-next`.
- The number just called: on a `gold` fill, with "→ Now · Ngayon" in `board-station` above it, until that station calls again.
- A footer band: the venue QR (at least 280px) with "Scan to join · I-scan para sumali", and "No phone? Go to the check-in desk by the gym door." in both languages.
- `LiveStatus` small in a corner, so staff notice if the board stops updating.
- Ticket numbers only. Nothing rotates.

---

## Open decisions

People decide these, not the document. Until decided, build to "Today".

- **D1 · Steps and stations.** Which steps, in what order, and which can run in parallel (PRD open question 1). Today: Check-in, Interview, Photo, Documents, in that order. Every screen reads the step list from data, so changing it changes no design.
- **D2 · Check-in identifier.** Permit number, name or both (PRD open question 2). Today: permit number, with "Use my name instead".
- **D3 · Ticket number format.** Today: four digits, zero-padded, one sequence for the day, no letter prefix. Five digits only if peak day could pass 9,999 students (PRD open question 6).
- **D4 · PUP name, colours and seal.** Who approves their use for the pilot. Today: colours sampled from pup.edu.ph, a type wordmark, no seal.
- **D5 · Wait estimates.** The rolling-average window, when the "Early estimate" tag comes off, and rounding. Today: the last 30 minutes, the tag stays until a station has served 10 students, rounded to 5 minutes.
- **D6 · Sound.** A chime on the board when a number is called; a beep on a good scan. Today: silent; vibration on the student's phone only.
- **D7 · Ticket printer.** An 80mm thermal printer or an ordinary one (A6 or quarter A4). Today: the 80mm layout, which also fits A6.
- **D8 · Languages.** The default language, and whether phone pages should pair both languages like the board. Today: English by default, EN | FIL switch.

### Before shipping, check

- Every pair in the contrast table, with a contrast checker, on the final hex values
- Fonts and status-mark SVGs bundled; the full flow works with the internet unplugged and only the venue network up
- The student page on a real low-end Android phone at 360 × 640: number, people ahead and wait visible without scrolling, and the header wordmark and EN | FIL fit on one line
- The student page at 200% text zoom: nothing cut off or overlapping
- The call banner on Android Chrome (with vibration) and on iOS Safari (without it)
- The ticket QR scanned by the real staff device from a dim phone screen and from a thermal print
- A printed ticket in black and white: every step and status reads
- The board from the back of the real room: the widest four-digit number fits its column at 160px, and every number reads from the farthest seat
- Reduced motion on: the banner, the ✓ and the board's gold appear without movement
- The stale state forced on purpose (unplug the network) on the student, guardian, staff and board screens
- Every string comes from the language files; every Filipino string checked by a native speaker
- No name or permit number on any shared screen; no QR on the guardian page
- Someone who has never seen it runs a station after a short briefing
- Every screen uses only the nine colours, with no tints or gradients

### How the design meets the PRD

| PRD | Requirement | Where it lives |
|---|---|---|
| S1 | Join by venue QR, no install | Join state; the venue QR on the board footer |
| S2 | Queue ticket number | `QueueTicket` |
| S3 | Live position and estimated wait | `QueueTicket` live line, `LiveStatus` |
| S4 | Checklist with per-step status | `StepChecklist`, `StatusMark` |
| S5 | "You're fully enrolled" | `EnrolledCard`; the checklist's last row |
| S6 | Notify when next or called | `CallBanner`, vibration, tab title, "You're next" |
| S7 | Share with a guardian | `GuardianShare` |
| G1 | Read-only current step and progress | `GuardianStatus`, read-only `StepChecklist` |
| G2 | Link by share link or code | `GuardianShare`; the code on the printed ticket |
| G3 | Last-updated time | `LiveStatus` with "N min ago" and the stale state |
| ST1 | Call next | `StationConsole` |
| ST2 | Scan to confirm and complete | `ScanPanel`, `StationConsole` |
| ST3 | Assisted check-in | `CheckInForm` |
| ST4 | Print ticket with number and QR | `QueueTicket` print variant |
| ST5 | Look up by name or permit number | `StationConsole` lookup field |
| ST6 | Skip, recall, hold | Hold and Recall on `StationConsole`; the student's On hold state |
| ST7 | Undo a wrong step | `Toast`; Undo on the looked-up checklist |
| A1 | Average wait per station | `StationTable` |
| A2 | Live queue length per station | `StationTable` |
| A3 | Enrolled, in progress, not yet arrived | The admin day line |
| A4 | CSV day summary | Download day summary (CSV) |
| V1 | "Now serving" display | `NowServingBoard` |
| Accessibility | Mobile browser, low-end phones | 14px floor, `tap-min` 48px, 200% zoom, Atkinson Hyperlegible, no images |
| Performance | Updates within seconds | Numbers update in place; five small font files, no images or animation to load |
| Reliability | Works when the internet drops | Local network only; `LiveStatus` stale state; ☐ steps on the printed ticket |
| Privacy | Minimum data, Data Privacy Act 2012 | Numbers-only shared screens, masked permit numbers, progress-only guardian page |
| Usability | Run a station after a short briefing | One primary button per state, `tap-staff` 64px, shortcuts, Undo on everything |

---

## Appendix A · tokens.css

```css
:root {
  --maroon: #880000;
  --maroon-deep: #5c0000;
  --gold: #ffcc00;
  --green: #1b6e3f;
  --ink: #1f1a1a;
  --ink-soft: #5e5656;
  --line: #e2dcd8;
  --paper: #ffffff;
  --shell: #f7f4f2;
  --tap-min: 48px;
  --tap-staff: 64px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --col-max: 480px;
  /* bp-wide (768px) is used in @media (min-width: 768px); custom properties cannot go in media queries. */
  --r-s: 6px;
  --r-m: 10px;
  --r-ticket: 16px;
  --r-round: 999px;
  --notch: 12px;
  --hairline: 1px;
  --outline: 2px;
  --rule-gold: 4px;
  --tab: 6px;
  --focus-width: 3px;
  --focus-offset: 2px;
  --shadow-float: 0 4px 16px rgba(31, 26, 26, 0.18);
  --font-text: "Atkinson Hyperlegible Next", system-ui, sans-serif;
  --font-num: "Atkinson Hyperlegible Mono", ui-monospace, monospace;
  --font-mark: "Cinzel", Georgia, serif;
  --move: 200ms;
}
@media (prefers-reduced-motion: reduce) {
  :root { --move: 0ms; }
}

.wordmark { font-family: var(--font-mark); font-size: 22px; line-height: 1; font-weight: 700; letter-spacing: 0.04em; }
.heading-l { font-family: var(--font-text); font-size: 28px; line-height: 1.2; font-weight: 700; }
.heading-m { font-family: var(--font-text); font-size: 20px; line-height: 1.3; font-weight: 700; }
.heading-s { font-family: var(--font-text); font-size: 16px; line-height: 1.3; font-weight: 700; }
.eyebrow { font-family: var(--font-text); font-size: 14px; line-height: 1.3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.text-m { font-family: var(--font-text); font-size: 18px; line-height: 1.5; font-weight: 400; }
.text-s { font-family: var(--font-text); font-size: 16px; line-height: 1.5; font-weight: 400; }
.caption { font-family: var(--font-text); font-size: 14px; line-height: 1.4; font-weight: 400; }
.label { font-family: var(--font-text); font-size: 16px; line-height: 1.25; font-weight: 700; }
.label-l { font-family: var(--font-text); font-size: 20px; line-height: 1.2; font-weight: 700; }
.ticket-number { font-family: var(--font-num); font-size: 72px; line-height: 1; font-weight: 700; }
.num-l { font-family: var(--font-num); font-size: 40px; line-height: 1.1; font-weight: 700; }
.num-m { font-family: var(--font-num); font-size: 22px; line-height: 1.2; font-weight: 700; }
.num-s { font-family: var(--font-num); font-size: 14px; line-height: 1.4; font-weight: 400; }
.board-title { font-family: var(--font-text); font-size: 48px; line-height: 1.1; font-weight: 700; }
.board-station { font-family: var(--font-text); font-size: 40px; line-height: 1.1; font-weight: 700; }
.board-number { font-family: var(--font-num); font-size: 160px; line-height: 1; font-weight: 700; }
.board-next { font-family: var(--font-num); font-size: 56px; line-height: 1.1; font-weight: 700; }

@font-face { font-family: "Atkinson Hyperlegible Next"; src: url("fonts/AtkinsonHyperlegibleNext-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Atkinson Hyperlegible Next"; src: url("fonts/AtkinsonHyperlegibleNext-Bold.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Atkinson Hyperlegible Mono"; src: url("fonts/AtkinsonHyperlegibleMono-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Atkinson Hyperlegible Mono"; src: url("fonts/AtkinsonHyperlegibleMono-Bold.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Cinzel"; src: url("fonts/Cinzel-Bold.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
```

## Appendix B · Component styles

Not written yet. Build them from the Components section using only the tokens in Appendix A, with the class prefix `pq-` (`pq-ticket`, `pq-btn`, `pq-btn--quiet`, `pq-check`, `pq-banner`, `pq-board` and so on). Paste the result here once it exists, so this file stays the source of truth.
