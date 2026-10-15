// IsQolar shared mock store
// Persisted: localStorage key isqolar.v5
// Cross-tab sync: BroadcastChannel('isqolar') + storage event
// Simulation tick: store.start() ticks every 2 real seconds (SPEED = 60: 1 sim-min = 1 real-sec)
//
// FROZEN API â€” do not add exports after M1.
// Full export list is in isqolar-plan.md Sub-Task 1.

import { colleges } from './colleges.js';
import { runTick } from './sim.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY    = 'isqolar.v5';
const CHANNEL_NAME   = 'isqolar';
const TICK_MS        = 2000;          // 2 real seconds per tick
export const SPEED   = 60;            // 1 sim-min = 1 real-sec; each tick = 2 sim-min
export const GUARDIAN_STALE_MS = 15_000;  // 15 s demo (3 min production)
const STALE_MS       = 8_000;         // 8 s demo (60 s production)
const EXPECTED_TOTAL = 3600;          // day-reset threshold numerator basis
const DEMO_PERMIT    = '2026-00123-MN-0';
const DEMO_NAME      = 'Juan';
const DEMO_STALL     = 'BSIT';
const DEMO_GUARDIAN_CODE = 'JUAN47';
const DEMO_GUARDIAN_PHONE = '09171234567';
const DEMO_OTP       = '482913';
const DEMO_STAFF_PIN = '1234';

// ---------------------------------------------------------------------------
// Step order (Decision 1 â€” never hardcoded in screens, always read from here)
// ---------------------------------------------------------------------------
export const stepOrder = [
  { step: 1, station: 'Admission',        what: 'Submit admission documents and entrance credentials' },
  { step: 2, station: 'College / Department', what: 'Student picks course, joins that course line; interview and program tagging' },
  { step: 3, station: 'Medical Services', what: 'Submit chest X-ray and Health Information Form' },
  { step: 4, station: 'Registration Card', what: 'Printing of the Registration Card' },
  { step: 5, station: 'ID Card',          what: 'ID issuance, last official step' },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
let _state    = null;
let _subs     = [];
let _channel  = null;
let _tickTimer = null;
let _offline  = false;
let _lastTick = 0;

function _emit() {
  if (_offline) return;
  _lastTick = Date.now();
  for (const fn of _subs) { try { fn(_state); } catch (_) {} }
  try { _channel && _channel.postMessage(JSON.stringify(_state)); } catch (_) {}
}

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch (_) {}
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function _rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Four-digit zero-padded ticket number, skipping numbers in real use. */
function nextNo() {
  const used = new Set();
  if (_state) {
    for (const s of Object.values(_state.stalls)) {
      for (const n of s.queue) used.add(n);
      if (s.serving) used.add(s.serving);
      for (const n of s.held) used.add(n);
    }
    for (const tk of Object.values(_state.tickets)) {
      used.add(tk.no);
    }
  }
  let n = (_state ? _state.counter : 0) + 1;
  while (used.has(String(n).padStart(4, '0'))) {
    n = n >= 9999 ? 1 : n + 1;
  }
  return String(n).padStart(4, '0');
}

function _buildStall(code, college) {
  const total      = _rand(40, 80);
  const slotsLeft  = Math.min(total - 4, 18 + _rand(0, 35));
  const interviewers = Math.random() < 0.35 ? 2 : 1;
  const svc        = _rand(3, 6);
  return {
    code, college,
    svc, interviewers,
    served: 0,
    queue:  [],
    serving: null,
    held:  [],
    manual: false,
    nextAt: null,
    slotsTotal: total,
    slotsLeft,
  };
}

function _seedState() {
  const stalls = {};
  for (const col of colleges) {
    for (const prog of col.programs) {
      stalls[prog.code] = _buildStall(prog.code, col.code);
    }
  }

  // Seed Juan's ticket
  const juanNo = '0001';
  stalls[DEMO_STALL].queue.push(juanNo);

  const tickets = {
    [juanNo]: {
      no:           juanNo,
      permit:       DEMO_PERMIT,
      name:         DEMO_NAME,
      stall:        DEMO_STALL,
      joinedAt:     Date.now(),
      guardianCode: DEMO_GUARDIAN_CODE,
      guardianPhone: DEMO_GUARDIAN_PHONE,
      otp:          DEMO_OTP,
      access:       { writing: false, guide: false },
      done:         {},
      calledAt:     null,
      doneAt:       null,
    },
  };

  return {
    stalls,
    tickets,
    byPermit:  { [DEMO_PERMIT]: juanNo },
    byGuardian: { [DEMO_GUARDIAN_CODE]: DEMO_PERMIT },
    counter:   1,
    lastUndo:  null,
    lastAction: null,
  };
}

// ---------------------------------------------------------------------------
// Public API â€” FROZEN after M1
// ---------------------------------------------------------------------------

/** Initialise (or reload) state from localStorage. Call once at app startup. */
export function init() {
  const saved = _load();
  _state = saved || _seedState();

  try {
    _channel = new BroadcastChannel(CHANNEL_NAME);
    _channel.onmessage = (e) => {
      try {
        _state = JSON.parse(e.data);
        _emit();
      } catch (_) {}
    };
  } catch (_) {
    _channel = null;
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { _state = JSON.parse(e.newValue); _emit(); } catch (_) {}
    }
  });
}

