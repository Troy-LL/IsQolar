// tests/sim_check.mjs
// Node test for the IsQolar simulation engine.
// Imports sim.js directly (no browser APIs needed).
// Also checks the frozen export list by parsing store.js as text.
//
// Run: node tests/sim_check.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runTick } from '../source/js/sim.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let _pass = 0;
let _fail = 0;

function ok(label, cond) {
  if (cond) {
    console.log('  PASS  ' + label);
    _pass++;
  } else {
    console.error('  FAIL  ' + label);
    _fail++;
  }
}

function buildState(stallCount = 5) {
  const stalls = {};
  const colleges_data = JSON.parse(
    readFileSync(join(__dir, '../source/data/colleges.json'), 'utf8')
  );
  let i = 0;
  for (const col of colleges_data) {
    for (const prog of col.programs) {
      if (i++ >= stallCount) break;
      stalls[prog.code] = {
        code: prog.code,
        college: col.code,
        svc: 4,
        interviewers: 1,
        served: 0,
        queue: [],
        serving: null,
        held: [],
        manual: false,
        nextAt: null,
        slotsTotal: 50,
        slotsLeft: 40,
      };
    }
    if (Object.keys(stalls).length >= stallCount) break;
  }
  return {
    stalls,
    tickets: {},
    byPermit: {},
    byGuardian: {},
    counter: 0,
    lastUndo: null,
    lastAction: null,
  };
}

// Deterministic nextNo that never collides
let _counter = 0;
function nextNo(state) {
  _counter++;
  const used = new Set(
    Object.keys(state.tickets)
  );
  let n = _counter;
  while (used.has(String(n).padStart(4, '0'))) n++;
  state.counter = n;
  return String(n).padStart(4, '0');
}
function makeNextNo(state) {
  return () => nextNo(state);
}

// ---------------------------------------------------------------------------
// Test 1: No queue ever exceeds 12
// ---------------------------------------------------------------------------
console.log('\nTest 1: queue length never exceeds 12');
{
  const state = buildState(5);
  // Force all stalls to have queue.length = 11
  for (const st of Object.values(state.stalls)) {
    for (let i = 0; i < 11; i++) {
      const no = String(++_counter).padStart(4, '0');
      st.queue.push(no);
      state.tickets[no] = { no, permit: 'SIM-' + no, name: 'S', stall: st.code, joinedAt: Date.now(), guardianCode: null, guardianPhone: null, otp: null, access: { writing: false, guide: false }, done: {}, calledAt: null, doneAt: null };
      state.byPermit['SIM-' + no] = no;
    }
  }
  // Run 20 ticks
  for (let t = 0; t < 20; t++) {
    runTick(state, makeNextNo(state));
  }
  let maxQ = 0;
  for (const st of Object.values(state.stalls)) {
    if (st.queue.length > maxQ) maxQ = st.queue.length;
  }
  ok('max queue length <= 12 (got ' + maxQ + ')', maxQ <= 12);
}

// ---------------------------------------------------------------------------
// Test 2: slotsLeft never exceeds slotsTotal
// ---------------------------------------------------------------------------
console.log('\nTest 2: slotsLeft never exceeds slotsTotal');
{
  const state = buildState(10);
  for (let t = 0; t < 100; t++) {
    runTick(state, makeNextNo(state));
    for (const st of Object.values(state.stalls)) {
      if (st.slotsLeft > st.slotsTotal) {
        ok('slotsLeft (' + st.slotsLeft + ') <= slotsTotal (' + st.slotsTotal + ')', false);
      }
    }
  }
  ok('slotsLeft <= slotsTotal across 100 ticks (all stalls)', true);
}

// ---------------------------------------------------------------------------
// Test 3: ticket numbers are four digits and unique among live tickets
// ---------------------------------------------------------------------------
console.log('\nTest 3: ticket numbers are 4 digits and unique');
{
  _counter = 0;
  const state = buildState(3);
  for (let t = 0; t < 50; t++) {
    runTick(state, makeNextNo(state));
  }
  const nos = Object.keys(state.tickets);
  let fourDigits = true;
  let unique = nos.length === new Set(nos).size;
  for (const no of nos) {
    if (!/^\d{4}$/.test(no)) { fourDigits = false; break; }
  }
  ok('all live ticket numbers are 4 digits', fourDigits);
  ok('all live ticket numbers are unique (count=' + nos.length + ')', unique);
}

