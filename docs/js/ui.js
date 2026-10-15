// js/ui.js — shared UI helpers
// Exports: header(), problem(), qrSvg(), esc(), fmtTime(), fmtDate(),
//          stallLabel(), placeLabel(), bindLang()

import { t, setLang, getLang } from './i18n.js';

/**
 * Render the AppHeader HTML string.
 * @param {string} screenName  Optional right-side label (staff/admin screens).
 */
export function header(screenName = '') {
  const lang = getLang();
  return `
<header class="pq-header" role="banner">
  <div class="pq-header__wordmark" aria-label="PUP Enrollment Queue">
    <span class="pq-header__pup pq-mark" aria-hidden="true">PUP</span>
    <span class="pq-header__sub">${esc(t('appName'))}</span>
  </div>
  <nav class="pq-header__lang" aria-label="Language">
    <button data-langset="en"  aria-pressed="${lang === 'en'  ? 'true' : 'false'}" aria-label="${t('langEn')}">${t('langLabelEn')}</button>
    <button data-langset="fil" aria-pressed="${lang === 'fil' ? 'true' : 'false'}" aria-label="${t('langFil')}">${t('langLabelFil')}</button>
  </nav>
</header>`.trim();
}

/**
 * Render an inline problem message.
 * @param {string} msg  Plain text; will be escaped.
 */
export function problem(msg) {
  return `<p class="pq-field__error" role="alert"><span aria-hidden="true">&#9650;</span> ${esc(msg)}</p>`;
}

/**
 * Generate a QR SVG string using the bundled qrcode-generator library.
 * The library must be loaded as a classic <script> before any module import.
 * @param {string} data  URL or text to encode.
 * @param {number} size  Pixel size of the rendered SVG.
 */
export function qrSvg(data, size = 160) {
  if (typeof qrcode === 'undefined') {
    return `<div style="width:${size}px;height:${size}px;background:var(--line);border-radius:var(--r-s);display:flex;align-items:center;justify-content:center;font-size:var(--caption);color:var(--ink-soft)">QR</div>`;
  }
  try {
    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();
    // createSvgTag(cellSize, margin, altText)
    // 4-module quiet zone enforced via margin param
    const raw = qr.createSvgTag(4, 4, 'QR code');
    // Resize to requested size
    return raw.replace(/width="[^"]*"/, `width="${size}"`).replace(/height="[^"]*"/, `height="${size}"`);
  } catch (_) {
    return `<div style="width:${size}px;height:${size}px;background:var(--line)"></div>`;
  }
}

/** HTML-escape a string. */
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a timestamp as a clock time: "10:42 AM".
 * @param {number|null} ts  Unix timestamp in ms.
 */
export function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format a timestamp as a written date: "October 15, 2026".
 * @param {number|null} ts  Unix timestamp in ms.
 */
export function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Human-readable stall label: "BSIT" -> the program's full name from colleges data.
 * Falls back to the code if not found.
 * @param {string} code  Program code.
 * @param {import('./colleges.js').colleges} colleges
 */
export function stallLabel(code, colleges) {
  for (const col of colleges) {
    const prog = col.programs.find(p => p.code === code);
    if (prog) return prog.name;
  }
  return code;
}

/**
 * "N ahead of you" or "You're next." label.
 * @param {number} ahead
 */
export function placeLabel(ahead) {
  if (ahead === 0) return t('youreNext');
  return `${ahead} ${t('aheadOf')}`;
}

/**
 * Bind EN|FIL language buttons in a container via delegation.
 * Call once per mounted view; returns the listener (for cleanup).
 * @param {HTMLElement} el  Root element.
 */
export function bindLang(el) {
  function onClick(e) {
    const btn = e.target.closest('[data-langset]');
    if (!btn) return;
    setLang(btn.dataset.langset);
  }
  el.addEventListener('click', onClick);
  return onClick;
}
