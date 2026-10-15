// js/status-mark.js — six inline SVG status marks + statusWord()
// The SVG is aria-hidden; the word carries the meaning.
// Statuses: not-yet, in-line, your-turn, done, on-hold, problem

import { t } from './i18n.js';

/**
 * Return the translated word for a status.
 * @param {'not-yet'|'in-line'|'your-turn'|'done'|'on-hold'|'problem'} status
 */
export function statusWord(status) {
  const map = {
    'not-yet':   'notYet',
    'in-line':   'inLine',
    'your-turn': 'yourTurn',
    'done':      'done',
    'on-hold':   'onHold',
    'problem':   'problem',
  };
  return t(map[status] || 'notYet');
}

/**
 * Return the inline SVG for a status mark (20px).
 * @param {'not-yet'|'in-line'|'your-turn'|'done'|'on-hold'|'problem'} status
 * @param {number} size  SVG size in px (default 20).
 */
export function statusSvg(status, size = 20) {
  const s = size;
  const c = s / 2;
  const r = s * 0.38;
  switch (status) {
    case 'not-yet':
      // ○ outline ring in ink-soft
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--ink-soft)" stroke-width="2"/>
      </svg>`;
    case 'in-line':
      // ● filled maroon dot
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <circle cx="${c}" cy="${c}" r="${r}" fill="var(--maroon)"/>
      </svg>`;
    case 'your-turn':
      // → ink arrow on gold disc
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <circle cx="${c}" cy="${c}" r="${c}" fill="var(--gold)"/>
        <polyline points="${s*0.28},${s*0.4} ${s*0.65},${s*0.5} ${s*0.28},${s*0.6}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="${s*0.33}" y1="${s*0.5}" x2="${s*0.68}" y2="${s*0.5}" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    case 'done':
      // ✓ green check
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <polyline points="${s*0.2},${s*0.52} ${s*0.43},${s*0.72} ${s*0.8},${s*0.3}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case 'on-hold':
      // ‖ ink pause bars
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <rect x="${s*0.28}" y="${s*0.22}" width="${s*0.16}" height="${s*0.56}" rx="2" fill="var(--ink)"/>
        <rect x="${s*0.56}" y="${s*0.22}" width="${s*0.16}" height="${s*0.56}" rx="2" fill="var(--ink)"/>
      </svg>`;
    case 'problem':
    default:
      // ▲ ink triangle
      return `<svg class="pq-status__svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" focusable="false">
        <polygon points="${c},${s*0.18} ${s*0.88},${s*0.82} ${s*0.12},${s*0.82}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
        <line x1="${c}" y1="${s*0.42}" x2="${c}" y2="${s*0.62}" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
        <circle cx="${c}" cy="${s*0.72}" r="1.5" fill="var(--ink)"/>
      </svg>`;
  }
}

/**
 * Render a complete status mark (SVG + word) as an HTML string.
 * @param {'not-yet'|'in-line'|'your-turn'|'done'|'on-hold'|'problem'} status
 * @param {number} size
 */
export function statusMark(status, size = 20) {
  return `<span class="pq-status pq-status--${status}">${statusSvg(status, size)}<span class="pq-status__word">${statusWord(status)}</span></span>`;
}
