// js/views/home.js -- Landing page (#home)
// mount(el, opts) -> unmount fn
// All text from strings via t(). Delegated events. Skip re-render on same sig.
// data-* hooks: data-go, data-tool, data-langset, data-faq (HANDOFF.md s10)

import { t, getLang, setLang }            from '../i18n.js';
import { getColleges, resetAll, toggleOffline, isOffline, subscribe } from '../store.js';
import { esc }                            from '../ui.js';

// ---------------------------------------------------------------------------
// Inline SVG icons (no CDN, no external images)
// ---------------------------------------------------------------------------
const SVG_TICKET = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="5" width="18" height="12" rx="3" stroke="white" stroke-width="1.8"/><line x1="2" y1="11" x2="20" y2="11" stroke="white" stroke-width="1.4" stroke-dasharray="3 2"/><rect x="7" y="8" width="8" height="3" rx="1" fill="white" opacity=".6"/></svg>';
const SVG_BOARD  = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="4" width="18" height="12" rx="2" stroke="white" stroke-width="1.8"/><line x1="8" y1="4" x2="8" y2="16" stroke="white" stroke-width="1.2"/><line x1="14" y1="4" x2="14" y2="16" stroke="white" stroke-width="1.2"/><line x1="2" y1="19" x2="20" y2="19" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
const SVG_STAFF  = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false"><circle cx="11" cy="8" r="3.5" stroke="white" stroke-width="1.8"/><path d="M4 19c0-3.866 3.134-7 7-7h0c3.866 0 7 3.134 7 7" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>';
const SVG_GUARD  = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false"><path d="M11 3L4 6v5c0 4.418 3.134 7.419 7 8 3.866-.581 7-3.582 7-8V6L11 3z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/><polyline points="8,11 10,13 14,9" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_CHEV   = '<svg class="lp-faq__chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><polyline points="5,7 10,13 15,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------------------------------------------------------------------------
// Build board screens from raw state
// ---------------------------------------------------------------------------
function _buildScreens(state, colleges) {
  if (!state) return [];
  const map = {};
  for (const col of colleges) map[col.code] = { college: col, stalls: [] };
  for (const s of Object.values(state.stalls)) {
    if (map[s.college]) map[s.college].stalls.push(s);
  }
  return Object.values(map).filter(m => m.stalls.length > 0);
}

// ---------------------------------------------------------------------------
// Render sections (pure functions, return HTML strings)
// ---------------------------------------------------------------------------
function _nav(lang, offline) {
  return `
<div class="lp-navwrap" role="navigation" aria-label="${esc(t('appName'))}">
  <div class="lp-nav">
    <a href="#home" class="lp-nav__logo" aria-label="IsQolar">
      <span class="lp-nav__pup pq-mark">PUP</span>
      <span class="lp-nav__sub">${esc(t('appName'))}</span>
    </a>
    <div class="lp-nav__links" role="list">
      <a href="#features" class="lp-nav__link" role="listitem">${esc(t('navFeatures'))}</a>
      <a href="#how" class="lp-nav__link" role="listitem">${esc(t('navHowItWorks'))}</a>
      <a href="#live" class="lp-nav__link" role="listitem">${esc(t('navLiveCount'))}</a>
      <a href="#preview" class="lp-nav__link" role="listitem">${esc(t('navPreview'))}</a>
      <a href="#faqs" class="lp-nav__link" role="listitem">${esc(t('navFaqs'))}</a>
    </div>
    <div class="lp-nav__right">
      <div class="lp-nav__lang" role="group" aria-label="${esc(t('language'))}">
        <button data-langset="en"  aria-pressed="${lang === 'en'  ? 'true' : 'false'}">${esc(t('langLabelEn'))}</button>
        <button data-langset="fil" aria-pressed="${lang === 'fil' ? 'true' : 'false'}">${esc(t('langLabelFil'))}</button>
      </div>
      <a href="#student" class="lp-nav__cta" data-go="student">${esc(t('tryPrototype'))}</a>
    </div>
  </div>
</div>`;
}

