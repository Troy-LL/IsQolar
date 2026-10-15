// js/views/board.js — Now Serving Board view
// mount(el, opts) -> unmount fn
// Built out fully in M6.

import { t, tp } from '../i18n.js';

export function mount(el, opts = {}) {
  el.innerHTML = `
<div class="pq-view" style="align-items:center;justify-content:center;padding:var(--space-8) var(--space-4);">
  <p style="font-size:var(--text-m);color:var(--ink);text-align:center;">${tp('boardNowServing', 'boardNowServingFil')} — built in M6.</p>
  <a href="#home" class="pq-btn pq-btn--quiet" style="margin-top:var(--space-4);max-width:240px;" data-go="home">${t('exitPrototype')}</a>
</div>`.trim();

  return function unmount() {
    el.innerHTML = '';
  };
}
