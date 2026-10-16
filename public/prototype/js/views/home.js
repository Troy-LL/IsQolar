import * as store from '../store.js';
import { esc } from '../ui.js';
import { t } from '../i18n.js';

const I = {
  ticket: '<path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 3"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 010 5.6M18 14.8c2 .6 3.5 2.3 3.5 5.2"/>',
  tap: '<path d="M9 11V5.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V12m0-1a1.5 1.5 0 013 0v4.5a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4 14.5a1.5 1.5 0 012.4-1.7L9 15"/>',
  chart: '<path d="M4 20V6M4 20h16M8 16v-4M12 16V9M16 16v-6"/>',
  access: '<circle cx="12" cy="5" r="2"/><path d="M5 9l7 1.5L19 9M12 10.5V15m0 0l-3 5m3-5l3 5"/>',
  wifi: '<path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
};
const ic = (k, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
const chip = (k) => `<span class="lp-chip" aria-hidden="true">${ic(k, 28)}</span>`;
const pill = (t) => `<span class="lp-pill">${t}</span>`;
const lab = (n) => store.ticketLabel(n);

const FAQ = [
  ['Do I need to install an app?', 'No. IsQolar opens in your phone’s browser when you scan the venue QR. There is nothing to download and no password.'],
  ['Can I leave the line to eat?', 'Your ticket keeps your place. When three or fewer people are ahead, stay near your stall. If you miss your call, staff can put you on hold and back in line.'],
  ['How accurate is the wait?', 'It is an estimate, rounded to 5 minutes, based on how fast your stall is serving. Early in the day it carries an “Early estimate” tag.'],
  ['What if I do not have a phone?', 'The check-in desk can create your ticket, and the Now serving board shows your number, so nothing depends on a phone.'],
  ['What can my guardian see?', 'Progress only: which step you are on and whether you are fully enrolled. Never your ticket number, QR code or permit number. They sign in with your permit number and a one-time code.'],
  ['Is my data safe?', 'By design it keeps the minimum: permit numbers are masked on shared screens, the board shows ticket numbers only, and accessibility flags are visible only to the staff at your stall (Data Privacy Act of 2012).'],
  ['Who is it for?', 'First-year, on-site enrollment at PUP Manila. It is not built for continuing students, transferees or graduate students.'],
  ['Does it work with weak signal?', 'It runs on one laptop or the venue’s local network, and every live screen shows when it last updated.'],
];

export function mount(el, { go }) {
  const prog = (code) => store.coursesView().flatMap((c) => c.programs).find((p) => p.code === code);
  const waitTxt = (w) => (w.few ? 'a few minutes' : `about ${w.minutes} min`);

  el.innerHTML = `<div class="lp">
    <section class="lp-hero" id="top">
      <h1 class="lp-h1">Turn your ${chip('ticket')} enrollment day<br>into a line you can see</h1>
      <p class="lp-lead">One ticket from check-in to “You’re fully enrolled”. See your place in line, about how long it will take, and when you can step away.</p>
      <div class="lp-cta"><button type="button" class="lp-btn" data-go="student">Get my ticket ${ic('arrow', 18)}</button><a class="lp-btn lp-btn--ghost" href="/chat.html">Chat</a><a class="lp-btn lp-btn--ghost" href="/map.html">Map</a><button type="button" class="lp-btn lp-btn--ghost" data-go="board">See the board</button></div>
      <div class="lp-art" aria-hidden="true">
        <svg class="lp-art__bowl" viewBox="0 0 1000 320" preserveAspectRatio="none"><defs><linearGradient id="lpbowl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#880000" stop-opacity=".14"/><stop offset=".5" stop-color="#ffcc00" stop-opacity=".16"/><stop offset="1" stop-color="#880000" stop-opacity=".10"/></linearGradient></defs>
          <path d="M0 50C250 150 750 150 1000 50V210C750 310 250 310 0 210Z" fill="url(#lpbowl)"/><path d="M0 50C250 150 750 150 1000 50" fill="none" stroke="rgba(136,0,0,.18)"/><path d="M0 210C250 310 750 310 1000 210" fill="none" stroke="rgba(136,0,0,.18)"/></svg>
        <span class="lp-float lp-float--a">Check-in</span><span class="lp-float lp-float--b">Documents</span><span class="lp-float lp-float--c">Validation</span><span class="lp-float lp-float--d">Main line</span>
        <span class="lp-art__bar"><span class="lp-art__badge">${ic('arrow', 16)}</span></span>
        <div data-live="hero"></div>
      </div>
    </section>

    <section class="lp-sec" id="features">
      ${pill('Features')}<h2 class="lp-h2">Everything enrollment day needs, ${chip('ticket')} <span class="lp-accent">in one queue</span></h2>
      <p class="lp-sub">A live line for every course stall, for students, guardians and staff.</p>
      <div class="lp-grid3">
        <article class="lp-card"><h3 class="lp-h3">Queue ticket and live wait</h3><p class="lp-p">Every student gets one number and sees people ahead and about how long.</p><div class="lp-mini" data-live="rows"></div></article>
        <article class="lp-card"><h3 class="lp-h3">Two-tap stall console</h3><p class="lp-p">Staff call the next student and mark done. Everything has Undo.</p>
          <div class="lp-mini lp-mini--center"><div class="lp-mini__card"><p class="lp-eyebrow">Now serving</p><p class="lp-big num">0502</p><span class="lp-btn lp-btn--sm" aria-hidden="true">Call next</span></div></div></article>
        <article class="lp-card"><h3 class="lp-h3">Line length through the day</h3><p class="lp-p">See which stalls are busiest and when. Simulated data shown here.</p>
          <div class="lp-mini"><svg viewBox="0 0 240 120" class="lp-chart" role="img" aria-label="Simulated line length through the day"><path d="M10 100h220M10 70h220M10 40h220" stroke="#e2dcd8" stroke-width="1"/><path d="M10 92C45 80 60 40 95 46s50 36 80 16 40-30 55-34" fill="none" stroke="#880000" stroke-width="3" stroke-linecap="round"/><path d="M10 98C50 94 70 76 105 80s55 14 80 4 35-10 45-14" fill="none" stroke="#ffb800" stroke-width="3" stroke-linecap="round"/></svg>
          <p class="lp-legend caption"><span class="lp-key lp-key--m"></span>Longest stall <span class="lp-key lp-key--g"></span>Average</p></div></article>
      </div>
    </section>

    <section class="lp-sec" id="benefits">
      ${pill('Benefits')}<h2 class="lp-h2">Built to help everyone ${chip('users')} <span class="lp-accent">stay informed</span></h2>
      <p class="lp-sub">Less guessing for students and guardians. Fewer repeated questions for staff.</p>
      <div class="lp-grid3 lp-bento">
        ${[['users', 'A ticket that follows you', 'One number from check-in to “You’re fully enrolled”, on your phone, on the board and at every desk.'],
           ['shield', 'Peace of mind from outside', 'Guardians see progress only, behind a one-time code. No ticket number, no QR, no permit number.'],
           ['tap', 'Two taps per student', 'Staff press Call next and Mark done. A short briefing is enough to run a stall.'],
           ['chart', 'See every line', 'A live count for every course, so students know where the line is short or long.'],
           ['access', 'Made for every student', 'Visual cues with vibration patterns, written-communication cards, large text and high contrast.'],
           ['wifi', 'Built for the venue', 'Runs on one laptop or the local network. No install for students.']].map(([k, t, d]) =>
          `<article class="lp-card lp-card--tile"><div class="lp-tile">${ic(k, 34)}</div><h3 class="lp-h3">${t}</h3><p class="lp-p">${d}</p></article>`).join('')}
      </div>
    </section>

    <section class="lp-sec" id="how">
      ${pill('How it works')}<h2 class="lp-h2">From the gym door to ${chip('check')} <span class="lp-accent">fully enrolled</span></h2>
      <div class="lp-steps">
        ${[['Step 1', 'Join with your permit', 'Scan the venue QR, enter your permit number and pick your course. Your ticket appears.', '<div class="lp-s__form"><span class="lp-s__field">2026-00123-MN-0</span><span class="lp-s__field">BSIT · BS Information Technology</span><span class="lp-btn lp-btn--sm">Get my ticket</span></div>'],
           ['Step 2', 'Wait anywhere you like', 'See how many are ahead and about how long. Step away when the line is long.', '<div class="lp-s__ticket"><p class="lp-eyebrow">Queue number</p><p class="lp-big num">0502</p><p class="lp-s__live"><b class="num">11</b> ahead · about <b class="num">35</b> min</p></div>'],
           ['Step 3', 'Get called, never miss it', 'A gold banner, a vibration and the Now serving board all show your number.', '<div class="lp-s__banner"><b>→ Your turn</b><span>Go to Stall BSIT</span></div>'],
           ['Step 4', 'You’re fully enrolled', 'Every step checks off. The last screen confirms it, and your guardian sees it too.', '<div class="lp-s__done"><span>${ic("check", 28)}</span><b>You’re fully enrolled</b></div>']].map(([s, t, d, art], i) =>
          `<article class="lp-step"><div class="lp-step__txt"><span class="lp-tag">${s}</span><h3 class="lp-h3">${t}</h3><p class="lp-p">${d}</p></div><div class="lp-step__art" aria-hidden="true"><span class="lp-step__no">0${i + 1}</span>${art.replace('${ic("check", 28)}', ic('check', 28))}</div></article>`).join('')}
      </div>
    </section>

    <section class="lp-sec" id="live">
      ${pill('Live count')}<h2 class="lp-h2">Check a course ${chip('chart')} <span class="lp-accent">before you queue</span></h2>
      <p class="lp-sub">Real numbers from the simulated morning. Pick a course to see its line and slots.</p>
      <div class="lp-calc">
        <div class="lp-card lp-calc__in"><label class="lp-label" for="lp-course">Course</label>
          <select class="lp-select" id="lp-course">${store.getColleges().map((c) => `<optgroup label="${esc(c.code)} · ${esc(c.name)}">${c.programs.map((p) => `<option value="${esc(p.code)}"${p.code === 'BSIT' ? ' selected' : ''}>${esc(p.code)} · ${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}</select>
          <p class="lp-p">Wait is the estimate for someone joining the line right now, rounded to 5 minutes.</p></div>
        <div class="lp-card lp-calc__out" data-live="calc"></div>
      </div>
    </section>

    <section class="lp-sec lp-sec--tight">
      <div class="lp-banner"><div class="lp-banner__txt"><span class="lp-pill lp-pill--inv">No surprises</span><h2 class="lp-h2 lp-h2--inv">No install. ${chip('wifi')} Login with your permit. No guessing.</h2>
        <p class="lp-p lp-p--inv">Built for the day: a phone browser, a ticket the check-in desk can create, and a board everyone can read.</p></div>
        <div class="lp-banner__card"><p class="lp-h3">Made for the venue</p><ul class="lp-checks"><li>${ic('check', 18)} Opens in any phone browser</li><li>${ic('check', 18)} Runs on the venue’s local network</li><li>${ic('check', 18)} Staff-assisted check-in for students without phones</li><li>${ic('check', 18)} English and Filipino</li><li>${ic('check', 18)} Accessibility settings built in</li></ul></div></div>
    </section>

    <section class="lp-sec" id="personas">
      ${pill(t('personas.pill'))}<h2 class="lp-h2">Choose a persona <span class="lp-accent">to preview</span></h2>
      <p class="lp-sub">${t('personas.sub')}</p>
      <div class="lp-grid3 lp-grid4">
        ${[['student', 'users', 'Student', 'Ticket, live wait, courses, explore and profile on a phone.'],
           ['guardian', 'shield', 'Guardian', 'Sign in with a permit number and a one-time code. Progress only.'],
           ['stall', 'tap', 'Staff', 'Sign in with a stall PIN. Call next, mark done, look up a ticket.'],
           ['board', 'ticket', 'Now serving board', 'The TV screen everyone in the gym reads.']].map(([k, i, tt, d]) =>
          `<article class="lp-card lp-card--tile"><div class="lp-tile">${ic(i, 30)}</div><h3 class="lp-h3">${tt}</h3><p class="lp-p">${d}</p><button type="button" class="lp-btn lp-btn--sm lp-btn--ghost lp-open" data-go="${k}" aria-label="Open the ${tt} prototype">Open ${ic('arrow', 16)}</button></article>`).join('')}
      </div>
      <div class="lp-tools"><p class="lp-eyebrow">Prototype tools</p><div class="lp-tools__row"><button type="button" class="lp-btn lp-btn--sm lp-btn--ghost" data-tool="reset">Reset the simulated morning</button><button type="button" class="lp-btn lp-btn--sm lp-btn--ghost" data-tool="net" aria-pressed="false">Simulate network loss: off</button></div>
        <p class="caption lp-soft">These are not part of the product. Network loss shows the “Not updating” state on every screen after a few seconds.</p></div>
    </section>

    <section class="lp-sec" id="faqs">
      ${pill('FAQs')}<h2 class="lp-h2">Curated <span class="lp-accent">questions</span></h2>
      <p class="lp-sub">Short answers for students, guardians and staff.</p>
      <div class="lp-faq">${FAQ.map(([q, a]) => `<details class="lp-q"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
    </section>

    <section class="lp-sec lp-final">
      <h2 class="lp-h2">Unlock a calmer ${chip('ticket')}<br><span class="lp-accent">enrollment day</span></h2>
      <p class="lp-sub">Open the prototype and try each view: student, guardian, staff and the board.</p>
      <div class="lp-cta"><button type="button" class="lp-btn" data-jump="personas">Try the prototype ${ic('arrow', 18)}</button></div>
    </section>

    <footer class="lp-foot">
      <div class="lp-foot__top"><div><p class="lp-foot__brand"><img class="logo" src="/brand/logo-light.png" alt=""><b>IsQolar</b></p><p class="caption lp-soft">Polytechnic University of the Philippines · Sta. Mesa, Manila</p></div>
        <div><p class="lp-foot__h">Preview</p>${['student', 'guardian', 'stall', 'board'].map((k) => `<button type="button" class="lp-flink" data-go="${k}">${{ student: 'Student', guardian: 'Guardian', stall: 'Staff', board: 'Now serving board' }[k]}</button>`).join('')}</div>
        <div><p class="lp-foot__h">This page</p>${[['features', 'Features'], ['how', 'How it works'], ['live', 'Live count'], ['faqs', 'FAQs']].map(([k, l]) => `<button type="button" class="lp-flink" data-jump="${k}">${l}</button>`).join('')}<a class="lp-flink" href="/chat.html">Chat</a><a class="lp-flink" href="/map.html">Map</a></div></div>
      <p class="lp-ghost" aria-hidden="true">IsQolar</p>
      <p class="caption lp-soft lp-foot__fine">Prototype for the ICS x IBM Bobathon. Numbers are a simulated morning.</p>
    </footer></div>`;

  const live = (k) => el.querySelector(`[data-live="${k}"]`);
  function update() {
    const netBtn = el.querySelector('[data-tool="net"]');
    if (netBtn) {
      const on = store.isOffline();
      netBtn.textContent = `Simulate network loss: ${on ? 'on' : 'off'}`;
      netBtn.setAttribute('aria-pressed', String(on));
    }
    const b = store.boardView(['BSIT', 'BSCS', 'BSA']);
    live('hero').innerHTML = b.stalls.map((s, i) => `<span class="lp-tk lp-tk--${'abc'[i]}"><span class="lp-tk__ok">${ic('check', 14)}</span><span><b class="num">${s.serving != null ? lab(s.serving) : '—'}</b><small>Now serving · ${esc(s.code)}</small></span></span>`).join('');
    live('rows').innerHTML = ['BSIT', 'BSCS', 'BSA'].map((c) => { const p = prog(c); return `<div class="lp-row"><span class="lp-row__b">${esc(c.slice(0, 2))}</span><span class="lp-row__t"><b>Stall ${esc(c)}</b><small><span class="num">${p.inLine}</span> in line</small></span><span class="lp-row__r">${waitTxt(p.wait)}</span></div>`; }).join('');
    const sel = el.querySelector('#lp-course'); const p = prog(sel.value);
    const pct = p.slotsTotal ? p.slotsLeft / p.slotsTotal : 0, len = 251.3;
    const word = p.slotsLeft === 0 ? 'Full' : p.slotsLeft <= 10 ? 'Almost full' : 'Open';
    live('calc').innerHTML = `<div class="lp-gauge"><svg viewBox="0 0 200 112" role="img" aria-label="${p.slotsLeft} of ${p.slotsTotal} slots left"><defs><linearGradient id="lpg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#880000"/><stop offset="1" stop-color="#ffcc00"/></linearGradient></defs>
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#e2dcd8" stroke-width="16" stroke-linecap="round"/><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="url(#lpg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(len * pct).toFixed(1)} ${len}"/></svg>
        <p class="lp-gauge__n num">${Math.round(pct * 100)}%</p><p class="caption">${word} · <span class="num">${p.slotsLeft} of ${p.slotsTotal}</span> slots left</p></div>
      <div class="lp-stats"><div><p class="lp-big num">${p.inLine}</p><p class="lp-p">in line at ${esc(p.code)}</p></div><div><p class="lp-big2">${waitTxt(p.wait)}</p><p class="lp-p">estimated wait</p></div></div>`;
  }
  el.addEventListener('change', (e) => { if (e.target.id === 'lp-course') update(); });
  el.addEventListener('click', (e) => {
    const tl = e.target.closest('[data-tool]');
    if (tl) {
      if (tl.dataset.tool === 'reset') { store.resetAll(); tl.textContent = 'Reset done'; setTimeout(() => { tl.textContent = 'Reset the simulated morning'; }, 1600); }
      else { store.toggleOffline(); }
      return;
    }
    const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
    const j = e.target.closest('[data-jump]'); if (j) el.querySelector('#' + j.dataset.jump)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  const off = store.subscribe(update);
  update();
  return () => { off(); el.innerHTML = ''; };
}