function _hero(screens) {
  const preview = screens.slice(0, 3).map(sc => {
    const s = sc.stalls[0];
    const no   = s ? (s.serving || '----') : '----';
    const wait = s ? s.queue.length : 0;
    return `
<div class="lp-preview-card">
  <div class="lp-preview-card__band"><span>${esc(sc.college.code)}</span><span class="pq-num" style="font-size:var(--caption)">${wait}</span></div>
  <div class="lp-preview-card__body">
    <span class="lp-preview-card__no${s && s.serving ? ' lp-preview-card__no--called' : ''}">${esc(no)}</span>
    <span class="lp-preview-card__wait">${wait} ${esc(t('waiting', wait))}</span>
  </div>
</div>`;
  }).join('');
  return `
<section class="lp-hero" aria-labelledby="hero-h">
  <div class="lp-hero__text">
    <div class="lp-hero__chip">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="#880000" opacity=".25"/><circle cx="6" cy="6" r="2.5" fill="#880000"/></svg>
      PUP Manila &middot; First-year enrollment
    </div>
    <h1 class="lp-hero__heading" id="hero-h">${esc(t('heroHeading'))}</h1>
    <p class="lp-hero__sub">${esc(t('heroSub'))}</p>
    <div class="lp-hero__actions">
      <a href="#student" class="lp-hero__cta" data-go="student">${esc(t('tryPrototype'))}</a>
    </div>
  </div>
  <div class="lp-preview-cards" aria-label="${esc(t('previewHeading'))}">${preview}</div>
</section>`;
}

function _features() {
  return `
<section class="lp-section" id="features" aria-labelledby="features-h">
  <h2 class="lp-section-title" id="features-h">${esc(t('featuresHeading'))}</h2>
  <div class="lp-features">
    <article class="lp-feature">
      <div class="lp-feature__icon">${SVG_TICKET}</div>
      <h3 class="lp-feature__title">${esc(t('featureTitle1'))}</h3>
      <p class="lp-feature__desc">${esc(t('featureDesc1'))}</p>
      <div class="lp-mini-ticket" aria-hidden="true">
        <span class="lp-mini-no pq-num">0427</span>
        <span class="lp-mini-label">3 ${esc(t('aheadOf'))} &middot; ${esc(t('aboutMin', 15))}</span>
      </div>
    </article>
    <article class="lp-feature">
      <div class="lp-feature__icon">${SVG_BOARD}</div>
      <h3 class="lp-feature__title">${esc(t('featureTitle2'))}</h3>
      <p class="lp-feature__desc">${esc(t('featureDesc2'))}</p>
      <div class="lp-mini-board" aria-hidden="true">
        <div class="lp-mini-stall"><div class="lp-mini-stall__band">BSIT</div><div class="lp-mini-stall__no pq-num" style="background:var(--gold);color:var(--ink);border-radius:var(--r-s);padding:2px 6px;display:inline-block;">0427</div><div class="lp-mini-stall__wait">12</div></div>
        <div class="lp-mini-stall"><div class="lp-mini-stall__band">BSCS</div><div class="lp-mini-stall__no pq-num">0389</div><div class="lp-mini-stall__wait">4</div></div>
        <div class="lp-mini-stall"><div class="lp-mini-stall__band">BSBA</div><div class="lp-mini-stall__no pq-num">0341</div><div class="lp-mini-stall__wait">8</div></div>
      </div>
    </article>
    <article class="lp-feature">
      <div class="lp-feature__icon">${SVG_STAFF}</div>
      <h3 class="lp-feature__title">${esc(t('featureTitle3'))}</h3>
      <p class="lp-feature__desc">${esc(t('featureDesc3'))}</p>
      <div class="lp-mini-console" aria-hidden="true">
        <div class="lp-mini-btn">${esc(t('staffCallNext'))}</div>
        <div class="lp-mini-btn lp-mini-btn--quiet">${esc(t('staffMarkDone'))}</div>
      </div>
    </article>
  </div>
</section>`;
}

function _benefits() {
  const tiles = [1,2,3,4,5,6].map(n => `
<div class="lp-benefit">
  <div class="lp-benefit__title">${esc(t('benefit' + n + 'Title'))}</div>
  <p class="lp-benefit__desc">${esc(t('benefit' + n + 'Desc'))}</p>
</div>`).join('');
  return `
<section class="lp-section lp-section--dark" aria-labelledby="benefits-h">
  <div class="lp-section" style="padding:0;max-width:100%">
    <div class="lp-section-title" id="benefits-h">${esc(t('benefitsHeading'))}</div>
    <h2 style="font-size:var(--heading-l);font-weight:700;color:var(--paper);margin-bottom:var(--space-6);">${esc(t('benefitsHeading'))}</h2>
    <div class="lp-benefits">${tiles}</div>
  </div>
</section>`;
}

function _how() {
  const cards = [1,2,3,4].map(n => `
<div class="lp-how__card">
  <div class="lp-how__num pq-num">${String(n).padStart(2,'0')}</div>
  <h3 class="lp-how__title">${esc(t('howTitle' + n))}</h3>
  <p class="lp-how__desc">${esc(t('howDesc' + n))}</p>
</div>`).join('');
  return `
<section class="lp-section" id="how" aria-labelledby="how-h">
  <h2 class="lp-section-title" id="how-h">${esc(t('howHeading'))}</h2>
  <div class="lp-how">${cards}</div>
</section>`;
}

