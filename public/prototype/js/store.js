import collegeData from './colleges.js';
// Shared mock store. One source of truth in localStorage, synced across tabs.
// Swap this file for the real server client after the 12:00 feature lock; the exports stay the same.

const KEY = 'isqolar.v5';
const ME = 'isqolar.me';
const SPEED = 60;            // 1 simulated minute = 1 real second
const DEMO = window.__PQ_DEMO || new URLSearchParams(location.search).has('demo');
const STALE_MS = DEMO ? 8000 : 60000;               // student/staff: 60 s on the venue network
export const GUARDIAN_STALE_MS = DEMO ? 15000 : 180000; // guardian page: 3 min
const EARLY_UNTIL = 10;      // D5: "Early estimate" until a stall has served 10 students
const EXPECTED_TOTAL = 3600; // simulated morning: freshmen expected today
const STEP_ORDER = ['check-in', 'document-check', 'validation', 'main-line', 'course-stall'];
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0, O, 1, I, L

let colleges = collegeData;
let state = null;
let offline = false;
let lastOk = Date.now();
let started = false;
const listeners = new Set();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('isqolar') : null;

const pad = (n) => String(n).padStart(4, '0');
export const ticketLabel = (no) => pad(no);
const clone = (o) => JSON.parse(JSON.stringify(o));
function nextNo() {                       // ticket numbers stay four digits: wrap at 9999 and never reuse a real ticket's number
  let n;
  do { n = state.counter++; if (n > 9999) { state.counter = 2; n = 1; } } while (state.tickets[n]);
  return n;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gapMs = (s) => (s.svc / s.interviewers) * 60000 / SPEED;

function seed() {
  const r = rng(2026);
  const now = Date.now();
  const s = { v: 3, counter: 1, stalls: {}, tickets: {}, byPermit: {}, byGuardian: {}, lastUndo: null, lastAction: null };
  for (const c of colleges) {
    for (const p of c.programs) {
      const stall = {
        code: p.code, college: c.code,
        svc: 3 + Math.floor(r() * 4), interviewers: r() < 0.35 ? 2 : 1,
        served: Math.floor(r() * 16),
        queue: [], serving: null, held: [], manual: false, nextAt: 0,
        slotsTotal: 40 + Math.floor(r() * 41), slotsLeft: 0,
      };
      stall.slotsLeft = Math.min(stall.slotsTotal - 4, 18 + Math.floor(r() * 35));
      const len = 2 + Math.floor(r() * 13);
      for (let i = 0; i < len; i++) stall.queue.push(s.counter++);
      stall.serving = stall.queue.shift();
      stall.nextAt = now + gapMs(stall) * (0.3 + r() * 0.7);
      s.stalls[p.code] = stall;
    }
  }
  // Demo student for the guardian sign-in (also what the student view's prefilled permit joins as).
  const no = s.counter++, min = 60000, code = 'JUAN47';
  s.tickets[no] = { no, permit: '2026-00123-MN-0', name: 'Juan', stall: 'BSIT', joinedAt: now, guardianCode: code, guardianPhone: '09171234567', otp: '482913', access: { writing: false, guide: false },
    done: { 'check-in': now - 55 * min, 'document-check': now - 40 * min, 'validation': now - 25 * min, 'main-line': now - 8 * min }, calledAt: null, doneAt: null };
  s.byPermit['2026-00123-mn-0'] = no; s.byGuardian[code] = no; s.stalls.BSIT.queue.push(no);
  return s;
}

function load() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ } channel?.postMessage('change'); }
function notify() { listeners.forEach((fn) => fn()); }

export async function init() {
  if (state) return;
  state = load() || seed();
  save();
  const reload = () => { state = load() || state; lastOk = Date.now(); notify(); };
  channel?.addEventListener('message', reload);
  window.addEventListener('storage', (e) => { if (e.key === KEY) reload(); });
}
export function start() {                      // one shared clock for every mounted view
  if (started) return; started = true;
  setInterval(tick, 2000); tick();
}
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getColleges = () => colleges;
export const stepOrder = () => STEP_ORDER;
export const isDemo = () => DEMO;

