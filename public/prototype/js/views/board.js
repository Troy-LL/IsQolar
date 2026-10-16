import * as store from '../store.js';
import { tp, tEn, tFil } from '../i18n.js';
import { esc, qrSvg, fmtTime } from '../ui.js';

const PICK = 'isqolar.board';

export function mount(el) {
  const screens = store.boardScreens();
  let id = localStorage.getItem(PICK);
  if (!screens.find((s) => s.id === id)) id = screens.find((s) => s.college === 'CCIS').id;
  let lastSig = '', ro = null;
  const clock = () => new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const today = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function column(s) {
    const gold = s.serving != null;
    const nexts = [0, 1, 2].map((i) => (s.next[i] != null ? `<li class="b2-next"><span class="board-next num">${store.ticketLabel(s.next[i])}</span></li>` : '<li class="b2-next b2-next--empty" aria-label="empty"></li>')).join('');
    return `<section class="b2-col" aria-label="${esc(s.code)}">
      <header class="b2-band"><div><h2 class="b2-code">${esc(s.code)}</h2><p class="b2-name">${esc(s.name)}</p></div><span class="b2-desks">${s.desks > 1 ? tEn('board.desks', { n: s.desks }) : tEn('board.desk')}</span></header>
      <p class="b2-wait"><span>${tp('board.waiting')}</span><b class="num">${s.waiting}</b></p>
      <div class="b2-now ${gold ? 'is-gold' : ''}"><p class="b2-now__label">${gold ? '→ ' + tp('board.now') : tp('board.idle')}</p><p class="board-number num">${gold ? store.ticketLabel(s.serving) : '—'}</p></div>
      <p class="b2-nexthead">${tp('board.next')}</p><ol class="b2-nextlist">${nexts}</ol></section>`;
  }

  function compact(s) {
    const gold = s.serving != null;
    const nexts = [0, 1, 2].map((i) => `<li class="b2c-next num${s.next[i] == null ? ' is-empty' : ''}">${s.next[i] != null ? store.ticketLabel(s.next[i]) : ''}</li>`).join('');
    return `<section class="b2c" aria-label="${esc(s.code)}">
      <header class="b2c-band"><div><h2 class="b2c-code">${esc(s.code)}</h2><p class="b2c-name">${esc(s.name)}</p></div><span class="b2-desks">${s.desks > 1 ? tEn('board.desks', { n: s.desks }) : tEn('board.desk')}</span></header>
      <div class="b2c-now ${gold ? 'is-gold' : ''}"><p class="b2c-label">${gold ? '→ ' + tp('board.now') : tp('board.idle')}</p><p class="b2c-number num">${gold ? store.ticketLabel(s.serving) : '—'}</p></div>
      <div class="b2c-foot"><div class="b2c-wait"><p class="b2c-cap">${tp('board.waiting')}</p><p class="b2c-count num">${s.waiting}</p></div>
        <div class="b2c-nextbox"><p class="b2c-cap">${tp('board.next')}</p><ol class="b2c-nextlist">${nexts}</ol></div></div></section>`;
  }
  function render(force) {
    const scr = screens.find((s) => s.id === id);
    const v = store.boardView(scr.codes);
    const sig = JSON.stringify([id, v.stalls, v.stale, clock()]);
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const idx = screens.findIndex((s) => s.id === id);
    const chev = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    const chips = `<div class="b2-pager"><button type="button" class="b2-nav" data-step="-1" aria-label="Previous screen">${chev('M15 6l-6 6 6 6')}</button>
      <div class="pq-selwrap b2-pager__sel"><label for="pq-screen">Screen ${idx + 1} of ${screens.length}</label><select class="pq-sel" id="pq-screen" data-screen>${screens.map((s) => `<option value="${s.id}"${s.id === id ? ' selected' : ''}>${esc(s.label)} · ${s.codes.join(', ')}</option>`).join('')}</select></div>
      <button type="button" class="b2-nav" data-step="1" aria-label="Next screen">${chev('M9 6l6 6-6 6')}</button></div>`;
    const live = v.stale ? `<span class="b2-live b2-live--stale">▲ ${tEn('live.stale', { time: fmtTime(v.updatedAt) })}</span>` : `<span class="b2-live"><i></i>${tEn('board.live', { time: clock() })}</span>`;
    el.innerHTML = `<div class="pq-view pq-view--board"><div class="b2-wrap">${chips}<div class="pq-boardstage" data-stage><div class="b2" data-board>
      <header class="b2-head"><div class="b2-head__l"><img class="logo" src="/brand/logo-dark.png" alt=""><h1 class="board-title">${tp('board.title')}</h1></div><div class="b2-head__r"><div class="b2-date"><span>${today()}</span>${live}</div><span class="board-next num b2-clock">${clock()}</span></div></header>
      ${v.stalls.length > 4
        ? `<div class="b2-cols b2-cols--two" data-cols="4" style="--cols:4">${v.stalls.map(compact).join('')}</div>`
        : `<div class="b2-cols" data-cols="${v.stalls.length}" style="--cols:${v.stalls.length}">${v.stalls.map(column).join('')}</div>`}
      <footer class="b2-foot">${qrSvg('isqolar:join', 'b2-qr')}<div class="b2-foot__t"><p class="board-station">${tp('board.join')}</p><p class="b2-line">${tEn('board.nophone')}</p><p class="b2-line b2-line--fil">${tFil('board.nophone')}</p></div>
        <p class="b2-row">${tEn('board.row', { row: esc(scr.college) })}</p></footer></div></div></div></div>`;
    fit();
  }
  function fit() {
    const stage = el.querySelector('[data-stage]'), board = el.querySelector('[data-board]'); if (!stage || !board) return;
    const k = stage.clientWidth / 1920;
    board.style.transform = `scale(${k})`; stage.style.height = `${1080 * k}px`;
  }
  const pick = (nid) => { id = nid; localStorage.setItem(PICK, id); lastSig = ''; render(true); };
  el.addEventListener('click', (e) => { const s = e.target.closest('[data-step]'); if (s) { const i = screens.findIndex((x) => x.id === id); pick(screens[(i + Number(s.dataset.step) + screens.length) % screens.length].id); } });
  el.addEventListener('change', (e) => { if (e.target.matches('[data-screen]')) pick(e.target.value); });
  ro = new ResizeObserver(fit); ro.observe(el);
  const off = store.subscribe(() => render());
  render();
  return () => { off(); ro.disconnect(); el.innerHTML = ''; };
}
