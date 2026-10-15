// IsQolar UI strings — Filipino
// ALL VALUES ARE DRAFTS. Every string below needs a native-speaker check
// before the pilot. See HANDOFF.md section 8.
// Keys must match strings.en.js exactly.

export const fil = {
  /* --- App / header --- */
  appName:        "Enrollment Queue", // DRAFT
  langEn:         "Ingles", // DRAFT
  langFil:        "Filipino", // DRAFT
  langLabelEn:    "EN",
  langLabelFil:   "FIL",
  exitPrototype:  "Lumabas sa prototype", // DRAFT
  updated:        "Na-update", // DRAFT
  notUpdating:    "Hindi nag-a-update mula", // DRAFT
  placeIsSafe:    "Ligtas ang inyong lugar sa pila. Kung hindi pa nare-resolve, magtanong sa kahit sinong staff.", // DRAFT
  updatedAgo:     "ang nakakaraan", // DRAFT

  /* --- Steps --- */
  step:           "Step", // DRAFT
  stepOf:         "ng", // DRAFT
  stepN:          (n, total) => `Step ${n} ng ${total}`, // DRAFT

  /* --- Join --- */
  joinHeading:    "Kumuha ng inyong queue ticket", // DRAFT
  permitLabel:    "Numero ng student permit", // DRAFT
  permitHint:     "", // DRAFT
  firstNameLabel: "Pangalan", // DRAFT
  courseLabel:    "Kurso", // DRAFT
  guardianLabel:  "Mobile ng guardian (opsyonal)", // DRAFT
  joinBtn:        "Kumuha ng ticket", // DRAFT
  joinNameLink:   "Gamitin ang pangalan ko", // DRAFT
  joinNoPrint:    "Walang phone? Ang check-in desk malapit sa pintuan ng gym ay makakaprint ng ticket.", // DRAFT
  joinDemoHint:   "Demo: permit 2026-00123-MN-0, pangalan Juan, kurso BSIT", // DRAFT
  errPermitRequired: "Ilagay ang inyong numero ng student permit.", // DRAFT
  errNameRequired:   "Ilagay ang inyong pangalan.", // DRAFT
  errCourseRequired: "Pumili ng kurso.", // DRAFT
  errPermitFormat:   "Suriin ang numero, o magtanong sa check-in desk malapit sa pintuan ng gym.", // DRAFT
  errAlreadyJoined:  "May ticket na ang permit na ito.", // DRAFT

  /* --- Ticket --- */
  queueNumber:    "NUMERO NG PILA", // DRAFT
  aheadOf:        "nauna sa inyo", // DRAFT
  youreNext:      "Kayo na ang susunod.", // DRAFT
  itsYourTurn:    "Ikaw na!", // DRAFT
  aboutMin:       (n) => `mga ${n} minuto`, // DRAFT
  aFewMin:        "ilang minuto", // DRAFT
  earlyEstimate:  "Maagang estimate", // DRAFT
  forStation:     (n, name) => `para sa Step ${n} \u00b7 ${name}`, // DRAFT
  showToStaff:    "Ipakita sa staff", // DRAFT
  readStatus:     "Basahin ang aking status", // DRAFT
  brightnessHint: "I-maximize ang brightness ng screen kapag ipinakita ito.", // DRAFT

  /* --- Steps checklist --- */
  yourEnrollSteps: "Mga hakbang ng enrollment", // DRAFT
  doneCount:       (done, total) => `${done} ng ${total} natapos`, // DRAFT
  doneAt:          (time) => `Natapos nang ${time}`, // DRAFT
  notYet:          "Hindi pa", // DRAFT
  inLine:          "Nakapila", // DRAFT
  yourTurn:        "Ikaw na", // DRAFT
  done:            "Tapos na", // DRAFT
  onHold:          "Naka-hold", // DRAFT
  problem:         "May problema", // DRAFT
  youreFullyEnrolled: "Naka-enroll na kayo", // DRAFT

  /* --- Call banner --- */
  bannerHeading:  "Ikaw na!", // DRAFT
  bannerGo:       (n, name) => `Pumunta sa Step ${n} \u00b7 ${name}`, // DRAFT
  bannerShow:     "Ipakita ang ticket na ito", // DRAFT

  /* --- On hold --- */
  onHoldMsg:      (time, n, name) =>
    `Tinawag kayo nang ${time}. Bumalik sa Step ${n} \u00b7 ${name} at ipakita ang ticket; ibabalik kayo ng staff sa pila.`, // DRAFT

  /* --- Enrolled card --- */
  enrolledHeading: "Naka-enroll na kayo", // DRAFT
  enrolledWelcome: "Maligayang pagdating sa PUP, Iskolar ng Bayan.", // DRAFT

  /* --- Updates / slots --- */
  updatesHeading:  "Mga update", // DRAFT
  slotsLabel:      "Slots", // DRAFT
  slotsLeft:       (n) => `${n} slots natitira`, // DRAFT
  slotsFull:       "Puno na", // DRAFT
  almostFull:      "Halos puno na", // DRAFT
  coursesOpen:     (n, total) => `Mga bukas na kurso: ${n} ng ${total}`, // DRAFT

  /* --- Requirements checklist --- */
  requirementsHeading: "Checklist ng mga requirement", // DRAFT
  requirementsSample:  "(halimbawa)", // DRAFT
  requirementsList: [
    "Nilagdaang SAR-FORM 1 (admission slip)", // DRAFT
    "2 piraso ng 2x2 ID photo (puting background)", // DRAFT
    "Orihinal at photocopy ng Form 138 (high school card)", // DRAFT
    "Birth certificate (na-authenticate ng PSA)", // DRAFT
    "Certificate of good moral character", // DRAFT
    "Resulta ng chest X-ray", // DRAFT
    "Medical certificate", // DRAFT
  ],

  /* --- Stay-near rule --- */
  stayNear:
    "Maaari po kayong umalis saglit kung higit 30 minuto pa ang paghihintay. Kapag 30 minuto na lang o mas kaunti, pumunta na po malapit sa step ninyo. Kapag wala po kayo pagtawag sa numero ninyo, mapupunta ang ticket sa dulo ng pila ng step na iyon. Kapag wala po kayo sa pangalawang tawag, makakansela ang ticket. Hindi mawawala ang mga natapos ninyong step.", // DRAFT

  /* --- Guardian --- */
  guardianHeading:     "Access ng guardian", // DRAFT
  guardianPermitLabel: "Numero ng student permit", // DRAFT
  guardianCodeLabel:   "Guardian code", // DRAFT
  guardianCodeHint:    "Makikita ng estudyante ito sa Profile tab.", // DRAFT
  guardianSignIn:      "Mag-sign in", // DRAFT
  guardianDemoHint:    "Demo: permit 2026-00123-MN-0, code JUAN47", // DRAFT
  guardianEnrollment:  (name) => `Enrollment ni ${name}`, // DRAFT
  guardianNeverShown:  "Hindi ipinapakita ng guardian view ang ticket number, QR, o permit.", // DRAFT
  guardianStale:
    "Walang bagong update mula {time}. Maa-update ang pahinang ito kapag nakakonekta na ang venue.", // DRAFT

  /* --- Staff --- */
  staffHeading:      "Staff sign-in", // DRAFT
  staffPinLabel:     "PIN", // DRAFT
  staffPinHint:      "Demo PIN: 1234", // DRAFT
  staffStallLabel:   "Inyong stall", // DRAFT
  staffSignIn:       "Mag-sign in", // DRAFT
  staffSignOut:      "Mag-sign out", // DRAFT
  staffCallNext:     "Tawagan ang susunod", // DRAFT
  staffMarkDone:     "Markahan bilang tapos", // DRAFT
  staffHold:         "I-hold", // DRAFT
  staffRecall:       "I-recall", // DRAFT
  staffUndo:         "I-undo", // DRAFT
  staffLookup:       "Permit number o ticket number", // DRAFT
  staffInLine:       "Nakapila", // DRAFT
  staffOnHold:       "Naka-hold", // DRAFT
  staffUndoDone:     "I-undo ang tapos", // DRAFT
  staffSlotsLeft:    (n) => `${n} slots natitira`, // DRAFT
  staffDeskKey:      (key, action) => `${key} ${action}`, // DRAFT
  staffWrittenComm:  "Mas gusto ng estudyanteng ito ang nakasulat na komunikasyon.", // DRAFT
  staffNeedsGuide:   "Kailangan ng gabay ng estudyanteng ito.", // DRAFT
  staffServing:      (no) => `Nagse-serve ng ${no}`, // DRAFT
  staffCalledAt:     (time) => `Tinawag nang ${time}`, // DRAFT
  staffToast:        (action, no) => `${action} ${no}.`, // DRAFT

  /* --- Board --- */
  boardNowServing:    "Now serving", // DRAFT
  boardNowServingFil: "Tinatawag na", // DRAFT
  boardNowArrow:      "Now", // DRAFT
  boardNowArrowFil:   "Ngayon", // DRAFT
  boardNext:          "Next", // DRAFT
  boardNextFil:       "Susunod", // DRAFT
  boardWaiting:       (n) => `${n} waiting`, // DRAFT
  boardWaitingFil:    (n) => `${n} naghihintay`, // DRAFT
  boardNoCall:        "Waiting for first call", // DRAFT
  boardNoCallFil:     "Naghihintay", // DRAFT
  boardScan:          "Scan to join", // DRAFT
  boardScanFil:       "I-scan para sumali", // DRAFT
  boardNoPhone:       "No phone? Go to the check-in desk by the gym door.", // DRAFT
  boardNoPhoneFil:    "Walang phone? Pumunta sa check-in desk malapit sa gym door.", // DRAFT

  /* --- Explore / campus --- */
  exploreHeading:    "I-explore ang PUP", // DRAFT
  mabiниCampus:      "Mabini Campus", // DRAFT
  ndcCampus:         "NDC Compound", // DRAFT
  mhCampus:          "M.H. del Pilar Campus", // DRAFT
  buildingTBC:       "Gusaling ipapatunay pa", // DRAFT
  linesNow:          "Mga pila ngayon", // DRAFT
  totalEnrollees:    "Kabuuang nag-enroll", // DRAFT
  enrolled:          "Naka-enroll", // DRAFT
  inProgress:        "Kasalukuyan", // DRAFT
  notYetArrived:     "Hindi pa dumarating", // DRAFT
  longestLines:      "Pinakamahabang pila", // DRAFT

  /* --- Courses tab --- */
  coursesHeading:    "Mga kurso", // DRAFT
  yourCourse:        "Inyong kurso", // DRAFT
  shortestLine:      "Pinakamaikling pila", // DRAFT
  longestLine:       "Pinakamahabang pila", // DRAFT
  searchCourses:     "Maghanap ng kurso", // DRAFT
  allColleges:       "Lahat ng kolehiyo", // DRAFT
  overview:          "Pangkalahatang-tanaw", // DRAFT
  subjects:          "Mga paksa", // DRAFT
  year:              (n) => `Taon ${n}`, // DRAFT
  totalUnits:        (n) => `${n} kabuuang units`, // DRAFT
  sampleContent:     "(halimbawa)", // DRAFT

  /* --- Profile tab --- */
  profileHeading:    "Profile", // DRAFT
  permitMasked:      "Numero ng permit", // DRAFT
  courseLabel2:      "Kurso", // DRAFT
  language:          "Wika", // DRAFT
  textSize:          "Laki ng teksto", // DRAFT
  highContrast:      "Mataas na contrast", // DRAFT
  writtenComm:       "Mas gusto ang nakasulat na komunikasyon", // DRAFT
  needGuide:         "Kailangan ng gabay", // DRAFT
  guardianMobile:    "Mobile ng guardian", // DRAFT
  guardianCode:      "Guardian code", // DRAFT
  diffTicket:        "Gumamit ng ibang ticket", // DRAFT

  /* --- Landing --- */
  heroHeading:       "Alamin ang inyong lugar sa pila. Pumasok, huwag mag-antay.", // DRAFT
  heroSub:           "Binibigyan ng IsQolar ang bawat freshman ng PUP ng queue ticket, live na pila at malinaw na \"Naka-enroll na kayo\" sa huli.", // DRAFT
  tryPrototype:      "Subukan ang prototype", // DRAFT
  featuresHeading:   "Ano ang ginagawa ng IsQolar", // DRAFT
  benefitsHeading:   "Bakit ito mahalaga", // DRAFT
  howHeading:        "Paano ito gumagana", // DRAFT
  faqHeading:        "Mga madalas itanong", // DRAFT
  prototypeBanner:   "Ito ay isang prototype. Ang data ay simulated.", // DRAFT
  toolsHeading:      "Mga kasangkapan ng prototype", // DRAFT
  toolsReset:        "I-reset ang simulated na umaga", // DRAFT
  toolsOffline:      "I-simulate ang pagkawala ng network", // DRAFT
  toolsOnline:       "Ibalik ang network", // DRAFT

  faqs: [
    { q: "Kailangan ko bang mag-install ng kahit ano?", a: "Hindi. Buksan ang link sa inyong phone, ilagay ang inyong permit number at nasa pila na kayo." }, // DRAFT
    { q: "Paano kung wala akong phone o data?", a: "Ang check-in desk malapit sa pintuan ng gym ay makakaprint ng ticket. Panoorin ang Now Serving board upang malaman kung kailan tatawagan ang inyong numero." }, // DRAFT
    { q: "Pwede ba akong umalis sa pila?", a: "Oo, habang higit 30 minuto pa ang inyong paghihintay. Kapag 30 minuto na lang o mas kaunti, manatili malapit sa inyong step." }, // DRAFT
    { q: "Ano ang mangyayari kung hindi ako naroroon pagtawag?", a: "Mapupunta ang inyong ticket sa dulo ng pila ng step na iyon. Sa pangalawang pagkakataon, makakansela ang ticket. Ang mga natapos ninyong step ay mananatili." }, // DRAFT
    { q: "Pinapalitan ba ng IsQolar ang enrollment system ng PUP?", a: "Hindi. Ipinapakita nito kung saan kayo sa pila at kinukumpirma na tapos na kayo. Hindi ito humahawak ng bayad o ng opisyal na registration system." }, // DRAFT
    { q: "Paano ko malalaman ng guardian ko kung nasaan ako?", a: "I-share ang inyong guardian link mula sa Profile tab. Makikita ng inyong guardian ang inyong progreso, hindi ang inyong personal na detalye." }, // DRAFT
    { q: "Paano kung mawala ang koneksyon?", a: "Mananatili sa screen ang inyong huling kilalang posisyon. Ligtas ang inyong lugar sa pila. Kapag bumalik ang network, mag-a-update ang pahina." }, // DRAFT
    { q: "Para kanino ang mga hakbang?", a: "Para sa lahat ng first-year, on-site enrollee sa PUP Manila. Hindi sakop ang mga continuing student, transferee at graduate student." }, // DRAFT
  ],

  /* --- Error / problem messages --- */
  errGeneric:     "May nangyaring mali. Magtanong sa check-in desk.", // DRAFT
};
