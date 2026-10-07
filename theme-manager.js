/**
 * Theme manager (brand palettes unchanged from V3: Default, Ocean, Sunset, Minimal; light + dark each).
 * What is new in V4:
 *  - loaded in <head>, so the saved theme is applied before the first paint (no flash of the wrong theme)
 *  - mode is Auto (follows the device, live) / Light / Dark; the colour theme is chosen separately
 *  - text colours on every coloured surface are picked by contrast (white or near-black), so all 8 combinations stay readable
 *  - a header button opens an accessible panel (radio groups, arrow keys, Esc, click outside, focus returns)
 *  - changes sync between open tabs; <meta name="theme-color"> and `color-scheme` follow the theme
 */
(() => {
  'use strict';

  const THEMES = {
    default: { name: 'Default',
      light: { primary: '#4361ee', secondary: '#2b2d42', background: '#f8f9fa', text: '#2d3748', accent: '#4cc9f0', success: '#2cb67d', warning: '#ff9e00', danger: '#e63946', card: '#ffffff', lightGray: '#edf2f7' },
      dark:  { primary: '#4895ef', secondary: '#131525', background: '#111827', text: '#e2e8f0', accent: '#48bfe3', success: '#31c48d', warning: '#f59e0b', danger: '#f05252', card: '#1f2937', lightGray: '#374151' } },
    ocean: { name: 'Ocean',
      light: { primary: '#006d77', secondary: '#083d56', background: '#edf6f9', text: '#2c3e50', accent: '#48cae4', success: '#2a9d8f', warning: '#e9c46a', danger: '#e76f51', card: '#ffffff', lightGray: '#e0fbfc' },
      dark:  { primary: '#00545c', secondary: '#05263a', background: '#0a1929', text: '#e0fbfc', accent: '#219ebc', success: '#1f766c', warning: '#bc8c4a', danger: '#bc5639', card: '#152232', lightGray: '#1c3041' } },
    sunset: { name: 'Sunset',
      light: { primary: '#fb8500', secondary: '#6a4c93', background: '#fff8f0', text: '#463f3a', accent: '#ffb703', success: '#52b788', warning: '#ffaa00', danger: '#d00000', card: '#ffffff', lightGray: '#f4f3ee' },
      dark:  { primary: '#c96800', secondary: '#543c73', background: '#2f2d2c', text: '#f2e9e4', accent: '#cc9102', success: '#3d8a66', warning: '#cc8800', danger: '#9e0000', card: '#3a3735', lightGray: '#4a4846' } },
    minimal: { name: 'Minimal',
      light: { primary: '#5348c8', secondary: '#292929', background: '#f5f7fa', text: '#1a202c', accent: '#9f7aea', success: '#38a169', warning: '#ed8936', danger: '#e53e3e', card: '#ffffff', lightGray: '#edf2f7' },
      dark:  { primary: '#805ad5', secondary: '#1a202c', background: '#0e141b', text: '#f7fafc', accent: '#b794f4', success: '#48bb78', warning: '#f6ad55', danger: '#fc8181', card: '#1e2533', lightGray: '#2d3748' } }
  };
  const DEFAULTS = { theme: 'default', mode: 'auto' };
  const KEYS = { theme: 'navan.theme', mode: 'navan.mode' };
  const LEGACY = { theme: 'app_theme', mode: 'app_mode' };             // V3 keys: a saved V3 choice is carried over once
  const MODES = [['auto', 'Auto', 'fa-circle-half-stroke'], ['light', 'Light', 'fa-sun'], ['dark', 'Dark', 'fa-moon']];
  const root = document.documentElement;
  const dark = matchMedia('(prefers-color-scheme: dark)');

  // ---------- colour maths ----------
  const rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const onColor = bg => ratio('#ffffff', bg) >= ratio('#0f172a', bg) ? '#ffffff' : '#0f172a';     // white or near-black, whichever reads better
  const alpha = (h, a) => `rgba(${rgb(h).join(',')},${a})`;
  const hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const solid = c => { let h = c, k = 0; while (ratio('#ffffff', h) < 4.6 && k < 70) { k += 3; h = hex(rgb(c).map(v => v * (1 - k / 100))); } return h; };   // darken until white text reads (used for the red buttons)

  // ---------- storage (never throws: private mode / blocked storage just means "not remembered") ----------
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };
  function load() {
    let theme = store.get(KEYS.theme), mode = store.get(KEYS.mode);
    if (!theme && store.get(LEGACY.theme)) theme = store.get(LEGACY.theme);
    if (!mode && store.get(LEGACY.mode)) mode = store.get(LEGACY.mode);
    return { theme: THEMES[theme] ? theme : DEFAULTS.theme, mode: ['auto', 'light', 'dark'].includes(mode) ? mode : DEFAULTS.mode };
  }

  let state = load(), panel = null, toggle = null, animTimer;
  const resolved = () => state.mode === 'auto' ? (dark.matches ? 'dark' : 'light') : state.mode;

  // ---------- apply ----------
  function apply({ animate = false } = {}) {
    const m = resolved(), t = THEMES[state.theme][m], s = root.style;
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-anim'); clearTimeout(animTimer); animTimer = setTimeout(() => root.classList.remove('theme-anim'), 350);
    }
    const set = (k, v) => s.setProperty(k, v);
    set('--primary-color', t.primary); set('--secondary-color', t.secondary); set('--background-color', t.background); set('--text-color', t.text);
    set('--accent-color', t.accent); set('--success-color', t.success); set('--warning-color', t.warning); set('--danger-color', t.danger);
    set('--card-bg', t.card); set('--light-gray', t.lightGray); set('--white', m === 'light' ? '#ffffff' : t.card);
    // readable text for every coloured surface, whatever the theme
    set('--on-primary', onColor(t.primary)); set('--on-secondary', onColor(t.secondary)); set('--on-accent', onColor(t.accent));
    set('--on-danger', onColor(t.danger)); set('--on-success', onColor(t.success));
    set('--danger-solid', solid(t.danger));
    set('--manual-bg', alpha(t.primary, m === 'light' ? .12 : .3)); set('--manual-bg-hover', alpha(t.primary, m === 'light' ? .22 : .42));
    set('--focus-ring', ratio(t.primary, t.background) >= 3 ? t.primary : t.accent);
    set('--link', [t.primary, t.accent, t.text].find(c => ratio(c, t.background) >= 4.5 && ratio(c, t.card) >= 4.5) || t.text);   // link colour that reads on both the page background and cards
    root.dataset.theme = m; root.dataset.themeName = state.theme; root.dataset.mode = state.mode;
    s.colorScheme = m;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.secondary;
    syncUI();
  }
  function save() { store.set(KEYS.theme, state.theme); store.set(KEYS.mode, state.mode); }
  function change(patch) {
    const next = { ...state, ...patch };
    if (!THEMES[next.theme] || !['auto', 'light', 'dark'].includes(next.mode)) return false;
    if (next.theme === state.theme && next.mode === state.mode) return true;
    state = next; save(); apply({ animate: true });
    window.navanTrack?.('theme_change', { theme: state.theme, mode: state.mode });
    document.dispatchEvent(new CustomEvent('navan:theme', { detail: { ...state, resolved: resolved() } }));
    return true;
  }

  // ---------- UI: header button + popover ----------
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function buildPanel() {
    toggle = document.getElementById('theme-toggle'); panel = document.getElementById('theme-panel');
    if (!toggle || !panel) return;                                    // static pages only need the theme applied
    panel.innerHTML = '';
    const modeG = el('div', 'tp-seg'); modeG.setAttribute('role', 'radiogroup'); modeG.setAttribute('aria-label', 'Appearance');
    MODES.forEach(([id, label, icon]) => {
      const b = el('button', 'tp-opt', `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span>`);
      b.type = 'button'; b.dataset.mode = id; b.setAttribute('role', 'radio'); modeG.appendChild(b);
    });
    const themeG = el('div', 'tp-themes'); themeG.setAttribute('role', 'radiogroup'); themeG.setAttribute('aria-label', 'Colour theme');
    Object.entries(THEMES).forEach(([id, th]) => {
      const b = el('button', 'tp-theme', `<span class="tp-sw" aria-hidden="true"></span><span>${th.name}</span>`);
      b.type = 'button'; b.dataset.theme = id; b.setAttribute('role', 'radio'); themeG.appendChild(b);
    });
    const reset = el('button', 'tp-reset', 'Reset to default'); reset.type = 'button';
    panel.append(el('h2', 'tp-h', 'Appearance'), modeG, el('h2', 'tp-h', 'Colour theme'), themeG, reset);

    modeG.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) change({ mode: b.dataset.mode }); });
    themeG.addEventListener('click', e => { const b = e.target.closest('[data-theme]'); if (b) change({ theme: b.dataset.theme }); });
    reset.addEventListener('click', () => change({ ...DEFAULTS }));
    [modeG, themeG].forEach(g => g.addEventListener('keydown', e => {  // arrow keys move between radios, like native radio buttons
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }; if (!(e.key in keys)) return;
      const opts = [...g.querySelectorAll('[role=radio]')], i = opts.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); const n = opts[(i + keys[e.key] + opts.length) % opts.length]; n.focus(); n.click();
    }));

    toggle.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel(true)));
    document.addEventListener('pointerdown', e => { if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) closePanel(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { closePanel(true); } });
    panel.addEventListener('focusout', e => { if (!panel.hidden && e.relatedTarget && !panel.contains(e.relatedTarget) && e.relatedTarget !== toggle) closePanel(false); });
    syncUI();
  }
  function openPanel() {
    panel.hidden = false; toggle.setAttribute('aria-expanded', 'true');
    (panel.querySelector('[aria-checked=true]') || panel.querySelector('button'))?.focus({ preventScroll: true });
  }
  function closePanel(returnFocus) {
    if (!panel || panel.hidden) return;
    panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); if (returnFocus) toggle.focus({ preventScroll: true });
  }
  function syncUI() {
    if (!toggle) return;
    const m = resolved(), icon = toggle.querySelector('i');
    if (icon) icon.className = 'fa-solid ' + (m === 'dark' ? 'fa-moon' : 'fa-sun');
    const label = `Theme: ${THEMES[state.theme].name}, ${state.mode === 'auto' ? 'Auto (' + m + ' now)' : state.mode}`;
    toggle.setAttribute('aria-label', label); toggle.title = label;
    if (!panel) return;
    panel.querySelectorAll('[data-mode]').forEach(b => { const on = b.dataset.mode === state.mode; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; b.classList.toggle('on', on); });
    panel.querySelectorAll('[data-theme]').forEach(b => {
      const on = b.dataset.theme === state.theme, c = THEMES[b.dataset.theme][m];
      b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; b.classList.toggle('on', on);
      b.querySelector('.tp-sw').style.background = `linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%)`;
    });
  }

  // ---------- boot ----------
  apply();                                                            // runs while <head> is parsed: first paint already has the right colours
  dark.addEventListener?.('change', () => { if (state.mode === 'auto') apply({ animate: true }); });
  addEventListener('storage', e => { if (e.key && !Object.values(KEYS).includes(e.key)) return; state = load(); apply({ animate: true }); });   // another tab changed the theme
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildPanel); else buildPanel();

  window.NavanTheme = { get: () => ({ ...state, resolved: resolved() }), set: change, themes: THEMES, ratio };
})();
