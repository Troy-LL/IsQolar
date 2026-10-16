// Per-device accessibility settings. Flags that staff need to see (written communication, guide) live on the ticket instead.
const KEY = 'isqolar.a11y';
const DEFAULTS = { text: 100, contrast: false };
export function get() { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; } }
export function set(patch) { const v = { ...get(), ...patch }; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ } return v; }
