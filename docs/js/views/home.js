// js/views/home.js — Landing page view
// mount(el, opts) -> unmount fn
// Built out fully in M3.

import { t } from '../i18n.js';

export function mount(el, opts = {}) {
  el.innerHTML = `
<div class="pq-view lp-shell" style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-6);padding:var(--space-8) var(--space-4);">
  <div style="text-align:center;">
    <span style="font-family:var(--font-mark);font-size:36px;font-weight:700;color:var(--maroon);">PUP</span>
    <span style="font-size:var(--heading-m);font-weight:700;color:var(--ink);"> Enrollment Queue</span>
  </div>
  <p style="max-width:480px;text-align:center;font-size:var(--text-m);color:var(--ink);">IsQolar prototype — M1 foundation complete. Landing page will be built in M3.</p>
  <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%;max-width:320px;">
    <a href="#student" class="pq-btn pq-btn--primary" data-go="student">Student</a>
    <a href="#guardian" class="pq-btn pq-btn--quiet" data-go="guardian">Guardian</a>
    <a href="#stall" class="pq-btn pq-btn--quiet" data-go="stall">Staff</a>
    <a href="#board" class="pq-btn pq-btn--quiet" data-go="board">Now Serving Board</a>
  </div>
</div>`.trim();

  return function unmount() {
    el.innerHTML = '';
  };
}