/** Start the simulation tick. Imported and called by the simulation module. */
export function start() {
  if (_tickTimer) return;
  _tickTimer = setInterval(() => {
    tick();
  }, TICK_MS);
}
/** Advance one tick: run simulation, save, emit. */
/** Manually advance one tick (called by simulation or tests). */
export function tick() {
  _lastTick = Date.now();
  if (_state) { runTick(_state, nextNo); }
  _save();
  _emit();
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  _subs.push(fn);
  if (_state) { try { fn(_state); } catch (_) {} }
  return () => { _subs = _subs.filter(s => s !== fn); };
}

/** Return a read-only view of the full state (defensive copy). */
export function view() {
  return _state ? JSON.parse(JSON.stringify(_state)) : null;
}

/** Return all college/program data. */
export function getColleges() {
  return colleges;
}

/** Return true if running in demo mode. */
export function isDemo() {
  return !!(window.__PQ_DEMO || new URLSearchParams(location.search).get('demo'));
}

// --- Student actions ---

/**
 * Join a stall queue.
 * Returns { ok: true, no } on success or { ok: false, err } on failure.
 */
export function join({ permit, name, stall, guardianPhone }) {
  if (!_state) return { ok: false, err: 'not-init' };

  // Returning student
  if (_state.byPermit[permit]) {
    return { ok: true, no: _state.byPermit[permit], existing: true };
  }

  if (!_state.stalls[stall]) return { ok: false, err: 'bad-stall' };

  const no = nextNo();
  _state.counter = parseInt(no, 10);

  const ticket = {
    no,
    permit,
    name,
    stall,
    joinedAt: Date.now(),
    guardianCode: formatCode(no + permit.slice(-3)),
    guardianPhone: guardianPhone || null,
    otp:    null,
    access: { writing: false, guide: false },
    done:   {},
    calledAt: null,
    doneAt:   null,
  };

  _state.tickets[no] = ticket;
  _state.byPermit[permit] = no;
  _state.stalls[stall].queue.push(no);
  _state.lastAction = { type: 'join', no };

  _save();
  _emit();
  return { ok: true, no };
}

/** Get the student view for ticket number `no`. */
export function myTicketNo(permit) {
  return _state ? (_state.byPermit[permit] || null) : null;
}

/** Get student-facing view for a ticket. */
function view_student(no) {
  if (!_state || !_state.tickets[no]) return null;
  const tk = _state.tickets[no];
  const stall = _state.stalls[tk.stall];
  if (!stall) return null;

  const pos = stall.queue.indexOf(no);
  const ahead = pos === -1 ? 0 : pos;
  const serving = stall.serving === no;
  const held = stall.held.includes(no);

  return {
    no,
    name: tk.name,
    stall: tk.stall,
    ahead,
    serving,
    held,
    wait: estimate(tk.stall, ahead),
    steps: stepOrder.map(s => ({
      ...s,
      status: tk.done[s.step] ? 'done'
            : serving && s.step === _activeStep(tk) ? 'your-turn'
            : s.step === _activeStep(tk) ? 'in-line'
            : tk.done[s.step - 1] ? 'not-yet'
            : 'not-yet',
      doneAt: tk.done[s.step] || null,
    })),
    doneAt: tk.doneAt,
    calledAt: tk.calledAt,
    guardianCode: tk.guardianCode,
    guardianPhone: tk.guardianPhone,
    slotsLeft: stall.slotsLeft,
    slotsTotal: stall.slotsTotal,
    access: tk.access,
  };
}

function _activeStep(tk) {
  for (const s of stepOrder) {
    if (!tk.done[s.step]) return s.step;
  }
  return null;
}

