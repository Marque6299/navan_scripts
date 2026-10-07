(() => {
  'use strict';
  // Version check + safe refresh. Every `updates.checkEveryMin` minutes the live files are compared with the ones this tab loaded.
  // When something changed: save every input to sessionStorage (this tab only, never sent anywhere), wait for a quiet moment,
  // reload, then put everything back. The snapshot is used once and deleted.
  const cfg = window.NAVAN_CONFIG || {};
  const C = Object.assign({ enabled: true, checkEveryMin: 10, quietMs: 4000, maxWaitMs: 60000, reloadEvenIfUnchanged: false }, cfg.updates);
  const KEY = 'navan.session.snapshot', LAST = 'navan.session.lastReload', FRESH_MS = 3 * 60 * 1000, MIN_GAP_MS = 5 * 60 * 1000;
  const $ = s => document.querySelector(s), byId = id => document.getElementById(id);
  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); return true; } catch { return false; } },
    del: k => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } }
  };
  const live = msg => { const l = byId('live'); if (l) l.textContent = msg; };

  // ---------- small status toast ----------
  function toast(msg, action) {
    let t = byId('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    if (action) { const b = document.createElement('button'); b.type = 'button'; b.textContent = action.label; b.addEventListener('click', action.run); t.appendChild(b); }
    t.classList.add('show'); live(msg);
    clearTimeout(t._h); if (!action) t._h = setTimeout(() => t.classList.remove('show'), 6000);
  }

  // ---------- capture ----------
  function collect() {
    const snap = { v: 1, t: Date.now(), fields: {}, cards: {}, scroll: Math.round(window.scrollY) };
    snap.tab = $('.script-nav-container .nav-btn.active')?.dataset.tab || null;
    ['customer', 'user', 'search-input'].forEach(id => { const el = byId(id); if (el && el.value !== '') snap.fields[id] = el.value; });
    document.querySelectorAll('.card-module[data-uid]').forEach(card => {       // placeholders that differ from their default text
      const rows = [];
      card.querySelectorAll('.manual-edit').forEach((f, i) => { const d = f.dataset.defaultText, t = f.textContent.trim(); if (t && t !== d) rows.push([i, d, t]); });
      if (rows.length) snap.cards[card.dataset.uid] = rows;
    });
    const a = document.activeElement; if (a && a.id && /^(INPUT|TEXTAREA)$/.test(a.tagName)) snap.focus = a.id;
    return snap;
  }

  // ---------- restore ----------
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  async function restore(snap) {
    window.NAVAN_RESTORING = true;                                   // keeps replayed clicks out of the usage events
    try {
      const F = snap.fields || {};
      ['customer', 'user'].forEach(id => { if (F[id] != null && byId(id)) { byId(id).value = F[id]; fire(byId(id), 'input'); } });   // header first: it fills the shared [placeholders]
      if (snap.tab) [...document.querySelectorAll('.script-nav-container .nav-btn')].find(b => b.dataset.tab === snap.tab)?.click();
      const cards = new Map([...document.querySelectorAll('.card-module[data-uid]')].map(c => [c.dataset.uid, c]));
      Object.entries(snap.cards || {}).forEach(([uid, rows]) => {
        const fields = cards.get(uid)?.querySelectorAll('.manual-edit');
        if (fields) rows.forEach(([i, d, t]) => { if (fields[i] && fields[i].dataset.defaultText === d) fields[i].textContent = t; });   // skip a field if the new version changed the card
      });
      window.NavanCards?.updateAll();
      if (F['search-input'] && byId('search-input')) { byId('search-input').value = F['search-input']; fire(byId('search-input'), 'input'); }
      await new Promise(r => setTimeout(r, F['search-input'] ? 420 : 30));        // let a restored search finish before scrolling
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (snap.scroll) window.scrollTo({ top: snap.scroll, behavior: 'instant' });
      if (snap.focus && byId(snap.focus)) byId(snap.focus).focus({ preventScroll: true });
      toast('Updated to the latest version. Your entries were restored.');
    } finally { window.NAVAN_RESTORING = false; }
  }

  // ---------- version check ----------
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const watched = () => {
    const urls = new Set([new URL('.', location.href).href, new URL((cfg.site || {}).dataFile || 'script_entries.json', location.href).href]);
    document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(el => {
      try { const u = new URL(el.getAttribute('src') || el.getAttribute('href'), location.href); if (u.origin === location.origin) urls.add(u.href); } catch { /* ignore */ }
    });
    return [...urls];
  };
  async function fingerprint(url) {                                  // validators first (cheap HEAD); body hash only when the host sends none
    const h = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!h.ok) return null;
    const tag = h.headers.get('etag') || h.headers.get('last-modified');
    if (tag) return tag + '|' + (h.headers.get('content-length') || '');
    const g = await fetch(url, { cache: 'no-store' });
    return g.ok ? 'h' + hash(await g.text()) : null;
  }
  const sample = async urls => Object.fromEntries(await Promise.all(urls.map(async u => [u, await fingerprint(u).catch(() => null)])));
  const differs = (a, b) => Object.keys(a).some(u => a[u] && b[u] && a[u] !== b[u]);

  let base = null, lastInput = Date.now(), lastCheck = Date.now(), applying = false;
  ['keydown', 'pointerdown', 'input', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastInput = Date.now(); }, { capture: true, passive: true }));

  async function check() {
    if (applying || !navigator.onLine) return;
    lastCheck = Date.now();
    try {
      if (!base) { base = await sample(watched()); return; }
      const urls = Object.keys(base), now = await sample(urls);
      let changed = differs(base, now);
      if (changed) { await new Promise(r => setTimeout(r, 1500)); changed = differs(base, await sample(urls)); }   // confirm once: avoids a reload on a CDN blip
      if (changed || C.reloadEvenIfUnchanged) applyUpdate();
    } catch { /* offline or blocked: try again next cycle */ }
  }

  function reload() {
    if (!ss.set(KEY, JSON.stringify(collect()))) {                   // never reload if the inputs cannot be saved first
      applying = false;
      return toast('A new version is available.', { label: 'Update now', run: () => { ss.set(KEY, JSON.stringify(collect())); location.reload(); } });
    }
    ss.set(LAST, String(Date.now()));
    location.reload();
  }
  function applyUpdate() {
    if (applying || Date.now() - Number(ss.get(LAST) || 0) < MIN_GAP_MS) return;   // never more than one automatic reload per 5 minutes (loop guard)
    applying = true;
    const t0 = Date.now(); let done = false;
    const go = () => {
      if (done || document.visibilityState !== 'visible') return;    // a hidden tab waits until the agent is back
      if (Date.now() - lastInput < C.quietMs && Date.now() - t0 < C.maxWaitMs) return setTimeout(go, 500);
      done = true; document.removeEventListener('visibilitychange', go);
      toast('Updating to the latest version\u2026'); setTimeout(reload, 900);
    };
    document.addEventListener('visibilitychange', go);
    go();
  }

  // ---------- boot ----------
  function boot() {
    const raw = ss.get(KEY);
    if (raw) {
      ss.del(KEY);                                                   // single use
      let snap = null; try { snap = JSON.parse(raw); } catch { /* ignore */ }
      if (snap && Date.now() - snap.t < FRESH_MS) {
        if (window.NavanApp?.ready) restore(snap); else document.addEventListener('scripts:rendered', () => restore(snap), { once: true });
      }
    }
    if (!C.enabled) return;
    setTimeout(check, 4000);                                         // baseline of what this tab loaded
    setInterval(check, Math.max(1, C.checkEveryMin) * 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && base && Date.now() - lastCheck > C.checkEveryMin * 60000) check(); });
  }
  window.NavanSession = { collect, restore, check, snapshotNow: () => ss.set(KEY, JSON.stringify(collect())) };   // handy for testing in the console
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
