import en from './strings.en.js';
import fil from './strings.fil.js';

const dict = { en, fil };
const KEY = 'isqolar.lang';   // English by default (D8)
let lang = localStorage.getItem(KEY) === 'fil' ? 'fil' : 'en';

export const getLang = () => lang;
export function setLang(l) { lang = l === 'fil' ? 'fil' : 'en'; localStorage.setItem(KEY, lang); document.documentElement.lang = lang === 'fil' ? 'fil' : 'en'; }
export function t(key, vars = {}) {
  const s = dict[lang][key] ?? dict.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';

// Bilingual pair for the venue board: "Now serving · Tinatawag na"
export const tp = (key) => `${dict.en[key]} · ${dict.fil[key]}`;
export const tEn = (key, vars = {}) => (dict.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const tFil = (key) => dict.fil[key] ?? dict.en[key] ?? key;