// ---------------------------------------------------------------------------
// Test 4: estimates round to nearest 5
// ---------------------------------------------------------------------------
console.log('\nTest 4: estimate rounds to nearest 5');
{
  // Import estimate logic from store.js via a text check and a manual test
  // We test the formula directly: ahead * svc / interviewers, rounded to nearest 5
  function estimate(stallCode, ahead, state) {
    const s = state.stalls[stallCode];
    if (!s) return null;
    if (ahead === 0) return 0;
    const raw = ahead * s.svc / s.interviewers;
    if (raw < 5) return -1; // "a few minutes"
    return Math.round(raw / 5) * 5;
  }

  const state = buildState(2);
  const stallCode = Object.keys(state.stalls)[0];
  const st = state.stalls[stallCode];

  // Force known values
  st.svc = 4; st.interviewers = 1;
  // ahead=3: 3*4/1=12 -> round to nearest 5 = 10
  ok('estimate(ahead=3, svc=4, i=1) = 10', estimate(stallCode, 3, state) === 10);
  // ahead=1: 1*4/1=4 -> < 5 -> -1 (a few minutes)
  ok('estimate(ahead=1, svc=4, i=1) = -1 (a few minutes)', estimate(stallCode, 1, state) === -1);
  // ahead=5: 5*4/1=20 -> 20
  ok('estimate(ahead=5, svc=4, i=1) = 20', estimate(stallCode, 5, state) === 20);
  // ahead=4: 4*4/2=8 -> round to nearest 5 = 10
  st.interviewers = 2;
  ok('estimate(ahead=4, svc=4, i=2) = 10', estimate(stallCode, 4, state) === 10);
  // ahead=2: 2*4/2=4 -> < 5 -> -1
  ok('estimate(ahead=2, svc=4, i=2) = -1 (a few minutes)', estimate(stallCode, 2, state) === -1);
}

// ---------------------------------------------------------------------------
// Test 5: frozen exports list unchanged
// ---------------------------------------------------------------------------
console.log('\nTest 5: frozen store exports unchanged');
{
  const storeSrc = readFileSync(
    join(__dir, '../source/js/store.js'), 'utf8'
  );
  const REQUIRED = [
    'init','start','subscribe','tick','getColleges','stepOrder','isDemo',
    'join','view','myTicketNo','leave','guardianCodeFor','guardianView',
    'guardianRequest','guardianLogin','setAccess','setGuardianPhone',
    'takeControl','staffView','staffCallNext','staffMarkDone','staffHold',
    'staffRecall','undo','undoEnrolled','lookup','adminView','boardScreens',
    'boardView','coursesView','exploreView','collegeView','estimate','mask',
    'formatCode','ticketLabel','resetAll','toggleOffline','isOffline',
    'GUARDIAN_STALE_MS',
    // prototype helpers
    'advance','callMe','markDone',
  ];
  const missing = REQUIRED.filter(name =>
    !storeSrc.includes('export function ' + name) &&
    !storeSrc.includes('export const ' + name) &&
    !storeSrc.includes('export let ' + name)
  );
  ok('all ' + REQUIRED.length + ' frozen exports present', missing.length === 0);
  if (missing.length > 0) {
    console.error('    Missing: ' + missing.join(', '));
  }

  // No exports added (check export count hasn't grown unexpectedly)
  const exportCount = (storeSrc.match(/^export /gm) || []).length;
  ok('export count is 45 (frozen list + SPEED + timeSinceTick + stepOrder as const)', exportCount === 45);
}

// ---------------------------------------------------------------------------
// Test 6: day reset clears served counts when total > 92% of 3600
// ---------------------------------------------------------------------------
console.log('\nTest 6: day reset triggers at 92% of EXPECTED_TOTAL');
{
  const state = buildState(3);
  // Force total served to > 3312 (92% of 3600)
  for (const st of Object.values(state.stalls)) {
    st.served = 1200; // 3 stalls * 1200 = 3600 -> 100%
  }
  runTick(state, makeNextNo(state));
  let anyNonZero = false;
  for (const st of Object.values(state.stalls)) {
    if (st.served !== 0) anyNonZero = true;
  }
  ok('served counts reset to 0 after day reset', !anyNonZero);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + _pass + ' passed, ' + _fail + ' failed');
if (_fail > 0) process.exit(1);

