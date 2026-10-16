import { t, getLang } from './i18n.js';
import { markSvg } from './status-mark.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmtTime = (ms) => new Date(ms).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
export const fmtDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
export const stallLabel = (code) => t('stall.label', { code });
export const placeLabel = (row) => t('stall.place', { row });

export function header({ lang = true, label = '' } = {}) {
  const l = getLang();
  return `<header class="pq-header">
    <div class="pq-brand"><img class="logo" src="/brand/logo-dark.png" alt=""><span class="heading-s">${t('app.name')}</span>${label ? `<span class="caption pq-header__label">${esc(label)}</span>` : ''}</div>
    ${lang ? `<div class="pq-lang" role="group" aria-label="Language">
      <button type="button" data-lang="en" aria-pressed="${l === 'en'}" lang="en" aria-label="${t('lang.en')}">EN</button>
      <button type="button" data-lang="fil" aria-pressed="${l === 'fil'}" lang="fil" aria-label="${t('lang.fil')}">FIL</button>
    </div>` : ''}
  </header>`;
}

export function problem(text) { return `<p class="pq-problem text-s">${markSvg('problem', 18)}<span>${text}</span></p>`; }

export function qrSvg(text, cls = 'pq-qr') {
  const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), q = 4, size = n + q * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg class="${cls}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#1f1a1a"/></svg>`;
}

// Delegated language switch, shared by every view that shows the EN | FIL control.
export function bindLang(el, rerender, setLang) {
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) { setLang(b.dataset.lang); rerender(true); } });
}
