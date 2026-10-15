// js/sim.js -- simulation tick logic
// Imported by store.js; called inside tick().
// No exports visible outside store.js. (B11: simulation must not add store exports.)
//
// runTick(state, nextNoFn) mutates state in-place, returns true if anything changed.
// All constants mirror HANDOFF.md section 5 and PLAN-RECONCILIATION.md B2-B7.

// --- Constants ---
const ARRIVAL_PROB   = 0.30;   // 30% chance of a new ticket per stall per tick
const ARRIVAL_CAP    = 12;     // no new arrivals once queue.length >= this
const AUTO_FINISH_MS = 15_000; // 15 real seconds: auto-finish a called real student
const EXPECTED_TOTAL = 3600;   // day-reset when total served > 92% of this
const DAY_RESET_FRAC = 0.92;
const SLOT_DECAY_N   = 15;     // drop 1 slot every 15 served (floor 2)

// Internal: a simple seeded-ish PRNG so tests can call runTick deterministically
// if needed. Normal use just calls Math.random().
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Run one simulation tick.
 * @param {object} state   The full store state (mutated in place).
 * @param {function} nextNoFn  store's nextNo() -- returns a fresh 4-digit string.
 * @returns {boolean}  true if state was modified.
 */
export function runTick(state, nextNoFn) {
  let changed = false;
  const now = Date.now();

  // 1. Day reset: when total served across all stalls > 92% of EXPECTED_TOTAL,
  //    reset served counts and slots (keep queues and real tickets).
  const totalServed = Object.values(state.stalls).reduce((s, st) => s + st.served, 0);
  if (totalServed > EXPECTED_TOTAL * DAY_RESET_FRAC) {
    for (const st of Object.values(state.stalls)) {
      st.served = 0;
      const total = st.slotsTotal;
      st.slotsLeft = Math.min(total - 4, 18 + rand(0, 35));
      // clamp
      st.slotsLeft = Math.max(2, Math.min(st.slotsLeft, total));
    }
    changed = true;
  }

  for (const st of Object.values(state.stalls)) {
    // 2. Auto-finish: a called real student nobody serves within 15 s.
    //    "Real" = their permit is in byPermit (they joined themselves).
    //    Juan is real; sim-created tickets are sim tickets (permit starts with 'SIM-').
    if (st.serving) {
      const tk = state.tickets[st.serving];
      if (tk && tk.calledAt && !_isSimTicket(tk)) {
        const elapsed = now - tk.calledAt;
        if (elapsed >= AUTO_FINISH_MS) {
          _finishServing(state, st, tk, now);
          changed = true;
        }
      } else if (tk && tk.calledAt && _isSimTicket(tk)) {
        // Auto-finish sim tickets after one svc-minute window (svc real seconds)
        const svcMs = st.svc * 1000; // svc real seconds = svc sim-minutes
        if (now - tk.calledAt >= svcMs) {
          _finishServing(state, st, tk, now);
          changed = true;
        }
      }
    }

    // 3. Skip auto-serve if a staff member has signed in (manual flag).
    if (st.manual) continue;

    // 4. Auto-call next if nothing is being served and queue has tickets.
    if (!st.serving && st.queue.length > 0) {
      const no = st.queue.shift();
      st.serving = no;
      const tk = state.tickets[no];
      if (tk) tk.calledAt = now;
      changed = true;
    }

    // 5. Arrivals: 30% chance per tick if queue < 12.
    if (st.queue.length < ARRIVAL_CAP && Math.random() < ARRIVAL_PROB) {
      const no = nextNoFn();
      const permit = `SIM-${no}`;
      state.counter = parseInt(no, 10);
      const tk = {
        no,
        permit,
        name:         `Student ${no}`,
        stall:        st.code,
        joinedAt:     now,
        guardianCode: null,
        guardianPhone: null,
        otp:          null,
        access:       { writing: false, guide: false },
        done:         {},
        calledAt:     null,
        doneAt:       null,
      };
      state.tickets[no] = tk;
      state.byPermit[permit] = no;
      st.queue.push(no);
      changed = true;
    }
  }

  return changed;
}

// --- Internal helpers ---

function _isSimTicket(tk) {
  return tk.permit && tk.permit.startsWith('SIM-');
}

function _finishServing(state, st, tk, now) {
  st.serving = null;
  st.served += 1;

  // Slot decay: drop 1 every SLOT_DECAY_N served, floor 2, clamp to total
  if (st.served % SLOT_DECAY_N === 0) {
    st.slotsLeft = Math.max(2, st.slotsLeft - 1);
  }
  st.slotsLeft = Math.min(st.slotsLeft, st.slotsTotal);

  // Mark the ticket done at the current active step
  const step = _activeStep(tk);
  if (step !== null) {
    tk.done[step] = now;
    // Check full enrollment
    const allSteps = [1, 2, 3, 4, 5];
    if (allSteps.every(s => tk.done[s])) {
      tk.doneAt = now;
    }
  }

  // Clean up byPermit for sim tickets (they are ephemeral)
  if (_isSimTicket(tk)) {
    delete state.byPermit[tk.permit];
    delete state.tickets[tk.no];
  }
}

function _activeStep(tk) {
  for (let s = 1; s <= 5; s++) {
    if (!tk.done[s]) return s;
  }
  return null;
}