/** Leave the queue (student cancels their own ticket). */
export function leave(no) {
  if (!_state || !_state.tickets[no]) return;
  const tk = _state.tickets[no];
  const stall = _state.stalls[tk.stall];
  if (stall) {
    stall.queue = stall.queue.filter(n => n !== no);
    stall.held  = stall.held.filter(n => n !== no);
    if (stall.serving === no) stall.serving = null;
  }
  _state.byPermit[tk.permit] = undefined;
  delete _state.byPermit[tk.permit];
  _state.byGuardian[tk.guardianCode] = undefined;
  delete _state.byGuardian[tk.guardianCode];
  delete _state.tickets[no];
  _state.lastAction = { type: 'leave', no };
  _save();
  _emit();
}

/** Return the guardian code for a ticket number. */
export function guardianCodeFor(no) {
  return _state && _state.tickets[no] ? _state.tickets[no].guardianCode : null;
}

/** Guardian read-only view. */
export function guardianView(permit, code) {
  if (!_state) return null;
  const storedPermit = _state.byGuardian[code];
  if (!storedPermit || storedPermit !== permit) return null;
  const no = _state.byPermit[permit];
  if (!no) return null;
  const tk = _state.tickets[no];
  if (!tk) return null;
  const stall = _state.stalls[tk.stall];
  const ahead = stall ? stall.queue.indexOf(no) : -1;

  return {
    name: tk.name.split(' ')[0],
    stall: tk.stall,
    ahead: ahead === -1 ? 0 : ahead,
    steps: stepOrder.map(s => ({
      ...s,
      status: tk.done[s.step] ? 'done' : s.step === _activeStep(tk) ? 'in-line' : 'not-yet',
      doneAt: tk.done[s.step] || null,
    })),
    doneAt: tk.doneAt,
    calledAt: tk.calledAt,
  };
}

/** Request guardian access (step 1 of 2 â€” just validates permit exists). */
export function guardianRequest(permit) {
  if (!_state) return { ok: false };
  return { ok: !!_state.byPermit[permit] };
}

/** Validate guardian code and return access token (permit). */
export function guardianLogin(permit, code) {
  if (!_state) return { ok: false };
  const stored = _state.byGuardian[code];
  if (!stored || stored !== permit) return { ok: false };
  return { ok: true, permit };
}

/** Set accessibility flags for a ticket. */
export function setAccess(no, flags) {
  if (!_state || !_state.tickets[no]) return;
  Object.assign(_state.tickets[no].access, flags);
  _save();
  _emit();
}

/** Update guardian phone number. */
export function setGuardianPhone(no, phone) {
  if (!_state || !_state.tickets[no]) return;
  _state.tickets[no].guardianPhone = phone;
  _save();
  _emit();
}

// --- Staff actions ---

/** Staff sign-in: set a stall's manual flag. Returns true on success. */
export function takeControl(stallCode, pin) {
  if (!_state) return false;
  if (pin !== DEMO_STAFF_PIN) return false;
  if (!_state.stalls[stallCode]) return false;
  _state.stalls[stallCode].manual = true;
  _save();
  _emit();
  return true;
}

/** Staff view for a stall. */
export function staffView(stallCode) {
  if (!_state || !_state.stalls[stallCode]) return null;
  const s = _state.stalls[stallCode];
  return {
    code: s.code,
    serving: s.serving,
    queue:   s.queue.slice(0, 5),
    held:    s.held,
    slotsLeft: s.slotsLeft,
    slotsTotal: s.slotsTotal,
    served: s.served,
    servingTicket: s.serving ? _state.tickets[s.serving] : null,
  };
}

/** Call next in a stall's queue. */
export function staffCallNext(stallCode) {
  if (!_state || !_state.stalls[stallCode]) return null;
  const s = _state.stalls[stallCode];
  if (s.serving) return null; // already serving someone
  if (s.queue.length === 0) return null;

  _state.lastUndo = JSON.stringify(_state.stalls[stallCode]);
  const no = s.queue.shift();
  s.serving = no;
  const tk = _state.tickets[no];
  if (tk) tk.calledAt = Date.now();
  s.nextAt = null;
  _state.lastAction = { type: 'callNext', stallCode, no };
  _save();
  _emit();
  return no;
}

