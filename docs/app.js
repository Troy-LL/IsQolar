// app.js — hash router + floating pill nav
// Routes: #home (default), #student, #guardian, #stall, #board
// Each view exports mount(el, opts) -> unmount fn.
// Personas are isolated: no persona can navigate to another.

import { init as storeInit, start as storeStart, isDemo } from './js/store.js';
import { apply as a11yApply } from './js/a11y.js';
import { setLang }              from './js/i18n.js';

// Lazy-load views to keep initial parse fast
const VIEWS = {
  home:     () => import('./js/views/home.js'),
  student:  () => import('./js/views/student.js'),
  guardian: () => import('./js/views/guardian.js'),
  stall:    () => import('./js/views/stall.js'),
  board:    () => import('./js/views/board.js'),
};

const PERSONA_ROUTES = new Set(['student', 'guardian', 'stall', 'board']);

let _currentUnmount = null;
let _currentRoute   = null;

function _route() {
  const hash = (location.hash || '#home').slice(1) || 'home';
  const route = VIEWS[hash] ? hash : 'home';

  if (route === _currentRoute) return;
  _currentRoute = route;

  const stage = document.getElementById('stage');
  if (!stage) return;

  if (_currentUnmount) { try { _currentUnmount(); } catch (_) {} }

  VIEWS[route]().then(mod => {
    _currentUnmount = mod.mount(stage, { demo: isDemo() });
  });
}

// On load
storeInit();
a11yApply();
storeStart();

// Restore language preference
const savedLang = localStorage.getItem('isqolar.lang');
if (savedLang === 'en' || savedLang === 'fil') setLang(savedLang);

// Persist language changes
document.addEventListener('langchange', (e) => {
  localStorage.setItem('isqolar.lang', e.detail.lang);
});

// Hash router
window.addEventListener('hashchange', _route);
window.addEventListener('load', _route);

// If we're already at a hash on first parse (e.g. from a reload)
if (document.readyState === 'complete') _route();
