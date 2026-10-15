// js/a11y.js — per-device accessibility settings
// text size (100-200%), high contrast
// Settings are persisted in localStorage key 'isqolar.a11y'

const A11Y_KEY = 'isqolar.a11y';

function _load() {
  try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || {}; } catch (_) { return {}; }
}
function _save(s) {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(s)); } catch (_) {}
}

let _settings = _load();

/** Apply current settings to the document root. Call on page load. */
export function apply() {
  const { textSize = 100, highContrast = false } = _settings;
  document.documentElement.style.fontSize = `${textSize / 100 * 16}px`;
  document.documentElement.classList.toggle('pq-hc', highContrast);
}

/** Get a setting value. */
export function get(key) {
  return _settings[key];
}

/** Set one or more settings and re-apply. */
export function set(patch) {
  Object.assign(_settings, patch);
  _save(_settings);
  apply();
}

/** Get text size (100-200). */
export function getTextSize() { return _settings.textSize || 100; }

/** Set text size (100-200). */
export function setTextSize(n) {
  const clamped = Math.min(200, Math.max(100, Number(n) || 100));
  set({ textSize: clamped });
}

/** Get high contrast flag. */
export function getHighContrast() { return !!_settings.highContrast; }

/** Set high contrast. */
export function setHighContrast(val) { set({ highContrast: !!val }); }