/** Mark the current serving ticket as done. */
export function staffMarkDone(stallCode) {
  if (!_state || !_state.stalls[stallCode]) return null;
  const s = _state.stalls[stallCode];
  if (!s.serving) return null;

  _state.lastUndo = JSON.stringify({ stall: _state.stalls[stallCode], tickets: { ..._state.tickets } });
  const no = s.serving;
  s.serving = null;
  s.served  += 1;
  if (s.slotsLeft > 2) s.slotsLeft -= 1;

  const tk = _state.tickets[no];
  if (tk) {
    const step = _activeStep(tk) || 1;
    tk.done[step] = Date.now();
    const allDone = stepOrder.every(s2 => tk.done[s2.step]);
    if (allDone) tk.doneAt = Date.now();
  }
  _state.lastAction = { type: 'markDone', stallCode, no };
  _save();
  _emit();
  return no;
}

/** Place the serving ticket on hold. */
export function staffHold(stallCode) {
  if (!_state || !_state.stalls[stallCode]) return null;
  const s = _state.stalls[stallCode];
  if (!s.serving) return null;

  _state.lastUndo = JSON.stringify(_state.stalls[stallCode]);
  const no = s.serving;
  s.serving = null;
  s.held.push(no);
  _state.lastAction = { type: 'hold', stallCode, no };
  _save();
  _emit();
  return no;
}

/** Recall a held ticket back to being served. */
export function staffRecall(stallCode, no) {
  if (!_state || !_state.stalls[stallCode]) return false;
  const s = _state.stalls[stallCode];
  const idx = s.held.indexOf(no);
  if (idx === -1) return false;

  _state.lastUndo = JSON.stringify(_state.stalls[stallCode]);
  s.held.splice(idx, 1);
  s.serving = no;
  const tk = _state.tickets[no];
  if (tk) tk.calledAt = Date.now();
  _state.lastAction = { type: 'recall', stallCode, no };
  _save();
  _emit();
  return true;
}

/** Undo the last staff action on a stall. */
export function undo(stallCode) {
  if (!_state || !_state.lastUndo) return false;
  try {
    const prev = JSON.parse(_state.lastUndo);
    if (prev.code === stallCode) {
      _state.stalls[stallCode] = prev;
    } else if (prev.stall && prev.stall.code === stallCode) {
      _state.stalls[stallCode] = prev.stall;
      Object.assign(_state.tickets, prev.tickets);
    }
    _state.lastUndo = null;
    _state.lastAction = { type: 'undo', stallCode };
    _save();
    _emit();
    return true;
  } catch (_) { return false; }
}

/** Undo a "mark done" step for a specific ticket (lookup use case). */
export function undoEnrolled(no, step) {
  if (!_state || !_state.tickets[no]) return false;
  const tk = _state.tickets[no];
  if (!tk.done[step]) return false;
  delete tk.done[step];
  tk.doneAt = null;
  _state.lastAction = { type: 'undoEnrolled', no, step };
  _save();
  _emit();
  return true;
}

/** Lookup a ticket by permit or ticket number. */
export function lookup(query) {
  if (!_state) return null;
  const q = String(query).trim();
  // By ticket number
  if (_state.tickets[q]) return _state.tickets[q];
  // By permit
  const no = _state.byPermit[q];
  if (no && _state.tickets[no]) return _state.tickets[no];
  return null;
}

/** Admin/coordinator view (also used by Explore). */
export function adminView() {
  if (!_state) return null;
  return Object.values(_state.stalls).map(s => ({
    code: s.code,
    college: s.college,
    queue: s.queue.length,
    serving: s.serving,
    held: s.held.length,
    served: s.served,
    slotsLeft: s.slotsLeft,
    slotsTotal: s.slotsTotal,
    wait: estimate(s.code, s.queue.length),
  }));
}

/** Board pager: returns array of { college, stalls[] }. */
export function boardScreens() {
  if (!_state) return [];
  const map = {};
  for (const col of colleges) {
    map[col.code] = { college: col, stalls: [] };
  }
  for (const s of Object.values(_state.stalls)) {
    if (map[s.college]) map[s.college].stalls.push(s);
  }
  return Object.values(map).filter(m => m.stalls.length > 0);
}

/** Board view for a specific college. */
export function boardView(collegeCode) {
  if (!_state) return null;
  const screens = boardScreens();
  return screens.find(s => s.college.code === collegeCode) || null;
}