// ---- simulation: other students are served over time (paused on stalls a staff member has taken over) ----
export function tick() {
  if (!state) return;
  if (offline) { notify(); return; }
  state = load() || state;
  const now = Date.now();
  let changed = false;
  for (const stall of Object.values(state.stalls)) {
    if (stall.queue.length < 12 && Math.random() < 0.3) { stall.queue.push(nextNo()); changed = true; }   // new arrivals keep the morning going
    if (stall.manual) continue;
    const cur = stall.serving != null ? state.tickets[stall.serving] : null;
    if (cur && !cur.doneAt && cur.calledAt && now - cur.calledAt > 15000) {   // simulated staff finish a student nobody is serving by hand
      cur.done['course-stall'] = now; cur.doneAt = now; stall.served += 1; stall.slotsLeft = Math.max(0, stall.slotsLeft - 1);
      stall.serving = null; stall.nextAt = now + gapMs(stall); changed = true;
    }
    const holding = stall.serving != null && state.tickets[stall.serving] && !state.tickets[stall.serving].doneAt;
    let guard = 0;
    while (!holding && stall.nextAt <= now && stall.queue.length && guard++ < 50) {
      advanceStall(stall, stall.nextAt);
      changed = true;
      if (state.tickets[stall.serving]) break;
    }
    if (stall.nextAt <= now && !stall.queue.length) stall.nextAt = now + gapMs(stall);
  }
  const totalServed = Object.values(state.stalls).reduce((n, x) => n + x.served, 0);
  if (totalServed > EXPECTED_TOTAL * 0.92) {                // a new simulated day: counters reset, queues carry on
    const r = rng(Date.now() & 0xffff);
    for (const x of Object.values(state.stalls)) { x.served = Math.floor(r() * 12); x.slotsLeft = Math.min(x.slotsTotal - 4, 18 + Math.floor(r() * 35)); }
    changed = true;
  }
  if (changed) save();
  lastOk = now;
  notify();
}
function advanceStall(stall, at) {
  stall.serving = stall.queue.shift() ?? null;
  stall.served += 1;
  if (stall.served % 15 === 0) stall.slotsLeft = Math.max(2, stall.slotsLeft - 1);
  stall.nextAt = at + gapMs(stall);
  const t = state.tickets[stall.serving];
  if (t) t.calledAt = Date.now();
}

// ---- tickets ----
export function mask(permit) { const p = (permit || '').replace(/\s+/g, ''); return p ? '••••' + p.slice(-3) : ''; }
function newCode() { let c = ''; for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; return c; }
export const formatCode = (c) => (c ? c.slice(0, 3) + ' ' + c.slice(3) : '');

export function join({ permit, stall, name, guardianPhone }) {
  const p = (permit || '').trim();
  if (p.length < 6) return { error: 'permit', mask: mask(p) };
  if (!stall || !state.stalls[stall]) return { error: 'course' };
  const existing = state.byPermit[p.toLowerCase()];
  if (existing) { localStorage.setItem(ME, String(existing)); return { ok: true, no: existing, again: true }; }
  const no = nextNo();
  const now = Date.now(), min = 60000;
  let code = newCode(); while (state.byGuardian[code]) code = newCode();
  state.tickets[no] = {
    no, permit: p, name: (name || '').trim(), stall, joinedAt: now, guardianCode: code,
    guardianPhone: (guardianPhone || '').replace(/\D/g, ''), otp: String(100000 + Math.floor(Math.random() * 900000)),
    access: { writing: false, guide: false },
    done: { 'check-in': now - 55 * min, 'document-check': now - 40 * min, 'validation': now - 25 * min, 'main-line': now - 8 * min },
    calledAt: null, doneAt: null,
  };
  state.byPermit[p.toLowerCase()] = no;
  state.byGuardian[code] = no;
  state.stalls[stall].queue.push(no);
  localStorage.setItem(ME, String(no));
  save(); notify();
  return { ok: true, no };
}
export const myTicketNo = () => { const v = localStorage.getItem(ME); return v ? Number(v) : null; };
export const guardianCodeFor = (no) => state?.tickets[no]?.guardianCode || null;
export function estimate(stall, ahead) {
  const raw = (ahead * stall.svc) / stall.interviewers;
  return { few: raw < 5, minutes: Math.max(5, Math.round(raw / 5) * 5), early: stall.served < EARLY_UNTIL, raw };
}
function statusOf(stall, no, t) {
  if (t.doneAt) return 'enrolled';
  if (stall.held.includes(no)) return 'hold';
  if (stall.serving === no) return 'called';
  const ahead = stall.queue.indexOf(no);
  return ahead <= 0 ? 'next' : ahead <= 3 ? 'almost' : 'inline';
}
export function view(no) {
  const t = state?.tickets[no]; if (!t) return null;
  const stall = state.stalls[t.stall];
  const ahead = Math.max(0, stall.queue.indexOf(no));
  return {
    no, permit: t.permit, name: t.name, status: statusOf(stall, no, t), ahead, est: estimate(stall, ahead),
    slots: { left: stall.slotsLeft, total: stall.slotsTotal }, access: t.access, guardianPhone: t.guardianPhone,
    course: colleges.flatMap((c) => c.programs).find((p) => p.code === stall.code)?.name || stall.code,
    rowWaiting: Object.values(state.stalls).filter((x) => x.college === stall.college).reduce((n, x) => n + x.queue.length, 0),
    stall: { code: stall.code, row: stall.college, interviewers: stall.interviewers },
    done: t.done, doneAt: t.doneAt, calledAt: t.calledAt, joinedAt: t.joinedAt, stepOrder: STEP_ORDER,
    updatedAt: lastOk, stale: Date.now() - lastOk > STALE_MS,
  };
}

