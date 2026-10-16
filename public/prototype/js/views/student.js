import * as store from '../store.js';
import * as a11y from '../a11y.js';
import { t, getLang, setLang } from '../i18n.js';
import { markSvg, statusWord } from '../status-mark.js';
import { esc, fmtTime, fmtDate, stallLabel, placeLabel, header, problem, qrSvg, bindLang } from '../ui.js';
import { REQUIREMENTS, CURRICULUM, COLLEGES_URL, CAMPUSES, COLLEGE_CAMPUS, campusOf } from '../courseinfo.js';

const REQ_KEY = 'isqolar.req';
const CI = {
  doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>',
  seat: '<path d="M5 11V7a3 3 0 013-3h8a3 3 0 013 3v4M4 11h16v5H4zM6 16v3M18 16v3"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  pin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
};
const ICONS = {
  dashboard: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />',
  courses: '<path d="M4 6h16M4 12h16M4 18h10" />',
  explore: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />',
  profile: '<circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />',
};

export function mount(el, { demo } = {}) {
  const prefill = demo === true || store.isDemo();
  let tab = 'dashboard', courseSel = null, exploreCollege = null, pendingScroll = false, courseTab = 'overview', subjYear = 1, courseCollege = 'all', courseQuery = '', showFull = false, phoneNote = '';
  let joinError = null, useName = false;
  let draft = { permit: prefill ? '2026-00123-MN-0' : '', stall: prefill ? 'BSIT' : '', name: prefill ? 'Juan' : '', gphone: prefill ? '09171234567' : '' };
  let settings = a11y.get(), reqs = [];
  try { reqs = JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch { reqs = []; }
  let lastSig = '', lastStatus = null, lastMsg = null;

  el.innerHTML = '<div data-ui></div><p class="pq-sr" role="status" aria-live="polite" data-live></p>';
  const ui = el.querySelector('[data-ui]'), live = el.querySelector('[data-live]');

  // ---------- small pieces ----------
  const slotInfo = (s) => {
    const k = s.left === 0 ? 'full' : s.left <= 10 ? 'almost' : 'ok';
    return { k, mark: k === 'ok' ? 'in-line' : 'problem', word: t('slots.' + k), text: t('slots.text', { left: s.left, total: s.total }) };
  };
  const hero = (txt) => { const w = txt.trim().split(' '); const last = w.pop(); return `<h1 class="pq-hero">${esc(w.join(' '))} <em>${esc(last)}</em></h1>`; };
  const bar = (s) => `<div class="pq-bar" role="img" aria-label="${slotInfo(s).text}"><i style="width:${s.total ? Math.min(100, Math.round((100 * s.left) / s.total)) : 0}%"></i></div>`;
  const darkPanel = (title, inner) => `<section class="pq-dark" aria-label="${title}"><h2 class="pq-dark__title">${title}</h2><div class="pq-inner">${inner}</div></section>`;
  const slotRow = (s, label) => { const i = slotInfo(s); return `<li class="pq-update">${markSvg(i.mark)}<div><p class="heading-s">${label}</p><p class="text-s"><b>${i.word}</b> · <span class="num">${i.text}</span></p>${bar(s)}</div></li>`; };
  const waitText = (w) => (w.few ? t('courses.waitFew') : t('courses.wait', { n: w.minutes }));
  const forLine = (v) => `<p class="heading-s pq-for">${t('ticket.for', { stall: stallLabel(v.stall.code) })}</p>`;
  const earlyTag = (v) => (v.est.early ? `<span class="pq-tag caption">${t('ticket.early')}</span>` : '');

  function liveLine(v) {
    if (v.status === 'called') return `<p class="heading-m">${t('ticket.called')}</p>`;
    if (v.status === 'hold') return `<div class="pq-live"><p class="pq-holdline">${markSvg('on-hold')}<span class="heading-m">${t('hold.title')}</span></p><p class="text-m">${t('hold.body', { time: fmtTime(v.calledAt || v.joinedAt), stall: stallLabel(v.stall.code) })}</p></div>`;
    if (v.status === 'next') return `<p class="heading-m">${t('ticket.next')}</p>${forLine(v)}${earlyTag(v)}`;
    const almost = v.status === 'almost' ? `<p class="text-m">${t('ticket.almost', { stall: stallLabel(v.stall.code) })}</p>` : '';
    const wait = v.est.few
      ? `<div class="pq-stat__line"><span class="heading-m">${t('ticket.aFew')}</span></div>`
      : `<div class="pq-stat__line"><span class="text-m">${t('ticket.about')}</span><span class="num-l num">${v.est.minutes}</span><span class="text-m">${t('ticket.min')}</span></div>`;
    return `${almost}<div class="pq-live"><div class="pq-stat__line"><span class="num-l num">${v.ahead}</span><span class="text-m">${t('ticket.ahead')}</span></div>${wait}</div>${forLine(v)}${earlyTag(v)}`;
  }

  function ticket(v) {
    return `<section class="pq-ticket" aria-label="${t('ticket.queueNumber')} ${store.ticketLabel(v.no)}">
      <div class="pq-ticket__band"><img class="logo" src="/brand/logo-dark.png" alt=""><span class="num-s num">${fmtDate(v.joinedAt)}</span></div>
      <div class="pq-ticket__main"><p class="eyebrow pq-soft">${t('ticket.queueNumber')}</p>
        <p class="ticket-number num pq-ticket__no">${store.ticketLabel(v.no)}</p>${v.status === 'enrolled' ? '' : liveLine(v)}</div>
      <div class="pq-ticket__tear" aria-hidden="true"></div>
      <div class="pq-ticket__stub">${qrSvg('isqolar:ticket:' + store.ticketLabel(v.no))}
        <p class="num-s num">${esc(store.mask(v.permit))}</p><p class="caption pq-soft">${t('ticket.brightness')}</p>
        <div class="pq-ticket__tools"><button type="button" class="pq-btn pq-btn--quiet pq-btn--sm" data-showfull>${t('a11y.showStaff')}</button>
          ${'speechSynthesis' in window ? `<button type="button" class="pq-btn pq-btn--quiet pq-btn--sm" data-read>${t('a11y.read')}</button>` : ''}</div></div></section>`;
  }
  const enrolledCard = (v) => `<button type="button" class="pq-enrolled" data-resume><svg width="48" height="48" viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10.5l4.2 4.2L16.5 5.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h1 class="heading-l">${t('enrolled.title')}</h1><p class="num-s num">${fmtDate(v.doneAt)} · ${fmtTime(v.doneAt)}</p><p class="text-m">${t('enrolled.welcome')}</p><p class="text-m">${t('enrolled.resume')}</p></button>`;
  const callBanner = (v, animate) => `<div class="pq-banner${animate ? ' pq-banner--in' : ''}" role="alert"><div class="pq-banner__top">${markSvg('your-turn', 32)}<h1 class="heading-l">${t('banner.turn')}</h1></div>
    <p class="heading-m">${t('banner.go', { stall: stallLabel(v.stall.code) })}</p><p class="text-m">${t('banner.where', { place: placeLabel(v.stall.row) })}</p></div>`;

  function row(status, name, detail) {
    const cur = status === 'in-line' || status === 'your-turn' || status === 'on-hold';
    return `<li class="${cur ? 'is-current' : ''}">${markSvg(status)}<div><p class="heading-s">${name}</p>${detail ? `<p class="caption pq-soft">${detail}</p>` : ''}</div><span class="pq-word pq-word--${status}">${statusWord(status)}</span></li>`;
  }
  function checklist(v) {
    const steps = v.stepOrder, doneCount = steps.filter((s) => v.done[s]).length;
    const rows = steps.map((s) => {
      const done = !!v.done[s], current = s === 'course-stall' && !done;
      const status = done ? 'done' : current ? (v.status === 'called' ? 'your-turn' : v.status === 'hold' ? 'on-hold' : 'in-line') : 'not-yet';
      const detail = done ? t('checklist.doneAt', { time: fmtTime(v.done[s]) }) : current ? `${stallLabel(v.stall.code)} · ${placeLabel(v.stall.row)}` : t('place.' + s);
      return row(status, t('step.' + s), detail);
    });
    const fin = v.status === 'enrolled';
    rows.push(row(fin ? 'done' : 'not-yet', t('step.enrolled'), fin ? t('checklist.doneAt', { time: fmtTime(v.doneAt) }) : ''));
    return `<section class="pq-card pq-check" aria-label="${t('checklist.title')}"><div class="pq-check__head"><h2 class="heading-m">${t('checklist.title')}</h2><span class="num-s num pq-soft">${t('checklist.count', { n: doneCount, total: steps.length })}</span></div><ol>${rows.join('')}</ol></section>`;
  }
  const updatesCard = (v) => darkPanel(t('updates.title'), `<ul class="pq-updates">${slotRow(v.slots, t('updates.slots', { course: v.stall.code }))}
      <li class="pq-update">${markSvg('in-line')}<div><p class="heading-s">${t('updates.row', { row: v.stall.row, n: v.rowWaiting })}</p></div></li></ul>`);
  const reqCard = () => `<section class="pq-card" aria-label="${t('req.title')}"><div class="pq-check__head"><h2 class="heading-m">${t('req.title')}</h2><span class="num-s num pq-soft">${t('req.count', { n: REQUIREMENTS.filter((k) => reqs.includes(k)).length, total: REQUIREMENTS.length })}</span></div>
    <p class="caption pq-soft">${t('req.sample')}</p><ul class="pq-reqs">${REQUIREMENTS.map((k) => `<li><label class="pq-req"><input type="checkbox" data-req="${k}" ${reqs.includes(k) ? 'checked' : ''}><span class="text-m">${t(k)}</span></label></li>`).join('')}</ul></section>`;
  const liveStatus = (v) => v.stale
    ? `<div class="pq-livestatus pq-livestatus--stale caption" role="status"><p class="pq-problem">${markSvg('problem', 16)}<span>${t('live.stale', { time: fmtTime(v.updatedAt) })}</span></p><p>${t('live.safe')}</p></div>`
    : `<p class="pq-livestatus caption" role="status">${t('live.updated', { time: `<span class="num-s num">${fmtTime(v.updatedAt)}</span>` })}</p>`;

  // ---------- tabs ----------
  function dashboard(v) {
    return `${v.status === 'enrolled' ? enrolledCard(v) : ''}${ticket(v)}${updatesCard(v)}${checklist(v)}${reqCard()}${liveStatus(v)}`;
  }
  const barOf = (left, total) => `<span class="pq-bar bx__bar" aria-hidden="true"><i style="width:${total ? Math.min(100, Math.round((100 * left) / total)) : 0}%"></i></span>`;
  function tile(p, { max, wide, mine }) {
    const k = p.slotsLeft === 0 ? 'full' : p.slotsLeft <= 10 ? 'almost' : 'ok';
    const flag = k === 'ok' ? '' : `<span class="bx__flag caption">${markSvg('problem', 14)}${t('slots.' + k)}</span>`;
    return `<button type="button" class="bx${wide ? ' bx--wide' : ''}${mine ? ' bx--yours' : ''}" style="--heat:${(0.03 + 0.13 * (max ? p.inLine / max : 0)).toFixed(3)}" data-course="${esc(p.code)}" aria-label="${esc(p.code)}, ${esc(p.name)}, ${p.inLine} ${t('courses.inLineLabel')}">
      <span class="bx__top"><b class="bx__code">${esc(p.code)}</b>${mine ? `<span class="pq-tag caption">${t('courses.yours')}</span>` : ''}</span>
      <span class="bx__name caption pq-soft">${esc(p.name)}</span>
      <span class="bx__num num">${p.inLine}</span><span class="bx__lbl caption">${t('courses.inLineLabel')}</span>
      <span class="bx__meta caption">${waitText(p.wait)}</span>${flag}${barOf(p.slotsLeft, p.slotsTotal)}</button>`;
  }
  function courseListHTML() {
    const q = courseQuery.trim().toLowerCase(), mine = store.view(store.myTicketNo())?.stall.code;
    const all = store.coursesView(), max = Math.max(1, ...all.flatMap((c) => c.programs.map((p) => p.inLine)));
    const groups = all.filter((c) => courseCollege === 'all' || c.code === courseCollege).map((c) => ({ ...c, programs: c.programs.filter((p) => !q || (p.code + ' ' + p.name + ' ' + c.code).toLowerCase().includes(q)) })).filter((c) => c.programs.length);
    if (!groups.length) return `<p class="text-m pq-soft">${t('courses.none')}</p>`;
    return groups.map((c) => {
      const busiest = c.programs.length >= 3 ? c.programs.reduce((m, p) => (p.inLine > m.inLine ? p : m), c.programs[0]).code : null;
      return `<section class="pq-cgroup"><h2 class="eyebrow pq-soft">${esc(c.code)} · ${esc(c.name)}</h2><div class="bx-grid">${c.programs.map((p) => tile(p, { max, wide: p.code === busiest, mine: p.code === mine })).join('')}</div></section>`;
    }).join('');
  }
  function topBento() {
    const progs = store.coursesView().flatMap((c) => c.programs), v = store.view(store.myTicketNo());
    const mine = progs.find((p) => p.code === v?.stall.code);
    const longest = progs.reduce((m, p) => (p.inLine > m.inLine ? p : m), progs[0]), shortest = progs.reduce((m, p) => (p.inLine < m.inLine ? p : m), progs[0]);
    const stat = (label, p) => `<button type="button" class="bx bx--stat" data-course="${esc(p.code)}"><span class="eyebrow">${label}</span><b class="bx__code">${esc(p.code)}</b><span class="bx__num num">${p.inLine}</span><span class="bx__lbl caption">${t('courses.inLineLabel')}</span></button>`;
    const you = mine ? `<button type="button" class="bx bx--hero" data-course="${esc(mine.code)}"><span class="pq-dark__title">${t('courses.yours')}</span><b class="bx__hero">${esc(mine.code)}</b><span class="caption bx__ondark">${esc(mine.name)}</span>
      <span class="bx__stats"><span><b class="bx__num num">${mine.inLine}</b><span class="caption bx__ondark">${t('courses.inLineLabel')}</span></span><span><b class="heading-m">${waitText(mine.wait)}</b><span class="caption bx__ondark">${t('courses.waitLabel')}</span></span></span>${barOf(mine.slotsLeft, mine.slotsTotal)}</button>` : '';
    return `<div class="bx-grid bx-top">${you}${stat(t('courses.shortest'), shortest)}${stat(t('courses.longest'), longest)}</div>`;
  }
  function coursesTab() {
    if (courseSel) {
      const p = store.coursesView().flatMap((c) => c.programs).find((x) => x.code === courseSel);
      if (!p) { courseSel = null; return coursesTab(); }
      const s = { left: p.slotsLeft, total: p.slotsTotal }, si = slotInfo(s);
      const icon = (k) => `<svg class="pq-icard__i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CI[k]}</svg>`;
      const card = (k, title, body) => `<article class="pq-icard">${icon(k)}<h3 class="pq-icard__t">${title}</h3>${body}</article>`;
      const overview = `<div class="pq-igrid">
        ${card('doc', t('courses.description'), `<p class="text-m">${t('courses.descText', { name: esc(p.name), college: esc(p.collegeName) })}</p>`)}
        ${card('cap', t('courses.offers'), `<ul class="pq-plain text-m"><li>${t('offers.program', { name: esc(p.name) })}</li><li>${t('offers.college', { college: esc(p.collegeName) })}</li></ul>`)}
        ${card('seat', t('courses.slots'), `<p class="text-m pq-slotline">${markSvg(si.mark, 18)}<span><b>${si.word}</b> · <span class="num">${si.text}</span></span></p>${bar(s)}`)}
        ${card('link', t('courses.links'), `<p class="text-m"><a class="pq-linka" href="${COLLEGES_URL}" target="_blank" rel="noopener">${t('courses.link')}</a></p>`)}</div>`;
      const rows = CURRICULUM[subjYear] || [], units = rows.reduce((n, r) => n + r[2], 0);
      const subjects = `<h3 class="pq-dark__title">${t('courses.curriculum')}</h3>
        <div class="pq-years" role="group" aria-label="${t('courses.subjects')}">${[1, 2, 3, 4].map((y) => `<button type="button" class="pq-year" data-year="${y}" aria-pressed="${y === subjYear}">${t('courses.year', { n: y })}</button>`).join('')}</div>
        <div class="pq-cur">${rows.length ? `<ul class="pq-cur__list">${rows.map(([c, n, u]) => `<li><span><b>${esc(c)}:</b> ${esc(n)}</span><b class="num">${u} ${t('courses.units')}</b></li>`).join('')}</ul><p class="pq-cur__total"><span>${t('courses.total')}</span><b class="num">${units} ${t('courses.units')}</b></p>` : `<p class="text-m">${t('courses.majorsLater')}</p>`}</div>
        <p class="caption pq-ondark">${t('courses.sampleSubjects')}</p>`;
      return `<button type="button" class="pq-link" data-back>← ${t('courses.back')}</button>
        <div><h1 class="heading-l">${esc(p.code)}</h1><p class="text-m pq-soft">${esc(p.name)}</p></div>
        <section class="pq-goldband"><div class="pq-cstats"><div><p class="num-l num">${p.inLine}</p><p class="text-s">${t('courses.inLineLabel')}</p></div><div><p class="heading-m">${waitText(p.wait)}</p><p class="text-s">${t('courses.waitLabel')}</p></div></div></section>
        <div class="pq-info"><div class="pq-itabs" role="tablist">${['overview', 'subjects'].map((k) => `<button type="button" role="tab" class="pq-itab" data-ctab="${k}" aria-selected="${courseTab === k}">${t('courses.tab.' + k)}</button>`).join('')}</div>
          <section class="pq-ipanel" role="tabpanel">${courseTab === 'overview' ? overview : subjects}</section></div>`;
    }
    const picker = `<div class="pq-selwrap"><label for="pq-college">${t('courses.college')}</label><select class="pq-sel" id="pq-college" data-college><option value="all">${t('courses.allColleges')}</option>${store.getColleges().map((c) => `<option value="${esc(c.code)}"${courseCollege === c.code ? ' selected' : ''}>${esc(c.code)} · ${esc(c.name)}</option>`).join('')}</select></div>`;
    return `${hero(t('courses.title'))}
      ${topBento()}
      ${picker}
      <div class="pq-field"><label for="pq-csearch" class="sr-only">${t('courses.search')}</label><input class="pq-input" id="pq-csearch" type="search" placeholder="${t('courses.search')}" value="${esc(courseQuery)}" autocomplete="off"></div>
      <div class="pq-courselist" data-courselist>${courseListHTML()}</div>`;
  }
  function exploreTab(v) {
    const e = store.exploreView(), sel = exploreCollege || v.stall.row;
    const rows = Object.fromEntries(e.rows.map((r) => [r.code, r])), maxLine = Math.max(1, ...e.rows.map((r) => r.inLine));
    const tile = (c) => `<button type="button" class="cm-tile${c === sel ? ' is-sel' : ''}${c === v.stall.row ? ' is-mine' : ''}" style="--heat:${(0.03 + 0.14 * (rows[c].inLine / maxLine)).toFixed(3)}" data-explore-college="${esc(c)}" aria-pressed="${c === sel}" aria-label="${esc(c)}, ${rows[c].inLine} ${t('explore.waiting')}${c === v.stall.row ? ', ' + t('explore.yourRow') : ''}">
      <span class="cm-tile__code">${esc(c)}</span><span class="cm-tile__n num">${rows[c].inLine}</span><span class="caption">${t('explore.waiting')}</span>${c === v.stall.row ? '<i class="cm-dot" aria-hidden="true"></i>' : ''}</button>`;
    const zone = (k) => {
      const z = CAMPUSES[k], codes = e.rows.map((r) => r.code).filter((c) => campusOf(c) === k);
      const gate = k === 'mabini' ? `<ol class="cm-path" aria-label="${t('explore.path')}"><li><span class="cm-pin" aria-hidden="true">${CI.pin}</span>${z.landmarks[0]}</li><li>${z.landmarks[1]}</li><li>${z.landmarks[2]}</li></ol>` : '';
      const others = (k === 'mabini' ? z.landmarks.slice(3) : z.landmarks);
      return `<div class="cm-zone cm-zone--${k}"><div><h3 class="heading-s">${z.name}</h3><p class="caption pq-soft">${z.tag} · ${z.where}</p></div>${gate}
        <div class="cm-tiles">${codes.map(tile).join('')}</div><ul class="cm-marks">${others.map((l) => `<li class="caption">${l}</li>`).join('')}</ul></div>`;
    };
    const cv = store.collegeView(sel), campus = CAMPUSES[campusOf(sel)], known = sel in COLLEGE_CAMPUS;
    const pct = cv.slotsTotal ? Math.round((100 * cv.slotsLeft) / cv.slotsTotal) : 0;
    const course = (c) => {
      const k = c.slotsLeft === 0 ? 'full' : c.slotsLeft <= 10 ? 'almost' : 'ok';
      return `<li><button type="button" class="cm-course" data-course="${esc(c.code)}" data-fromexplore><span class="cm-course__main"><span class="heading-s">${esc(c.code)}</span><span class="caption pq-soft">${esc(c.name)}</span>
        <span class="caption cm-course__slots">${k === 'ok' ? '' : markSvg('problem', 14)}<b>${t('slots.' + k)}</b> · <span class="num">${t('slots.text', { left: c.slotsLeft, total: c.slotsTotal })}</span></span>${barOf(c.slotsLeft, c.slotsTotal)}</span>
        <span class="cm-course__side"><span class="num-m num">${c.inLine}</span><span class="caption pq-soft">${t('courses.inLineLabel')}</span><span class="caption">${waitText(c.wait)}</span></span></button></li>`;
    };
    const widget = `<section class="pq-dark cm-widget" id="cm-widget" aria-label="${esc(cv.name)}"><p class="pq-dark__title">${esc(cv.code)} · ${campus.name}</p>
      <h2 class="cm-widget__t">${esc(cv.name)}</h2>
      <div class="cm-stats"><div><b class="num">${cv.waiting}</b><span class="caption">${t('explore.waiting')}</span></div><div><b class="num">${cv.slotsLeft}</b><span class="caption">${t('explore.slotsLeft')}</span></div><div><b class="num">${cv.courses.length}</b><span class="caption">${t('explore.courses')}</span></div></div>
      <div class="pq-bar cm-bar" role="img" aria-label="${cv.slotsLeft} / ${cv.slotsTotal}"><i style="width:${pct}%"></i></div>
      <div class="pq-inner cm-list"><ul class="cm-courses">${cv.courses.map(course).join('')}</ul></div>
      <div class="cm-where"><span class="cm-pin cm-pin--g" aria-hidden="true">${CI.pin}</span><p class="caption"><b>${t('explore.where')}</b> ${campus.guide}${known ? '' : ' ' + t('explore.confirm')}</p></div></section>`;
    const total = e.total || 1, pe = Math.round((100 * e.enrolled) / total), pi = Math.round((100 * e.inProgress) / total);
    const enrollees = `<section class="en" aria-label="${t('explore.enrollees')}"><div class="en-hero"><p class="pq-dark__title">${t('explore.enrollees')}</p>
        <p class="en-big num">${e.enrolled.toLocaleString('en-US')}</p><p class="text-m en-sub">${t('explore.enrolled')} · <span class="num">${pe}%</span> ${t('explore.ofExpected', { n: total.toLocaleString('en-US') })}</p>
        <div class="en-bar" role="img" aria-label="${t('explore.enrolled')} ${e.enrolled}, ${t('explore.inProgress')} ${e.inProgress}, ${t('explore.notArrived')} ${e.notArrived}"><i class="en-bar__a" style="width:${pe}%"></i><i class="en-bar__b" style="width:${pi}%"></i></div></div>
      <div class="en-grid"><div class="en-tile en-tile--gold"><b class="num">${e.inProgress.toLocaleString('en-US')}</b><span class="text-s">${t('explore.inProgress')}</span></div><div class="en-tile"><b class="num">${e.notArrived.toLocaleString('en-US')}</b><span class="text-s">${t('explore.notArrived')}</span></div></div></section>`;
    return `${hero(t('explore.title'))}
      <section class="pq-card cm"><h2 class="heading-m">${t('explore.campus')}</h2><p class="text-s pq-soft">${t('explore.tapCollege')}</p>${zone('mabini')}${zone('ndc')}${zone('mhdp')}<p class="caption pq-soft">${t('explore.mapNote2')}</p></section>
      ${widget}
      <section class="pq-card"><h2 class="heading-m">${t('explore.longest')}</h2><ol class="pq-longest">${e.longest.map((p) => `<li><button type="button" class="pq-crow" data-course="${esc(p.code)}" data-fromexplore><span class="pq-crow__main"><span class="heading-s">${esc(p.code)}</span><span class="caption pq-soft">${esc(p.name)}</span></span><span class="pq-crow__side"><span class="num-m num">${p.inLine}</span><span class="caption pq-soft">${waitText(p.wait)}</span></span></button></li>`).join('')}</ol></section>
      ${enrollees}`;
  }
  const toggle = (flag, label, help, on) => `<label class="pq-toggle"><input type="checkbox" role="switch" data-flag="${flag}" ${on ? 'checked' : ''}><span class="pq-toggle__ui" aria-hidden="true"></span><span><span class="heading-s pq-block">${label}</span>${help ? `<span class="caption pq-soft pq-block">${help}</span>` : ''}</span></label>`;
  function profileTab(v) {
    const seg = (items, cur, attr) => `<div class="pq-seg" role="group">${items.map(([val, lab]) => `<button type="button" class="pq-seg__b" ${attr}="${val}" aria-pressed="${String(val) === String(cur)}">${lab}</button>`).join('')}</div>`;
    const phone = v.guardianPhone ? t('profile.guardianSet', { mask: '••••••' + v.guardianPhone.slice(-3) }) : '';
    return `${hero(t('profile.title'))}
      <section class="pq-card"><dl class="pq-dl"><div><dt class="caption pq-soft">${t('profile.permit')}</dt><dd class="num">${esc(store.mask(v.permit))}</dd></div>
        <div><dt class="caption pq-soft">${t('profile.course')}</dt><dd>${esc(v.stall.code)} · ${esc(v.course)}</dd></div>
        <div><dt class="caption pq-soft">${t('profile.ticket')}</dt><dd class="num">${store.ticketLabel(v.no)}</dd></div></dl>
        <p class="heading-s">${t('profile.language')}</p>${seg([['en', 'English'], ['fil', 'Filipino']], getLang(), 'data-langset')}</section>
      <section class="pq-card pq-stackc"><h2 class="heading-m">${t('profile.a11y')}</h2>
        <div><p class="heading-s">${t('a11y.textSize')}</p>${seg([[100, '100%'], [125, '125%'], [150, '150%'], [200, '200%']], settings.text, 'data-textsize')}</div>
        ${toggle('contrast', t('a11y.contrast'), t('a11y.contrastHelp'), settings.contrast)}
        ${toggle('writing', t('a11y.writing'), t('a11y.writingHelp'), v.access.writing)}
        ${toggle('guide', t('a11y.guide'), t('a11y.guideHelp'), v.access.guide)}
        <p class="caption pq-soft">${t('a11y.privacy')}</p></section>
      <section class="pq-card pq-stackc"><h2 class="heading-m">${t('profile.guardian')}</h2><p class="text-s pq-soft">${t('profile.guardianHelp')}</p>
        <div class="pq-field"><label for="pq-gphone" class="heading-s">${t('profile.guardianPhone')}</label><input class="pq-input num" id="pq-gphone" type="tel" inputmode="tel" value="${esc(v.guardianPhone || '')}" autocomplete="off"></div>
        ${phone ? `<p class="caption pq-soft">${phone}</p>` : ''}<button type="button" class="pq-btn pq-btn--quiet" data-phone-save>${t('profile.save')}</button>${phoneNote ? `<p class="caption" role="status">${phoneNote}</p>` : ''}</section>
      <button type="button" class="pq-link" data-leave>${t('profile.leave')}</button>`;
  }
  const nav = () => `<nav class="pq-nav" aria-label="Student">${['dashboard', 'courses', 'explore', 'profile'].map((k) =>
    `<button type="button" class="pq-nav__b" data-tab="${k}" ${tab === k ? 'aria-current="page"' : ''}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg><span class="caption">${t('nav.' + k)}</span></button>`).join('')}</nav>`;
  const fullTicket = (v) => `<div class="pq-fullticket" role="dialog" aria-modal="true" aria-label="${t('a11y.showStaff')}"><p class="eyebrow">${t('ticket.queueNumber')}</p><p class="pq-fullticket__no num">${store.ticketLabel(v.no)}</p>
    <p class="heading-l">${stallLabel(v.stall.code)}</p><p class="text-m">${placeLabel(v.stall.row)}</p><button type="button" class="pq-btn" data-closefull>${t('a11y.close')}</button></div>`;

  function joinView() {
    const opts = store.getColleges().map((c) => `<optgroup label="${esc(c.code)} · ${esc(c.name)}">${c.programs.map((p) => `<option value="${esc(p.code)}"${draft.stall === p.code ? ' selected' : ''}>${esc(p.code)} · ${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
    const permitErr = joinError?.field === 'permit' ? problem(t(joinError.key, { mask: joinError.mask })) : '';
    const courseErr = joinError?.field === 'course' ? problem(t('err.course')) : '';
    return `${header()}<main class="pq-page pq-join"><h1 class="heading-l">${t('join.title')}</h1><form data-join novalidate class="pq-join" style="padding:0">
      <div class="pq-field"><label for="pq-permit">${useName ? t('join.name') : t('join.permit')}</label><input class="pq-input num" id="pq-permit" name="permit" autocomplete="off" value="${esc(draft.permit)}" ${permitErr ? 'aria-invalid="true"' : ''}>${permitErr}
        <button type="button" class="pq-link" data-toggle-id>${useName ? t('join.usePermit') : t('join.useName')}</button></div>
      <div class="pq-field"><label for="pq-first">${t('join.firstName')}</label><input class="pq-input" id="pq-first" name="first" autocomplete="given-name" value="${esc(draft.name)}"><p class="caption pq-soft">${t('join.firstNameHint')}</p></div>
      <div class="pq-field"><label for="pq-course">${t('join.course')}</label><select class="pq-input" id="pq-course" name="course" ${courseErr ? 'aria-invalid="true"' : ''}><option value="">${t('join.coursePlaceholder')}</option>${opts}</select>${courseErr}</div>
      <div class="pq-field"><label for="pq-gp">${t('join.guardianPhone')}</label><input class="pq-input num" id="pq-gp" name="gphone" type="tel" inputmode="tel" autocomplete="off" value="${esc(draft.gphone)}"><p class="caption pq-soft">${t('join.guardianPhoneHint')}</p></div>
      <button class="pq-btn" type="submit">${t('join.submit')}</button></form><p class="text-s pq-soft">${t('join.noPhone')}</p></main>`;
  }

  // ---------- render ----------
  function announce(v) {
    const stall = stallLabel(v.stall.code);
    return v.status === 'called' ? t('sr.called', { stall }) : v.status === 'enrolled' ? t('sr.enrolled') : v.status === 'next' ? t('sr.next', { stall }) : v.status === 'hold' ? t('hold.title') : t('sr.ahead', { n: v.ahead });
  }
  function render(force) {
    const no = store.myTicketNo(), v = no ? store.view(no) : null;
    const ae = document.activeElement;
    if (!force && ae && ui.contains(ae) && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && ae.type !== 'checkbox') {
      if (ae.id === 'pq-csearch') { const l = ui.querySelector('[data-courselist]'); if (l) l.innerHTML = courseListHTML(); }
      return;
    }
    const dyn = v && tab === 'explore' ? JSON.stringify([store.exploreView(), store.collegeView(exploreCollege || v.stall.row)]) : v && tab === 'courses' ? JSON.stringify(store.coursesView().map((c) => c.programs.map((p) => [p.inLine, p.slotsLeft, p.wait.minutes]))) : v && tab === 'explore' ? JSON.stringify(store.exploreView().rows) : '';
    const sig = JSON.stringify([getLang(), tab, courseSel, exploreCollege, courseTab, subjYear, courseCollege, showFull, settings, reqs, phoneNote, dyn, v && [v.status, v.ahead, v.est, v.stale, fmtTime(v.updatedAt), v.doneAt, Object.keys(v.done).length, v.slots, v.rowWaiting, v.access, v.guardianPhone], !v && [joinError, useName], store.isOffline()]);
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const prevScroll = ui.querySelector('.pq-page') ? null : 0;
    const wrapCls = `pq-view${settings.contrast ? ' pq-hc' : ''}`;
    const zoom = settings.text !== 100 ? ` style="zoom:${settings.text / 100}"` : '';
    if (!v) { ui.innerHTML = `<div class="${wrapCls}"${zoom}>${joinView()}</div>`; lastStatus = null; return; }
    const became = v.status === 'called' && lastStatus !== 'called';
    const body = { dashboard: () => dashboard(v), courses: coursesTab, explore: () => exploreTab(v), profile: () => profileTab(v) }[tab]();
    ui.innerHTML = `<div class="${wrapCls}"${zoom}>${v.status === 'called' ? callBanner(v, became) : ''}${header()}<main class="pq-page" id="pq-main">${body}</main>
      <footer class="pq-footer"><p class="caption">${t('footer.text')}</p></footer>
      <div class="pq-dock">${nav()}</div>${showFull ? fullTicket(v) : ''}</div>`;
    if (became && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    else if (v.status === 'next' && lastStatus && lastStatus !== 'next' && navigator.vibrate) navigator.vibrate([120, 90, 120]);
    if (!el.closest('[data-hub-split]')) document.title = v.status === 'called' ? t('page.titleCalled') : t('page.title');
    const msg = announce(v); if (lastMsg !== null && msg !== lastMsg) live.textContent = msg; lastMsg = msg;
    lastStatus = v.status;
    if (pendingScroll) { pendingScroll = false; ui.querySelector('#cm-widget')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }); }
  }
  const rerender = () => { lastSig = ''; render(true); };
  const scrollTop = () => (el.closest('[data-scroll]') || window).scrollTo?.(0, 0);

  // ---------- events ----------
  bindLang(el, rerender, setLang);
  const syncDraft = () => {
    const g = (n) => el.querySelector(`[name=${n}]`);
    if (g('permit')) draft.permit = g('permit').value; if (g('course')) draft.stall = g('course').value; if (g('first')) draft.name = g('first').value; if (g('gphone')) draft.gphone = g('gphone').value;
  };
  const speak = (v) => {
    const stall = stallLabel(v.stall.code), no = store.ticketLabel(v.no).split('').join(' ');
    const text = v.status === 'called' ? t('speak.called', { no, stall }) : v.status === 'next' ? t('speak.next', { no, stall }) : v.status === 'hold' ? t('speak.hold', { no, stall }) : v.status === 'enrolled' ? t('speak.enrolled') : v.est.few ? t('speak.few', { no, ahead: v.ahead, stall }) : t('speak.inline', { no, ahead: v.ahead, min: v.est.minutes, stall });
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = getLang() === 'fil' ? 'fil-PH' : 'en-PH'; speechSynthesis.speak(u); } catch { /* unsupported */ }
  };
  el.addEventListener('click', (e) => {
    const q = (s) => e.target.closest(s);
    if (q('[data-toggle-id]')) { syncDraft(); useName = !useName; joinError = null; draft.permit = ''; return rerender(); }
    const tb = q('[data-tab]'); if (tb) { tab = tb.dataset.tab; courseSel = null; phoneNote = ''; rerender(); return scrollTop(); }
    const ec = q('[data-explore-college]'); if (ec) { exploreCollege = ec.dataset.exploreCollege; pendingScroll = true; return rerender(); }
    const ctab = q('[data-ctab]'); if (ctab) { courseTab = ctab.dataset.ctab; return rerender(); }
    const yr = q('[data-year]'); if (yr) { subjYear = Number(yr.dataset.year); return rerender(); }
    const cb = q('[data-course]'); if (cb) { if (cb.hasAttribute('data-fromexplore')) tab = 'courses'; courseSel = cb.dataset.course; rerender(); return scrollTop(); }
    if (q('[data-back]')) { courseSel = null; return rerender(); }
    if (q('[data-showfull]')) { showFull = true; return rerender(); }
    if (q('[data-closefull]')) { showFull = false; return rerender(); }
    if (q('[data-read]')) { const v = store.view(store.myTicketNo()); if (v) speak(v); return; }
    const ts = q('[data-textsize]'); if (ts) { settings = a11y.set({ text: Number(ts.dataset.textsize) }); return rerender(); }
    const ls = q('[data-langset]'); if (ls) { setLang(ls.dataset.langset); return rerender(); }
    if (q('[data-phone-save]')) { store.setGuardianPhone(store.myTicketNo(), el.querySelector('#pq-gphone').value); phoneNote = t('profile.saved'); return rerender(); }
    if (q('[data-leave]')) { store.leave(); tab = 'dashboard'; courseSel = null; return rerender(); }
    if (q('[data-resume]')) { store.resumeProgress(store.myTicketNo()); return; }
  });
  el.addEventListener('change', (e) => {
    const r = e.target.closest('[data-req]');
    if (r) { reqs = r.checked ? [...new Set([...reqs, r.dataset.req])] : reqs.filter((k) => k !== r.dataset.req); try { localStorage.setItem(REQ_KEY, JSON.stringify(reqs)); } catch { /* ignore */ } return rerender(); }
    const col = e.target.closest('[data-college]'); if (col) { courseCollege = col.value; return rerender(); }
    const f = e.target.closest('[data-flag]'); if (!f) return;
    if (f.dataset.flag === 'contrast') settings = a11y.set({ contrast: f.checked });
    else store.setAccess(store.myTicketNo(), { [f.dataset.flag]: f.checked });
    rerender();
  });
  el.addEventListener('input', (e) => { if (e.target.id === 'pq-csearch') { courseQuery = e.target.value; const l = ui.querySelector('[data-courselist]'); if (l) l.innerHTML = courseListHTML(); } });
  el.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-join]')) return;
    e.preventDefault(); syncDraft();
    if (!draft.permit.trim()) joinError = { field: 'permit', key: 'err.permitEmpty' };
    else {
      const res = store.join({ permit: useName ? draft.permit + ' (name)' : draft.permit, stall: draft.stall, name: draft.name, guardianPhone: draft.gphone });
      if (res.error === 'permit') joinError = { field: 'permit', key: 'err.permit', mask: res.mask };
      else if (res.error === 'course') joinError = { field: 'course' };
      else joinError = null;
    }
    rerender();
    if (joinError) el.querySelector(joinError.field === 'permit' ? '[name=permit]' : '[name=course]')?.focus(); else scrollTop();
  });
  const esc2 = (e) => { if (e.key === 'Escape' && showFull) { showFull = false; rerender(); } };
  document.addEventListener('keydown', esc2);

  const off = store.subscribe(() => render());
  render();
  return () => { off(); document.removeEventListener('keydown', esc2); el.innerHTML = ''; };
}
