// Prototype shell: a landing page plus every viewport, alone or side by side.
window.__PQ_HUB = true;
import * as store from './js/store.js';
import { mount as home } from './js/views/home.js';
import { mount as student } from './js/views/student.js';
import { mount as guardian } from './js/views/guardian.js';
import { mount as stall } from './js/views/stall.js';
import { mount as board } from './js/views/board.js';

const NAMES = ['home', 'student', 'guardian', 'stall', 'board'];
const root = document.getElementById('hub');
let unmounts = [];

const routeFromHash = () => { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; return NAMES.includes(r) ? r : 'home'; };
const go = (r) => { if (location.hash === '#' + r) show(r); else location.hash = '#' + r; };

function navHtml(route) {
  const home = route === 'home';
  const links = home ? [['features', 'Features'], ['how', 'How it works'], ['live', 'Live count'], ['personas', 'Preview'], ['faqs', 'FAQs']].map(([k, l]) => `<button type="button" data-jump="${k}">${l}</button>`).join('') : '';
  return `<header class="lp-navwrap${home ? '' : ' lp-navwrap--static'}"><nav class="lp-nav" aria-label="Main"><button type="button" class="lp-logo" data-route="home" aria-label="IsQolar home"><img class="logo" src="/brand/logo-light.png" alt=""><b>IsQolar</b></button>
    <div class="lp-nav__links">${links}</div><div class="lp-nav__end"><a class="lp-btn lp-btn--sm lp-btn--ghost" href="/chat.html">Chat</a><a class="lp-btn lp-btn--sm lp-btn--ghost" href="/map.html">Map</a><button type="button" class="lp-btn lp-btn--sm${home ? '' : ' lp-btn--ghost'}" ${home ? 'data-jump="personas"' : 'data-route="home"'}>${home ? 'Try the prototype' : 'Exit prototype'}</button></div></nav>
</header>`;
}

function show(route) {
  unmounts.forEach((u) => u()); unmounts = [];
  root.innerHTML = `${navHtml(route)}<div id="stage" class="lp-appstage"></div>`;
  const stage = root.querySelector('#stage');
  window.scrollTo(0, 0);
  if (route === 'home') { unmounts.push(home(stage, { go })); return; }
  stage.innerHTML = '<div id="single"></div>';
  const el = stage.querySelector('#single');
  unmounts.push({ student: () => student(el, { demo: true }), guardian: () => guardian(el, { demo: true }), stall: () => stall(el), board: () => board(el) }[route]());
}

root.addEventListener('click', (e) => {
  const b = e.target.closest('[data-route]'); if (b) return go(b.dataset.route);
  const j = e.target.closest('[data-jump]'); if (j && !e.target.closest('.lp')) document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
window.addEventListener('hashchange', () => show(routeFromHash()));
(async () => { await store.init(); store.start(); show(routeFromHash()); })();