function _preview(screens) {
  const cards = screens.slice(0, 6).map(sc => {
    const s = sc.stalls[0];
    const no   = s ? (s.serving || '----') : '----';
    const wait = sc.stalls.reduce((sum, st) => sum + st.queue.length, 0);
    return `
<div class="lp-preview-card">
  <div class="lp-preview-card__band"><span>${esc(sc.college.code)}</span></div>
  <div class="lp-preview-card__body">
    <span class="lp-preview-card__no${s && s.serving ? ' lp-preview-card__no--called' : ''}">${esc(no)}</span>
    <span class="lp-preview-card__wait">${wait} ${esc(t('waiting', wait))}</span>
  </div>
</div>`;
  }).join('');
  return `
<section class="lp-section" id="preview" aria-labelledby="preview-h">
  <h2 class="lp-section-title" id="preview-h">${esc(t('previewHeading'))}</h2>
  <p style="font-size:var(--text-s);color:var(--ink-soft);margin-bottom:var(--space-4);">${esc(t('previewSub'))}</p>
  <div class="lp-preview">${cards}</div>
</section>`;
}

function _liveCount(colleges, storeData) {
  let opts = `<option value="">${esc(t('liveCountSelect'))}</option>`;
  for (const col of colleges) {
    opts += `<optgroup label="${esc(col.name)}">`;
    for (const p of col.programs) opts += `<option value="${esc(p.code)}">${esc(p.name)}</option>`;
    opts += '</optgroup>';
  }
  const open  = storeData ? storeData.filter(s => s.slotsLeft > 0).length : 0;
  const total = storeData ? storeData.length : 0;
  return `
<section class="lp-section" id="live" aria-labelledby="live-h">
  <h2 class="lp-section-title" id="live-h">${esc(t('liveCountHeading'))}</h2>
  <div class="lp-live-count">
    <p style="font-size:var(--caption);color:var(--ink-soft);">${esc(t('liveCountTotal', open, total))}</p>
    <label class="lp-live-count__label" for="lp-cs">${esc(t('liveCountSub'))}</label>
    <select id="lp-cs" data-tool="courseselect">${opts}</select>
    <div class="lp-gauge" id="lp-gauge" aria-live="polite" aria-label="${esc(t('liveCountHeading'))}">
      <div style="font-size:var(--caption);color:var(--ink-soft);">${esc(t('liveCountSelect'))}</div>
    </div>
  </div>
</section>`;
}

function _picker() {
  const P = [
    { key: 'personaStudent',  route: 'student',  icon: SVG_TICKET, descKey: 'personaStudentDesc'  },
    { key: 'personaGuardian', route: 'guardian', icon: SVG_GUARD,  descKey: 'personaGuardianDesc' },
    { key: 'personaStaff',    route: 'stall',    icon: SVG_STAFF,  descKey: 'personaStaffDesc'    },
    { key: 'personaBoard',    route: 'board',    icon: SVG_BOARD,  descKey: 'personaBoardDesc'    },
  ];
  const cards = P.map(p => `
<a href="#${p.route}" class="lp-picker__card" data-go="${p.route}">
  <div class="lp-picker__icon">${p.icon}</div>
  <div class="lp-picker__label">${esc(t(p.key))}</div>
  <div class="lp-picker__desc">${esc(t(p.descKey))}</div>
</a>`).join('');
  return `
<section class="lp-section" id="try" aria-labelledby="picker-h">
  <h2 class="lp-section-title" id="picker-h">${esc(t('tryPrototype'))}</h2>
  <div class="lp-picker">${cards}</div>
</section>`;
}

function _tools(offline) {
  return `
<section class="lp-section" aria-labelledby="tools-h">
  <h2 class="lp-section-title" id="tools-h">${esc(t('toolsHeading'))}</h2>
  <div class="lp-tools">
    <span class="lp-tools__label">${esc(t('toolsHeading'))}</span>
    <button class="lp-tool-btn" data-tool="reset" data-tool-id="reset">${esc(t('toolsReset'))}</button>
    <button class="lp-tool-btn${offline ? ' lp-tool-btn--active' : ''}" data-tool="offline" data-tool-id="offline">
      ${offline ? esc(t('toolsOfflineOn')) : esc(t('toolsOffline'))}
    </button>
  </div>
</section>`;
}

function _banner() {
  return `<div class="lp-banner" role="note"><span class="lp-ghost" aria-hidden="true"></span>${esc(t('bannerText'))}</div>`;
}