// ---- guardian ----
export function guardianView(code) {
  const c = (code || '').replace(/\s+/g, '').toUpperCase();
  const no = state?.byGuardian[c]; if (!no) return null;
  const t = state.tickets[no], stall = state.stalls[t.stall];
  return {
    firstName: (t.name || '').split(' ')[0], status: statusOf(stall, no, t),
    stall: { code: stall.code, row: stall.college }, done: t.done, doneAt: t.doneAt, stepOrder: STEP_ORDER, updatedAt: lastOk,
    slots: { left: stall.slotsLeft, total: stall.slotsTotal },
  };
}
export function guardianRequest(permit) {   // step 1: student permit. A real build sends the OTP by SMS; the prototype returns it so you can demo.
  const p = (permit || '').trim().toLowerCase(); const no = state.byPermit[p];
  if (!no) return { error: 'notfound' };
  const t = state.tickets[no];
  return { ok: true, phoneMask: t.guardianPhone ? '••••••' + t.guardianPhone.slice(-3) : '', demoOtp: t.otp };
}
export function guardianLogin(permit, otp) {
  const no = state.byPermit[(permit || '').trim().toLowerCase()];
  if (!no || state.tickets[no].otp !== String(otp || '').replace(/\D/g, '')) return { error: 'otp' };
  return { ok: true, code: state.tickets[no].guardianCode };
}
export function setAccess(no, patch) { const t = state.tickets[no]; if (!t) return; t.access = { ...t.access, ...patch }; save(); notify(); }
export function setGuardianPhone(no, phone) { const t = state.tickets[no]; if (!t) return; t.guardianPhone = (phone || '').replace(/\D/g, ''); save(); notify(); }
export function leave() { localStorage.removeItem(ME); notify(); }