/** Courses tab view. */
export function coursesView(filter = {}) {
  if (!_state) return [];
  return Object.values(_state.stalls).map(s => {
    const col = colleges.find(c => c.code === s.college);
    const prog = col ? col.programs.find(p => p.code === s.code) : null;
    return {
      code: s.code,
      name: prog ? prog.name : s.code,
      college: s.college,
      collegeName: col ? col.name : s.college,
      queue: s.queue.length,
      slotsLeft: s.slotsLeft,
      slotsTotal: s.slotsTotal,
    };
  }).filter(item => {
    if (filter.college && item.college !== filter.college) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    }
    return true;
  });
}

/** Explore tab view. */
export function exploreView() {
  if (!_state) return null;
  const stalls = Object.values(_state.stalls);
  const total = stalls.reduce((sum, s) => sum + s.served + s.queue.length + (s.serving ? 1 : 0), 0);
  return {
    byCollege: boardScreens(),
    totalEnrolled: stalls.reduce((sum, s) => sum + s.served, 0),
    totalInProgress: stalls.reduce((sum, s) => sum + s.queue.length + (s.serving ? 1 : 0) + s.held.length, 0),
    total,
  };
}

/** College detail view. */
export function collegeView(collegeCode) {
  if (!_state) return null;
  const col = colleges.find(c => c.code === collegeCode);
  if (!col) return null;
  return {
    college: col,
    stalls: Object.values(_state.stalls).filter(s => s.college === collegeCode),
  };
}

// --- Utilities ---

/** Estimate wait in simulated minutes for a stall at `ahead` people. */
export function estimate(stallCode, ahead) {
  if (!_state || !_state.stalls[stallCode]) return null;
  const s = _state.stalls[stallCode];
  if (ahead === 0) return 0;
  const raw = ahead * s.svc / s.interviewers;
  if (raw < 5) return -1; // signal for "a few minutes"
  return Math.round(raw / 5) * 5;
}

/** Mask a permit number: show only last 3 digits, rest replaced with bullets. */
export function mask(permit) {
  if (!permit) return '';
  return permit.slice(0, -3).replace(/[^-]/g, '\u2022') + permit.slice(-3);
}

/** Generate a guardian code from a seed string (no look-alike chars). */
export function formatCode(seed) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 6; i++) {
    code += chars[h % chars.length];
    h = (h * 1664525 + 1013904223) >>> 0;
  }
  return code;
}

/** Human-readable ticket label: "Ticket 0427" */
export function ticketLabel(no) {
  return `Ticket ${no}`;
}

/** Reset to a fresh simulated morning. */
export function resetAll() {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }
  _state = _seedState();
  _offline = false;
  _save();
  _emit();
}

/** Freeze / unfreeze subscriber callbacks (simulates network loss). */
export function toggleOffline(force) {
  _offline = force !== undefined ? !!force : !_offline;
  _emit();
  return _offline;
}

/** True if currently offline (updates frozen). */
export function isOffline() {
  return _offline;
}

/** Milliseconds since last tick (used for stale detection). */
export function timeSinceTick() {
  if (_lastTick === 0) return 0;
  return Date.now() - _lastTick;
}

// --- Prototype-only helpers (used by simulation and tests) ---

/** Advance simulation time by N ticks (used by simulation module). */
export function advance(ticks = 1) {
  if (!_state) return;
  // Simulation logic implemented in simulation module; store just records.
  _state.lastAction = { type: 'advance', ticks };
  _save();
  _emit();
}

/** Immediately call the demo student's ticket (for testing). */
export function callMe() {
  if (!_state) return;
  const permit = DEMO_PERMIT;
  const no = _state.byPermit[permit];
  if (!no) return;
  const tk = _state.tickets[no];
  if (!tk) return;
  const stall = _state.stalls[tk.stall];
  if (!stall) return;
  const idx = stall.queue.indexOf(no);
  if (idx > -1) stall.queue.splice(idx, 1);
  stall.serving = no;
  tk.calledAt = Date.now();
  _state.lastAction = { type: 'callMe', no };
  _save();
  _emit();
}

/** Immediately mark the demo student done at the next step (for testing). */
export function markDone() {
  if (!_state) return;
  const permit = DEMO_PERMIT;
  const no = _state.byPermit[permit];
  if (!no) return;
  const tk = _state.tickets[no];
  if (!tk) return;
  const step = _activeStep(tk);
  if (!step) return;
  tk.done[step] = Date.now();
  const stall = _state.stalls[tk.stall];
  if (stall && stall.serving === no) stall.serving = null;
  const allDone = stepOrder.every(s2 => tk.done[s2.step]);
  if (allDone) tk.doneAt = Date.now();
  _state.lastAction = { type: 'markDone', no, step };
  _save();
  _emit();
}

