import * as store from '../store.js';
import { t, getLang, setLang } from '../i18n.js';
import { markSvg, statusWord } from '../status-mark.js';
import { esc, fmtTime, fmtDate, stallLabel, placeLabel, header, problem, bindLang } from '../ui.js';

const SAVED = 'isqolar.guardian';

export function mount(el, { demo, follow = false } = {}) {
  const isDemo = demo === true || (demo === undefined && store.isDemo());
  let current = localStorage.getItem(SAVED) || '';
  let step = 'permit', permit = isDemo ? '2026-00123-MN-0' : '', info = null, error = '', cleared = false;
  let lastSig = '';

  const ago = (ms) => { const m = Math.floor((Date.now() - ms) / 60000); return m < 1 ? t('g.agoNow') : t('g.agoMin', { n: m }); };
  const slotInfo = (s) => { const k = s.left === 0 ? 'full' : s.left <= 10 ? 'almost' : 'ok'; return { mark: k === 'ok' ? 'in-line' : 'problem', word: t('slots.' + k), text: t('slots.text', { left: s.left, total: s.total }) }; };

  function sentence(g) {
    const name = g.firstName, stall = stallLabel(g.stall.code);
    switch (g.status) {
      case 'called': return { mark: 'your-turn', text: t('g.called', { stall }) };
      case 'hold': return { mark: 'on-hold', text: name ? t('g.hold', { stall, name }) : t('g.holdNoName', { stall }) };
      case 'next': return { mark: 'in-line', text: t('g.next', { stall }) };
      default: return { mark: 'in-line', text: t('g.inLine', { stall, place: placeLabel(g.stall.row) }) };
    }
  }
  function steps(g) {
    const row = (status, name, detail) => `<li class="${['in-line', 'your-turn', 'on-hold'].includes(status) ? 'is-current' : ''}">${markSvg(status)}<div><p class="heading-s">${name}</p>${detail ? `<p class="caption pq-soft">${detail}</p>` : ''}</div><span class="pq-word pq-word--${status}">${statusWord(status)}</span></li>`;
    const rows = g.stepOrder.map((s) => {
      const done = !!g.done[s], cur = s === 'course-stall' && !done;
      const status = done ? 'done' : cur ? (g.status === 'called' ? 'your-turn' : g.status === 'hold' ? 'on-hold' : 'in-line') : 'not-yet';
      return row(status, t('step.' + s), done ? t('checklist.doneAt', { time: fmtTime(g.done[s]) }) : cur ? `${stallLabel(g.stall.code)} · ${placeLabel(g.stall.row)}` : '');
    });
    const fin = g.status === 'enrolled';
    rows.push(row(fin ? 'done' : 'not-yet', t('step.enrolled'), fin ? t('checklist.doneAt', { time: fmtTime(g.doneAt) }) : ''));
    return `<section class="pq-card pq-check" aria-label="${t('checklist.title')}"><div class="pq-check__head"><h2 class="heading-m">${t('checklist.title')}</h2></div><ol>${rows.join('')}</ol></section>`;
  }
  function liveStatus(g) {
    if (Date.now() - g.updatedAt > store.GUARDIAN_STALE_MS) return `<div class="pq-livestatus pq-livestatus--stale caption" role="status"><p class="pq-problem">${markSvg('problem', 16)}<span>${t('g.stale', { time: fmtTime(g.updatedAt) })}</span></p></div>`;
    return `<p class="pq-livestatus caption" role="status">${t('g.updated', { time: `<span class="num-s num">${fmtTime(g.updatedAt)}</span>`, ago: ago(g.updatedAt) })}</p>`;
  }

  function permitView() {
    return `${header()}<main class="pq-page pq-join"><h1 class="heading-l">${t('g.permitTitle')}</h1><form data-permit novalidate class="pq-join" style="padding:0">
      <div class="pq-field"><label for="pq-gpermit">${t('g.permit')}</label><input class="pq-input num" id="pq-gpermit" name="permit" autocomplete="off" value="${esc(permit)}" ${error ? 'aria-invalid="true"' : ''}>${error ? problem(error) : isDemo ? `<p class="caption pq-soft pq-hint">${t('g.demoPermit', { permit: '<b class="num">2026-00123-MN-0</b>' })}</p>` : ''}</div>
      <button class="pq-btn" type="submit">${t('g.continue')}</button></form></main>`;
  }
  function otpView() {
    return `${header()}<main class="pq-page pq-join"><h1 class="heading-l">${t('g.otpTitle')}</h1>
      <p class="text-m">${info.phoneMask ? t('g.otpHelp', { mask: `<span class="num">${info.phoneMask}</span>` }) : t('g.otpHelpNone')}</p>
      <form data-otp novalidate class="pq-join" style="padding:0"><div class="pq-field"><label for="pq-otp">${t('g.otp')}</label>
        <input class="pq-input num pq-otp" id="pq-otp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" ${error ? 'aria-invalid="true"' : ''}>${error ? problem(error) : ''}</div>
        <button class="pq-btn" type="submit">${t('g.verify')}</button></form>
      ${isDemo ? `<p class="caption pq-soft pq-hint">${t('g.demoOtp', { otp: `<b class="num">${info.demoOtp}</b>` })}</p>` : ''}
      <button type="button" class="pq-link" data-restart>${t('g.back')}</button></main>`;
  }
  function dashboard(g) {
    const name = g.firstName, done = g.stepOrder.filter((s) => g.done[s]).length;
    const si = slotInfo(g.slots);
    const pct = g.slots.total ? Math.round((100 * g.slots.left) / g.slots.total) : 0;
    const updates = `<section class="pq-dark" aria-label="${t('g.updates')}"><h2 class="pq-dark__title">${t('g.updates')}</h2><div class="pq-inner"><ul class="pq-updates"><li class="pq-update">${markSvg(si.mark)}<div><p class="heading-s">${t('g.slots', { course: g.stall.code })}</p><p class="text-s"><b>${si.word}</b> · <span class="num">${si.text}</span></p><div class="pq-bar" role="img" aria-label="${si.text}"><i style="width:${pct}%"></i></div></div></li></ul></div></section>`;
    const top = g.status === 'enrolled'
      ? `<section class="pq-enrolled" aria-live="polite"><svg width="48" height="48" viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10.5l4.2 4.2L16.5 5.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><h1 class="heading-l">${name ? t('g.enrolled', { name: esc(name) }) : t('g.enrolledNoName')}</h1><p class="num-s num">${fmtDate(g.doneAt)} · ${fmtTime(g.doneAt)}</p></section>`
      : (() => { const s = sentence(g); return `<section class="pq-card pq-gstatus"><h1 class="heading-l">${name ? t('g.title', { name: esc(name) }) : t('g.titleNoName')}</h1><p class="pq-gstatus__line text-m">${markSvg(s.mark, 22)}<span>${s.text}</span></p><p class="caption pq-soft num">${t('g.steps', { n: done, total: g.stepOrder.length })}</p></section>`; })();
    return `${header()}<main class="pq-page">${updates}${top}${steps(g)}${liveStatus(g)}<button type="button" class="pq-link" data-change>${t('g.change')}</button></main><footer class="pq-footer"><p class="caption">${t('footer.text')}</p></footer>`;
  }

  function render(force) {
    if (!current && follow && !cleared) { const no = store.myTicketNo(); if (no) current = store.guardianCodeFor(no) || ''; }
    const g = current ? store.guardianView(current) : null;
    const ae = document.activeElement;
    if (!force && ae && el.contains(ae) && ae.tagName === 'INPUT') return;
    const sig = JSON.stringify([getLang(), current, step, error, g && [g.status, Object.keys(g.done).length, g.doneAt, g.slots, fmtTime(g.updatedAt), Math.floor((Date.now() - g.updatedAt) / 15000)]]);
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const body = g ? dashboard(g) : step === 'otp' && info ? otpView() : permitView();
    el.innerHTML = `<div class="pq-view">${body}</div>`;
  }
  const rerender = () => { lastSig = ''; render(true); };

  bindLang(el, rerender, setLang);
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-change]')) { current = ''; cleared = true; localStorage.removeItem(SAVED); step = 'permit'; permit = ''; error = ''; info = null; return rerender(); }
    if (e.target.closest('[data-restart]')) { step = 'permit'; error = ''; info = null; return rerender(); }
  });
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.matches('[data-permit]')) {
      permit = el.querySelector('[name=permit]').value.trim();
      const r = store.guardianRequest(permit);
      if (r.error) error = t('g.errPermit', { mask: esc(store.mask(permit) || '—') }); else { info = r; step = 'otp'; error = ''; }
      rerender(); if (step === 'otp') el.querySelector('[name=otp]')?.focus();
    } else if (e.target.matches('[data-otp]')) {
      const r = store.guardianLogin(permit, el.querySelector('[name=otp]').value);
      if (r.error) { error = t('g.errOtp'); } else { current = r.code; localStorage.setItem(SAVED, current); error = ''; }
      rerender();
    }
  });
  const off = store.subscribe(() => render());
  const tickAgo = setInterval(() => render(), 15000);
  render();
  return () => { off(); clearInterval(tickAgo); el.innerHTML = ''; };
}
