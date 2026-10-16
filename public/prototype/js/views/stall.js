import * as store from '../store.js';
import { t, tEn } from '../i18n.js';
import { markSvg } from '../status-mark.js';
import { esc, fmtTime, stallLabel, placeLabel, header, problem } from '../ui.js';

const PICK = 'isqolar.stall';
const SIGNED = 'isqolar.staff';
const PIN = '1234'; // prototype only

export function mount(el) {
  let code = localStorage.getItem(SIGNED) || '';
  let pick = localStorage.getItem(PICK) || 'BSIT';
  let pinError = '', bigText = '';
  let lookupQ = '';
  let lastSig = '';
  if (code) store.takeControl(code);

  const lbl = (n) => store.ticketLabel(n);
  const staffBtn = (cls, action, label, key) => `<button type="button" class="pq-btn pq-btn--staff ${cls}" data-act="${action}"><span>${label}</span><kbd class="num-s num">${key}</kbd></button>`;

  function stallPicker(sel) {
    const opts = store.getColleges().map((c) => `<optgroup label="${esc(c.code)} · ${esc(c.name)}">${c.programs.map((p) =>
      `<option value="${esc(p.code)}"${p.code === sel ? ' selected' : ''}>${esc(p.code)} · ${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
    return `<div class="pq-field"><label for="pq-stallpick">${tEn('staff.pick')}</label><select class="pq-input" id="pq-stallpick" name="stall">${opts}</select></div>`;
  }

  function mainAction(sv) {
    if (sv.serving) {
      const s = sv.serving;
      return `<div class="pq-card pq-served"><p class="eyebrow pq-soft">${tEn('staff.serving')}</p>
          <p class="num-l num">${lbl(s.no)}</p>
          ${s.name ? `<p class="heading-m">${esc(s.name)}</p>` : ''}
          ${s.permit ? `<p class="num-s num">${esc(s.permit)}</p>` : ''}
          ${s.calledAt ? `<p class="num-s num pq-soft">${tEn('staff.calledAt', { time: fmtTime(s.calledAt) })}</p>` : ''}</div>
        ${s.access?.writing || s.access?.guide ? `<div class="pq-card pq-access">${s.access.guide ? `<p class="heading-s">${tEn('staff.guide')}</p>` : ''}${s.access.writing ? `<p class="heading-s">${tEn('staff.writing')}. ${tEn('staff.writingHelp')}</p><div class="pq-cards"><button type="button" class="pq-btn pq-btn--quiet" data-card="${esc(tEn('staff.card.ticket'))}">${tEn('staff.card.ticket')}</button><button type="button" class="pq-btn pq-btn--quiet" data-card="${esc(tEn('staff.card.wait'))}">${tEn('staff.card.wait')}</button><button type="button" class="pq-btn pq-btn--quiet" data-card="${esc(tEn('staff.card.go', { stall: stallLabel(code) }))}">${tEn('staff.card.go', { stall: stallLabel(code) })}</button></div>` : ''}</div>` : ''}
        <div class="pq-stack">${staffBtn('', 'done', tEn('staff.markDone'), 'D')}${staffBtn('pq-btn--quiet', 'hold', tEn('staff.hold'), 'H')}</div>`;
    }
    if (!sv.count) return `<div class="pq-card"><p class="text-m">${tEn('staff.nobody')}</p></div>`;
    return `<p class="num-m num">${tEn('staff.inLine', { n: sv.count })}</p>${staffBtn('', 'next', tEn('staff.callNext'), 'N')}`;
  }

  function lookupPanel() {
    let result = '';
    if (lookupQ.trim()) {
      const r = store.lookup(lookupQ);
      if (r?.notFound) result = problem(tEn('staff.notFound', { mask: esc(r.mask || lookupQ) }));
      else if (r) {
        const stallTxt = `${stallLabel(r.stall)} · ${placeLabel(r.row)}`;
        const st = r.status === 'enrolled' ? 'done' : r.status === 'called' ? 'your-turn' : r.status === 'hold' ? 'on-hold' : 'in-line';
        const word = { enrolled: 'Fully enrolled', called: 'Being served', hold: 'On hold', inline: `In line, ${tEn('staff.ahead', { n: r.ahead })}`, almost: `In line, ${tEn('staff.ahead', { n: r.ahead })}`, next: 'Next in line' }[r.status];
        let steps = '';
        if (r.real) {
          steps = '<ol class="pq-steplist">' + r.steps.map((s) => {
            const done = !!r.done[s];
            return `<li>${markSvg(done ? 'done' : s === 'course-stall' ? st : 'not-yet', 16)}<span class="text-s">${t('step.' + s)}</span>${s === 'course-stall' && r.doneAt ? `<button type="button" class="pq-btn pq-btn--quiet pq-btn--sm" data-reopen="${r.no}">${tEn('staff.reopen')}</button>` : ''}</li>`;
          }).join('') + '</ol>';
        }
        result = `<div class="pq-card pq-lookup"><p class="num-l num">${lbl(r.no)}</p>
          ${r.real ? `<p class="heading-m">${esc(r.name || '')}</p><p class="num-s num">${esc(r.permit)}</p>` : `<p class="text-s pq-soft">${tEn('staff.seeded')}</p>`}
          <p class="pq-statusline">${markSvg(st)}<span class="heading-s">${word}</span></p><p class="caption pq-soft">${stallTxt}</p>${steps}</div>`;
      }
    }
    return `<form class="pq-lookupform" data-lookup novalidate><div class="pq-field"><label for="pq-lookup">${tEn('staff.lookup')}</label>
      <div class="pq-inline"><input class="pq-input num" id="pq-lookup" name="lookup" autocomplete="off" value="${esc(lookupQ)}"><button class="pq-btn pq-btn--quiet pq-btn--fit" type="submit">${tEn('staff.lookupBtn')}</button></div></div>${result}</form>`;
  }

  function right(sv) {
    const next = sv.next.length ? `<ol class="pq-nums">${sv.next.map((n) => `<li class="num-m num">${lbl(n)}</li>`).join('')}</ol>` : `<p class="text-s pq-soft">${tEn('staff.empty')}</p>`;
    const held = sv.held.length ? `<ul class="pq-held">${sv.held.map((n) => `<li><span class="num-m num">${lbl(n)}</span><button type="button" class="pq-btn pq-btn--quiet pq-btn--sm" data-recall="${n}">${tEn('staff.recall')}</button></li>`).join('')}</ul>` : `<p class="text-s pq-soft">${tEn('staff.empty')}</p>`;
    return `<section class="pq-card"><h2 class="heading-m">${tEn('staff.overview')}</h2><p class="caption pq-soft">${tEn('staff.queueTitle')}</p>${next}</section>
      <section class="pq-card"><h2 class="heading-m">${tEn('staff.heldTitle')}</h2>${held}</section>`;
  }

  function toast(sv) {
    if (!sv.toast) return '';
    const tt = sv.toast;
    const text = tEn('staff.toast.' + tt.type, { no: tt.no ? lbl(tt.no) : '', stall: stallLabel(code) });
    return `<div class="pq-toast" role="status"><span class="text-s">${text}</span>${tt.canUndo ? `<button type="button" class="pq-toast__undo" data-act="undo">${tEn('staff.undo')} <kbd class="num-s num">U</kbd></button>` : ''}</div>`;
  }

  function signIn() {
    return `<div class="pq-view pq-view--staff">${header({ lang: false, label: 'Staff' })}<main class="pq-page pq-join"><h1 class="heading-l">${tEn('staff.signin')}</h1>
      <form data-signin novalidate class="pq-join" style="padding:0">${stallPicker(pick)}
        <div class="pq-field"><label for="pq-pin">${tEn('staff.pin')}</label><input class="pq-input num" id="pq-pin" name="pin" type="password" inputmode="numeric" autocomplete="off" ${pinError ? 'aria-invalid="true"' : ''}>${pinError ? problem(pinError) : ''}</div>
        <button class="pq-btn" type="submit">${tEn('staff.signinBtn')}</button></form><p class="caption pq-soft pq-hint">${tEn('staff.demoPin')}</p></main></div>`;
  }
  function render(force) {
    if (!code) { const ae0 = document.activeElement; if (!force && ae0 && el.contains(ae0) && ae0.tagName === 'INPUT') return; const sg = JSON.stringify(['signin', pinError, pick]); if (!force && sg === lastSig) return; lastSig = sg; el.innerHTML = signIn(); return; }
    const sv = store.staffView(code); if (!sv) return;
    const sig = JSON.stringify([code, bigText, sv.slots, sv.serving, sv.count, sv.next, sv.held, sv.toast, sv.stale, lookupQ, lookupQ.trim() ? store.lookup(lookupQ) : null]);
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const input = el.querySelector('[name=lookup]');
    const had = input && document.activeElement === input, pos = input?.selectionStart;
    const stale = sv.stale ? `<p class="pq-problem caption">${markSvg('problem', 16)}<span>${t('live.stale', { time: fmtTime(sv.updatedAt) })}</span></p>` : '';
    el.innerHTML = `<div class="pq-view pq-view--staff">${header({ lang: false, label: 'Staff' })}<main class="pq-page pq-staff">
      <div class="pq-staff__left">
        <div class="pq-staffhead"><div><h1 class="heading-l">${stallLabel(code)}</h1><p class="text-s pq-soft">${placeLabel(sv.row)} · ${sv.interviewers} ${sv.interviewers > 1 ? 'interviewers' : 'interviewer'} · ${tEn('staff.slots', { left: sv.slots.left, total: sv.slots.total })}</p></div><button type="button" class="pq-link" data-signout>${tEn('staff.signout')}</button></div>
        ${mainAction(sv)}<p class="caption pq-soft">${tEn('staff.sim')}</p>${stale}${lookupPanel()}</div>
      <div class="pq-staff__right">${right(sv)}</div></main>${toast(sv)}${bigText ? `<button type="button" class="pq-fullticket pq-fullticket--card" data-closecard><span class="pq-bigtext">${esc(bigText)}</span><span class="text-m">${tEn('staff.cardClose')}</span></button>` : ''}</div>`;
    if (had) { const n = el.querySelector('[name=lookup]'); n.focus(); try { n.setSelectionRange(pos, pos); } catch { /* ignore */ } }
  }
  const rerender = () => { lastSig = ''; render(true); };

  const run = (a) => {
    if (a === 'next') store.staffCallNext(code);
    if (a === 'done') store.staffMarkDone(code);
    if (a === 'hold') store.staffHold(code);
    if (a === 'undo') store.undo();
    rerender();
  };
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]'); if (act) return run(act.dataset.act);
    const cd = e.target.closest('[data-card]'); if (cd) { bigText = cd.dataset.card; return rerender(); }
    if (e.target.closest('[data-closecard]')) { bigText = ''; return rerender(); }
    if (e.target.closest('[data-signout]')) { code = ''; localStorage.removeItem(SIGNED); pinError = ''; return rerender(); }
    const rc = e.target.closest('[data-recall]'); if (rc) { store.staffRecall(code, Number(rc.dataset.recall)); return rerender(); }
    const ro = e.target.closest('[data-reopen]'); if (ro) { store.undoEnrolled(Number(ro.dataset.reopen)); return rerender(); }
  });
  el.addEventListener('change', (e) => { if (e.target.matches('[name=stall]')) pick = e.target.value; });
  el.addEventListener('input', (e) => { if (e.target.matches('[name=lookup]')) { lookupQ = e.target.value; } });
  el.addEventListener('submit', (e) => {
    if (e.target.matches('[data-lookup]')) { e.preventDefault(); lookupQ = el.querySelector('[name=lookup]').value; rerender(); }
    if (e.target.matches('[data-signin]')) {
      e.preventDefault(); pick = el.querySelector('[name=stall]').value;
      if (el.querySelector('[name=pin]').value.trim() !== PIN) { pinError = tEn('staff.errPin'); return rerender(); }
      code = pick; localStorage.setItem(PICK, pick); localStorage.setItem(SIGNED, code); pinError = ''; store.takeControl(code); rerender();
    }
  });
  const keys = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    const map = { n: 'next', d: 'done', h: 'hold', u: 'undo' };
    if (map[k] && el.isConnected && code) run(map[k]);
  };
  document.addEventListener('keydown', keys);

  const off = store.subscribe(() => render());
  render();
  return () => { off(); document.removeEventListener('keydown', keys); el.innerHTML = ''; };
}