// ---- staff ----
function snap(stallCodes, nos, action) {
  state.lastUndo = {
    stalls: Object.fromEntries(stallCodes.map((c) => [c, clone(state.stalls[c])])),
    tickets: Object.fromEntries(nos.filter((n) => state.tickets[n]).map((n) => [n, clone(state.tickets[n])])),
  };
  state.lastAction = action;
}
export function takeControl(code) { const s = state.stalls[code]; if (s && !s.manual) { s.manual = true; save(); notify(); } }
export function staffView(code) {
  const s = state.stalls[code]; if (!s) return null;
  const real = (n) => state.tickets[n];
  return {
    code, row: s.college, interviewers: s.interviewers, count: s.queue.length, manual: s.manual,
    slots: { left: s.slotsLeft, total: s.slotsTotal },
    serving: s.serving == null ? null : { no: s.serving, permit: real(s.serving)?.permit || null, name: real(s.serving)?.name || '', calledAt: real(s.serving)?.calledAt || null, access: real(s.serving)?.access || null },
    next: s.queue.slice(0, 5), held: s.held.slice(),
    toast: state.lastAction && state.lastAction.stall === code ? { ...state.lastAction, canUndo: !!state.lastUndo } : null,
    updatedAt: lastOk, stale: Date.now() - lastOk > STALE_MS,
  };
}
export function staffCallNext(code) {
  const s = state.stalls[code]; if (!s || s.serving != null || !s.queue.length) return false;
  const no = s.queue[0]; snap([code], [no], { type: 'call', no, stall: code });
  s.manual = true; s.serving = s.queue.shift();
  if (state.tickets[no]) state.tickets[no].calledAt = Date.now();
  save(); notify(); return true;
}
export function staffMarkDone(code) {
  const s = state.stalls[code]; if (!s || s.serving == null) return false;
  const no = s.serving; snap([code], [no], { type: 'done', no, stall: code });
  s.manual = true; s.served += 1; s.slotsLeft = Math.max(0, s.slotsLeft - 1); s.serving = null;
  const t = state.tickets[no]; if (t) { t.done['course-stall'] = Date.now(); t.doneAt = Date.now(); }
  save(); notify(); return true;
}
export function staffHold(code) {
  const s = state.stalls[code]; if (!s || s.serving == null) return false;
  const no = s.serving; snap([code], [no], { type: 'hold', no, stall: code });
  s.manual = true; s.held.push(no); s.serving = null;
  save(); notify(); return true;
}
export function staffRecall(code, no) {
  const s = state.stalls[code]; if (!s || !s.held.includes(no)) return false;
  snap([code], [no], { type: 'recall', no, stall: code });
  s.held = s.held.filter((n) => n !== no); s.queue.unshift(no);
  save(); notify(); return true;
}
export function undo() {
  const u = state.lastUndo; if (!u) return false;
  const stallCode = Object.keys(u.stalls)[0];
  for (const [c, s] of Object.entries(u.stalls)) state.stalls[c] = s;
  for (const [n, t] of Object.entries(u.tickets)) state.tickets[n] = t;
  state.lastUndo = null; state.lastAction = { type: 'undo', stall: stallCode };
  save(); notify(); return true;
}
export function undoEnrolled(no) {       // reopen a student marked done by mistake
  const t = state.tickets[no]; if (!t || !t.doneAt) return false;
  const s = state.stalls[t.stall]; snap([t.stall], [no], { type: 'reopen', no, stall: t.stall });
  t.doneAt = null; delete t.done['course-stall']; s.served = Math.max(0, s.served - 1); s.manual = true;
  if (s.serving == null) { s.serving = no; t.calledAt = Date.now(); } else s.queue.unshift(no);
  save(); notify(); return true;
}
export function resumeProgress(no) {
  const t = state.tickets[no]; if (!t || !t.doneAt) return false;
  const s = state.stalls[t.stall];
  t.doneAt = null;
  delete t.done['course-stall'];
  s.served = Math.max(0, s.served - 1);
  if (s.slotsLeft < s.slotsTotal) s.slotsLeft += 1;
  if (s.serving !== no && !s.queue.includes(no) && !s.held.includes(no)) s.queue.unshift(no);
  save(); notify();
  return true;
}
export function lookup(q) {
  const raw = (q || '').trim(); if (!raw) return null;
  let no = null;
  const m = raw.match(/(\d{1,4})$/);
  const byPermit = state.byPermit[raw.toLowerCase()];
  if (byPermit) no = byPermit;
  else if (/^(isqolar:ticket:)?\d{1,4}$/i.test(raw) && m) no = Number(m[1]);
  if (!no) return { notFound: true, mask: mask(raw) };
  const t = state.tickets[no];
  if (t) { const v = view(no); return { no, real: true, permit: t.permit, name: t.name, stall: t.stall, row: v.stall.row, status: v.status, ahead: v.ahead, done: t.done, doneAt: t.doneAt, steps: STEP_ORDER }; }
  for (const s of Object.values(state.stalls)) {
    if (s.serving === no) return { no, real: false, stall: s.code, row: s.college, status: 'called', ahead: 0 };
    const i = s.queue.indexOf(no); if (i >= 0) return { no, real: false, stall: s.code, row: s.college, status: 'inline', ahead: i };
    if (s.held.includes(no)) return { no, real: false, stall: s.code, row: s.college, status: 'hold', ahead: 0 };
  }
  return { notFound: true, mask: mask(raw) };
}