function _faqs() {
  const faqs = t('faqs');
  if (!Array.isArray(faqs)) return '';
  const items = faqs.map((f, i) => `
<div class="lp-faq__item">
  <button class="lp-faq__q" aria-expanded="false" aria-controls="faq-a-${i}" data-faq="${i}">${esc(f.q)}${SVG_CHEV}</button>
  <div class="lp-faq__a" id="faq-a-${i}" role="region">${esc(f.a)}</div>
</div>`).join('');
  return `
<section class="lp-section" id="faqs" aria-labelledby="faqs-h">
  <h2 class="lp-section-title" id="faqs-h">${esc(t('faqHeading'))}</h2>
  <div class="lp-faq">${items}</div>
</section>`;
}

function _footer() {
  return `
<footer class="lp-footer" role="contentinfo">
  <div class="lp-footer__tagline">${esc(t('footerTagline'))}</div>
  <div class="lp-footer__sub">${esc(t('footerBuilt'))}</div>
  <div class="lp-footer__sub">${esc(t('footerTeam'))}</div>
</footer>`;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mount(el, opts = {}) {
  let _unsub   = null;
  let _lastSig = '';
  let _colleges = getColleges();
  let _storeData = null;
  let _screens   = [];

  function _sig() {
    const offline = isOffline();
    const qKey = _storeData
      ? _storeData.map(s => s.code + s.queue + s.slotsLeft).join('')
      : 'empty';
    return qKey + offline + getLang();
  }

  function _render() {
    const sig = _sig();
    if (sig === _lastSig) return;
    _lastSig = sig;
    const offline = isOffline();
    const lang    = getLang();
    el.innerHTML =
      _nav(lang, offline) +
      '<div class="lp-nav-spacer" aria-hidden="true"></div>' +
      _hero(_screens) +
      _features() +
      _benefits() +
      _how() +
      _preview(_screens) +
      _liveCount(_colleges, _storeData) +
      _picker() +
      _tools(offline) +
      _banner() +
      _faqs() +
      _footer();
  }

  function _onState(state) {
    if (!state) { _storeData = null; _screens = []; _render(); return; }
    const stalls = Object.values(state.stalls);
    _storeData = stalls.map(s => ({
      code: s.code, college: s.college,
      queue: s.queue.length,
      slotsLeft: Math.min(s.slotsLeft, s.slotsTotal),
      slotsTotal: s.slotsTotal,
    }));
    _screens = _buildScreens(state, _colleges);
    _render();
  }

  _unsub = subscribe(_onState);

  function _onClick(e) {
    const faqBtn = e.target.closest('[data-faq]');
    if (faqBtn) {
      const item  = faqBtn.closest('.lp-faq__item');
      const open  = item.classList.contains('lp-faq__item--open');
      item.classList.toggle('lp-faq__item--open', !open);
      faqBtn.setAttribute('aria-expanded', String(!open));
      return;
    }

    const toolBtn = e.target.closest('[data-tool]');
    if (toolBtn) {
      const tool = toolBtn.dataset.tool;
      if (tool === 'reset')   { resetAll(); _lastSig = ''; return; }
      if (tool === 'offline') { toggleOffline(); _lastSig = ''; _render(); return; }
      return;
    }

    const langBtn = e.target.closest('[data-langset]');
    if (langBtn) { setLang(langBtn.dataset.langset); _lastSig = ''; _render(); return; }
  }

  function _onChange(e) {
    if (e.target.id !== 'lp-cs') return;
    const code  = e.target.value;
    const gauge = el.querySelector('#lp-gauge');
    if (!gauge) return;
    if (!code || !_storeData) {
      gauge.innerHTML = `<div style="font-size:var(--caption);color:var(--ink-soft);">${esc(t('liveCountSelect'))}</div>`;
      return;
    }
    const st = _storeData.find(s => s.code === code);
    if (!st) return;
    const left = Math.max(0, st.slotsLeft);
    const tot  = st.slotsTotal;
    const pct  = tot > 0 ? Math.round(left / tot * 100) : 0;
    const full = left === 0;
    gauge.innerHTML = `
<div class="lp-gauge__bar"><div class="lp-gauge__fill" style="width:${pct}%"></div></div>
<div class="lp-gauge__text${full ? ' lp-gauge__text--full' : ''}">${full ? esc(t('liveCountFull')) : esc(t('liveCountSlots', left))}</div>
<div class="lp-gauge__sub">${left} / ${tot}</div>`;
  }

  function _onLang() { _lastSig = ''; _render(); }
  document.addEventListener('langchange', _onLang);
  el.addEventListener('click', _onClick);
  el.addEventListener('change', _onChange);

  return function unmount() {
    if (_unsub) _unsub();
    document.removeEventListener('langchange', _onLang);
    el.removeEventListener('click', _onClick);
    el.removeEventListener('change', _onChange);
    el.innerHTML = '';
  };
}