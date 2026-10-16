// The status marks, drawn as inline SVG so they match on every phone and print cleanly.
import { t } from './i18n.js';

const SHAPES = {
  'not-yet': (s) => `<circle cx="10" cy="10" r="7" fill="none" stroke="var(--ink-soft)" stroke-width="2"/>`,
  'in-line': () => `<circle cx="10" cy="10" r="6" fill="var(--maroon)"/>`,
  'your-turn': () => `<circle cx="10" cy="10" r="10" fill="var(--gold)"/><path d="M5 10h9M10.5 6l4 4-4 4" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'done': () => `<path d="M3.5 10.5l4.2 4.2L16.5 5.5" fill="none" stroke="var(--green)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  'on-hold': () => `<rect x="5" y="4" width="3.4" height="12" rx="1" fill="var(--ink)"/><rect x="11.6" y="4" width="3.4" height="12" rx="1" fill="var(--ink)"/>`,
  'problem': () => `<path d="M10 2.5L18.5 17H1.5z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8v4M10 14.2v.1" stroke="var(--paper)" stroke-width="1.8" stroke-linecap="round"/>`,
};

export function markSvg(status, size = 20) {
  return `<svg class="pq-mark" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${SHAPES[status]()}</svg>`;
}
export const statusWord = (status) => t(`status.${status}`);