// ---- coordinator + board ----
export function adminView() {
  let enrolled = 0, inProgress = 0, slowest = null;
  const rows = colleges.map((c) => {
    const stalls = c.programs.map((p) => {
      const s = state.stalls[p.code];
      const est = estimate(s, s.queue.length);
      enrolled += s.served; inProgress += s.queue.length + (s.serving != null ? 1 : 0);
      const row = { code: p.code, name: p.name, inLine: s.queue.length, interviewers: s.interviewers, served: s.served, wait: est, raw: est.raw, manual: s.manual };
      if (!slowest || row.raw > slowest.raw) slowest = row;
      return row;
    });
    return { code: c.code, name: c.name, stalls, inLine: stalls.reduce((a, x) => a + x.inLine, 0), maxRaw: Math.max(...stalls.map((x) => x.raw)) };
  });
  return { rows, slowest, enrolled, inProgress, notArrived: Math.max(0, EXPECTED_TOTAL - enrolled - inProgress), updatedAt: lastOk, stale: Date.now() - lastOk > STALE_MS };
}
export function boardScreens() {      // one screen per college: up to eight stalls in two rows, no paging
  return colleges.map((c) => ({ id: c.code, label: c.code, college: c.code, codes: c.programs.map((p) => p.code) }));
}
export function boardView(codes) {
  return {
    stalls: codes.map((code) => { const s = state.stalls[code]; return { code, name: colleges.flatMap((c) => c.programs).find((p) => p.code === code)?.name || code, row: s.college, desks: s.interviewers, serving: s.serving, next: s.queue.slice(0, 3), waiting: s.queue.length }; }),
    updatedAt: lastOk, stale: Date.now() - lastOk > STALE_MS,
  };
}

// ---- prototype helpers ----
export function advance(no) {
  const t = state.tickets[no]; if (!t) return;
  const stall = state.stalls[t.stall];
  if (stall.serving === no) return;
  advanceStall(stall, Date.now()); save(); notify();
}
export function callMe(no) {
  const t = state.tickets[no]; if (!t) return;
  const stall = state.stalls[t.stall];
  stall.queue = stall.queue.filter((n) => n !== no); stall.held = stall.held.filter((n) => n !== no);
  stall.serving = no; t.calledAt = Date.now(); save(); notify();
}
export function markDone(no) { const t = state.tickets[no]; if (t && state.stalls[t.stall].serving === no) staffMarkDone(t.stall); }
export function resetAll() { localStorage.removeItem(KEY); localStorage.removeItem(ME); state = seed(); save(); notify(); }
export function toggleOffline() { offline = !offline; if (!offline) lastOk = Date.now(); notify(); return offline; }
export const isOffline = () => offline;

// ---- student: courses + explore ----
export function coursesView() {
  return colleges.map((c) => ({
    code: c.code, name: c.name,
    programs: c.programs.map((p) => {
      const s = state.stalls[p.code]; const est = estimate(s, s.queue.length);
      return { code: p.code, name: p.name, college: c.code, collegeName: c.name, inLine: s.queue.length, wait: est, slotsLeft: s.slotsLeft, slotsTotal: s.slotsTotal, interviewers: s.interviewers };
    }),
  }));
}
export function exploreView() {
  const a = adminView();
  const all = coursesView().flatMap((c) => c.programs).sort((x, y) => y.inLine - x.inLine);
  return { rows: a.rows.map((r) => ({ code: r.code, name: r.name, inLine: r.inLine })), longest: all.slice(0, 5), enrolled: a.enrolled, inProgress: a.inProgress, notArrived: a.notArrived, total: EXPECTED_TOTAL, updatedAt: lastOk };
}

export function collegeView(code) {
  const c = colleges.find((x) => x.code === code); if (!c) return null;
  const courses = c.programs.map((p) => {
    const st = state.stalls[p.code]; const est = estimate(st, st.queue.length);
    return { code: p.code, name: p.name, inLine: st.queue.length, wait: est, slotsLeft: st.slotsLeft, slotsTotal: st.slotsTotal };
  });
  return { code: c.code, name: c.name, courses, waiting: courses.reduce((n, x) => n + x.inLine, 0), slotsLeft: courses.reduce((n, x) => n + x.slotsLeft, 0), slotsTotal: courses.reduce((n, x) => n + x.slotsTotal, 0) };
}
