// IsQolar i18n helpers
// Exports: t, tEn, tFil, tp (bilingual pair), setLang
// tp() is used by the board for "Now serving · Tinatawag na" style pairs.

import { en }  from './strings.en.js';
import { fil } from './strings.fil.js';

let _lang = 'en';

const _strings = { en, fil };

/**
 * Set the active language. Dispatches a 'langchange' CustomEvent on document.
 * @param {'en'|'fil'} lang
 */
export function setLang(lang) {
  if (lang !== 'en' && lang !== 'fil') return;
  _lang = lang;
  document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

/** Get current language code. */
export function getLang() { return _lang; }

/**
 * t(key, ...args) — translate a key in the active language.
 * If the value is a function, it is called with args.
 * Falls back to English if the key is missing in the active language.
 */
export function t(key, ...args) {
  const s = _strings[_lang];
  const en_s = _strings.en;
  let v = s ? s[key] : undefined;
  if (v === undefined) v = en_s[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
}

/**
 * tEn(key, ...args) — always English, regardless of active language.
 */
export function tEn(key, ...args) {
  const v = en[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
}

/**
 * tFil(key, ...args) — always Filipino, regardless of active language.
 */
export function tFil(key, ...args) {
  const v = fil[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
}

/**
 * tp(enKey, filKey?, ...args) — bilingual pair: "English · Filipino".
 * Used by the board for paired labels.
 * If filKey is omitted, uses enKey + 'Fil' as the Filipino key.
 */
export function tp(enKey, filKey, ...args) {
  const fk = filKey !== undefined ? filKey : enKey + 'Fil';
  const enVal = tEn(enKey, ...args);
  const filVal = tFil(fk, ...args);
  if (filVal === fk) return enVal; // no Filipino string yet, show English only
  return `${enVal} \u00b7 ${filVal}`;
}
