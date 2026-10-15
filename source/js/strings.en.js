// IsQolar UI strings -- English
// All strings that appear in the UI.
// Keys used by t(), tEn(), and tp().

export const en = {
  /* --- App / header --- */
  appName:        "Enrollment Queue",
  langEn:         "English",
  langFil:        "Filipino",
  langLabelEn:    "EN",
  langLabelFil:   "FIL",
  exitPrototype:  "Exit prototype",
  updated:        "Updated",
  notUpdating:    "Not updating since",
  placeIsSafe:    "Your place in line is safe. If this does not clear, ask any staff member.",
  updatedAgo:     "ago",

  /* --- Steps --- */
  step:           "Step",
  stepOf:         "of",
  stepN:          (n, total) => Step +${n} of ,

  /* --- Join --- */
  joinHeading:    "Get your queue ticket",
  permitLabel:    "Student permit number",
  permitHint:     "",
  firstNameLabel: "First name",
  courseLabel:    "Course",
  guardianLabel:  "Guardian mobile (optional)",
  joinBtn:        "Get my ticket",
  joinNameLink:   "Use my name instead",
  joinNoPrint:    "No phone with you? The check-in desk by the gym door can print a ticket.",
  joinDemoHint:   "Demo: permit 2026-00123-MN-0, name Juan, course BSIT",
  errPermitRequired: "Enter your student permit number.",
  errNameRequired:   "Enter your first name.",
  errCourseRequired: "Choose a course.",
  errPermitFormat:   "Check the number, or ask at the check-in desk by the gym door.",
  errAlreadyJoined:  "This permit already has a ticket.",

  /* --- Ticket --- */
  queueNumber:    "QUEUE NUMBER",
  aheadOf:        "ahead of you",
  youreNext:      "You're next.",
  itsYourTurn:    "It's your turn.",
  aboutMin:       (n) => bout +${n} min,
  aFewMin:        "a few minutes",
  earlyEstimate:  "Early estimate",
  forStation:     (n, name) => or Step +${n} \u00b7 ,
  showToStaff:    "Show to staff",
  readStatus:     "Read my status",
  brightnessHint: "Turn your screen brightness up when you show this.",

  /* --- Steps checklist --- */
  yourEnrollSteps: "Your enrollment steps",
  doneCount:       (done, total) => ${done} of +${total} done,
  doneAt:          (time) => Done at +${time},
  notYet:          "Not yet",
  inLine:          "In line",
  yourTurn:        "Your turn",
  done:            "Done",
  onHold:          "On hold",
  problem:         "Problem",
  youreFullyEnrolled: "You're fully enrolled",

  /* --- Call banner --- */
  bannerHeading:  "Your turn",
  bannerGo:       (n, name) => Go to Step +${n} \u00b7 ,
  bannerShow:     "Show this ticket",

  /* --- On hold --- */
  onHoldMsg:      (time, n, name) =>
    You were called at +${time}. Go back to Step +${n} \u00b7  and show your ticket; staff will put you back in line.,

  /* --- Enrolled card --- */
  enrolledHeading: "You're fully enrolled",
  enrolledWelcome: "Welcome to PUP, Iskolar ng Bayan.",

  /* --- Updates / slots --- */
  updatesHeading:  "Updates",
  slotsLabel:      "Slots",
  slotsLeft:       (n) => ${n} slots left,
  slotsFull:       "Full",
  almostFull:      "Almost full",
  coursesOpen:     (n, total) => Courses open: +${n} of +${total},

  /* --- Requirements checklist (sample) --- */
  requirementsHeading: "Requirements checklist",
  requirementsSample:  "(sample)",
  requirementsList: [
    "Signed SAR-FORM 1 (admission slip)",
    "2 pcs 2x2 ID photos (white background)",
    "Original and photocopy of Form 138 (high school card)",
    "Birth certificate (PSA-authenticated)",
    "Good moral certificate",
    "Chest X-ray result",
    "Medical certificate",
  ],

  /* --- Stay-near rule --- */
  stayNear:
    "You can step away while your wait is more than 30 minutes. When it is 30 minutes or less, be near your step. If you are not there when your number is called, your ticket goes to the back of that step's line. Miss it a second time and it is cancelled. Steps you finished are kept.",

  /* --- Guardian --- */
  guardianHeading:     "Guardian access",
  guardianPermitLabel: "Student permit number",
  guardianCodeLabel:   "Guardian code",
  guardianCodeHint:    "The student finds this in their Profile tab.",
  guardianSignIn:      "Sign in",
  guardianDemoHint:    "Demo: permit 2026-00123-MN-0, code JUAN47",
  guardianEnrollment:  (name) => ${name}'s enrollment,
  guardianNeverShown:  "Guardian view does not show ticket number, QR, or permit.",
  guardianStale:       "No new updates since {time}. This page will catch up when the venue reconnects.",

  /* --- Staff --- */
  staffHeading:      "Staff sign-in",
  staffPinLabel:     "PIN",
  staffPinHint:      "Demo PIN: 1234",
  staffStallLabel:   "Your stall",
  staffSignIn:       "Sign in",
  staffSignOut:      "Sign out",
  staffCallNext:     "Call next",
  staffMarkDone:     "Mark done",
  staffHold:         "Hold",
  staffRecall:       "Recall",
  staffUndo:         "Undo",
  staffLookup:       "Permit number or ticket number",
  staffInLine:       "In line",
  staffOnHold:       "On hold",
  staffUndoDone:     "Undo done",
  staffSlotsLeft:    (n) => ${n} slots left,
  staffDeskKey:      (key, action) => ${key} +${action},
  staffWrittenComm:  "This student prefers written communication.",
  staffNeedsGuide:   "This student needs a guide.",
  staffToast:        (action, no) => ${action} +${no}.,
  staffServing:      (no) => Serving +${no},
  staffCalledAt:     (time) => Called at +${time},

  /* --- Board (bilingual via tp()) --- */
  boardNowServing:    "Now serving",
  boardNowServingFil: "Tinatawag na",
  boardNowArrow:      "Now",
  boardNowArrowFil:   "Ngayon",
  boardNext:          "Next",
  boardNextFil:       "Susunod",
  boardWaiting:       (n) => ${n} waiting,
  boardWaitingFil:    (n) => ${n} naghihintay,
  boardNoCall:        "Waiting for first call",
  boardNoCallFil:     "Naghihintay",
  boardScan:          "Scan to join",
  boardScanFil:       "I-scan para sumali",
  boardNoPhone:       "No phone? Go to the check-in desk by the gym door.",
  boardNoPhoneFil:    "Walang phone? Pumunta sa check-in desk malapit sa gym door.",

  /* --- Explore / campus --- */
  exploreHeading:    "Explore PUP",
  mabiniCampus:      "Mabini Campus",
  ndcCampus:         "NDC Compound",
  mhCampus:          "M.H. del Pilar Campus",
  buildingTBC:       "Building to be confirmed",
  linesNow:          "Lines now",
  totalEnrollees:    "Total enrollees",
  enrolled:          "Enrolled",
  inProgress:        "In progress",
  notYetArrived:     "Not yet arrived",
  longestLines:      "Longest lines",

  /* --- Courses tab --- */
  coursesHeading:    "Courses",
  yourCourse:        "Your course",
  shortestLine:      "Shortest line",
  longestLine:       "Longest line",
  searchCourses:     "Search courses",
  allColleges:       "All colleges",
  overview:          "Overview",
  subjects:          "Subjects",
  year:              (n) => Year +${n},
  totalUnits:        (n) => ${n} total units,
  sampleContent:     "(sample)",

  /* --- Profile tab --- */
  profileHeading:    "Profile",
  permitMasked:      "Permit number",
  courseLabel2:      "Course",
  language:          "Language",
  textSize:          "Text size",
  highContrast:      "High contrast",
  writtenComm:       "Prefer written communication",
  needGuide:         "Need a guide",
  guardianMobile:    "Guardian mobile",
  guardianCode:      "Guardian code",
  diffTicket:        "Use a different ticket",

  /* --- Landing: nav, sections, features, benefits, how-it-works, preview, footer --- */
  navFeatures:       "Features",
  navHowItWorks:     "How it works",
  navLiveCount:      "Live count",
  navPreview:        "Preview",
  navFaqs:           "FAQs",

  personaStudent:    "Student",
  personaGuardian:   "Guardian",
  personaStaff:      "Staff",
  personaBoard:      "Now Serving Board",
  personaStudentDesc:  "Join the queue, track your steps.",
  personaGuardianDesc: "Watch a student's progress from outside.",
  personaStaffDesc:    "Run a course stall.",
  personaBoardDesc:    "The big screen for the whole venue.",

  toolsOfflineOn:    "Network loss is on",
  toolsOfflineOff:   "Network loss is off",

  featureTitle1:     "Live queue ticket",
  featureDesc1:      "Your four-digit number follows you all day. One ticket, one number, from the gym door to enrolled.",
  featureTitle2:     "Course stall board",
  featureDesc2:      "Every course stall shows how many are waiting. Find the shortest line before you get there.",
  featureTitle3:     "Staff two-tap console",
  featureDesc3:      "Call next. Mark done. That is it. Staff run their stall from one screen with no training.",

  benefit1Title:     "No guessing",
  benefit1Desc:      "You know your number, how many are ahead and about how long.",
  benefit2Title:     "Step away safely",
  benefit2Desc:      "The wait estimate tells you when you can eat or call family.",
  benefit3Title:     "Clear finish line",
  benefit3Desc:      "You see every step. The last one says you are fully enrolled.",
  benefit4Title:     "Works offline",
  benefit4Desc:      "No Wi-Fi required. Everything runs on the venue network.",
  benefit5Title:     "No install",
  benefit5Desc:      "Open a link on your phone. That is all. No app, no password.",
  benefit6Title:     "Guardian view",
  benefit6Desc:      "Family outside the venue can see your progress without your details.",

  howTitle1:  "Scan and join",
  howDesc1:   "Scan the venue QR and enter your permit number. You get a ticket in seconds.",
  howTitle2:  "Watch the board",
  howDesc2:   "The Now Serving board shows every stall. Find your number and your wait.",
  howTitle3:  "Get called",
  howDesc3:   "When it is your turn, your phone shows a gold banner and vibrates. Go to your stall.",
  howTitle4:  "Finish enrolled",
  howDesc4:   "The last step confirms you are fully enrolled. Show the screen at the exit.",

  previewHeading:    "See it now",
  previewSub:        "Live data from the simulated morning.",
  nowServing:        "Now serving",
  waiting:           (n) => ${n} waiting,

  liveCountHeading:  "Live course count",
  liveCountSub:      "Pick a course to see slots left.",
  liveCountSelect:   "Choose a course",
  liveCountSlots:    (n) => ${n} slots left,
  liveCountFull:     "Full",
  liveCountTotal:    (open, total) => ${open} of +${total} courses open,

  bannerText:        "Prototype: all data is simulated. Nothing is sent to PUP.",
  footerTagline:     "IsQolar. Know your place in line.",
  footerBuilt:       "Built at the ICS x IBM Bobathon, PUP Manila, October 2026.",
  footerTeam:        "Team: Troy, Ayen, Donita, Viv, Justin.",

  heroHeading:       "Know your place in line. Walk in, not wait.",
  heroSub:           "IsQolar gives every PUP freshman a queue ticket, a live line and a clear You're fully enrolled at the end.",
  tryPrototype:      "Try the prototype",
  featuresHeading:   "What IsQolar does",
  benefitsHeading:   "Why it matters",
  howHeading:        "How it works",
  faqHeading:        "Frequently asked questions",
  prototypeBanner:   "This is a prototype. Data is simulated.",
  toolsHeading:      "Prototype tools",
  toolsReset:        "Reset simulated morning",
  toolsOffline:      "Simulate network loss",
  toolsOnline:       "Restore network",

  faqs: [
    { q: "Do I need to install anything?",       a: "No. Open the link on your phone, enter your permit number and you are in the queue." },
    { q: "What if I have no phone or no data?",  a: "The check-in desk by the gym door can print a ticket. Watch the Now Serving board to see when your number is called." },
    { q: "Can I step away from the line?",       a: "Yes, while your wait is more than 30 minutes. When the wait is 30 minutes or less, stay near your step." },
    { q: "What happens if I miss my call?",      a: "Your ticket goes to the back of that step's line. Miss it a second time and the ticket is cancelled. Any steps you already finished are kept." },
    { q: "Does IsQolar replace the enrollment system?", a: "No. It shows you where you are in line and confirms you are done. It does not handle payments or the official registration system." },
    { q: "How do I let my guardian know where I am?", a: "Share your guardian link from the Profile tab. Your guardian sees your progress, not your personal details." },
    { q: "What if the connection drops?",        a: "Your last known position stays on screen. Your place in line is safe. When the network comes back, the page updates." },
    { q: "Who are the steps for?",               a: "All first-year, on-site enrollees at PUP Manila. Continuing students, transferees and graduate students are not covered." },
  ],

  /* --- Error / problem messages --- */
  errGeneric:     "Something went wrong. Ask at the check-in desk.",
};