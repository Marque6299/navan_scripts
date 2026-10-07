(() => {
  'use strict';
  // AdSense placement for a content-only page: in-feed units between script cards (a fresh set for every category the agent opens)
  // plus one unit after the last card. Units are empty labelled boxes at zero size until AdSense fills them, are requested only when
  // near the screen, only on a visible tab, only after scripts are on screen, and never faster than `maxRequestsPerMin`.
  const cfg = (window.NAVAN_CONFIG || {}).ads || {}, S = cfg.slots || {};
  const F = Object.assign({ enabled: true, everyCards: [2, 3], minContentPx: 240, minContentPxMobile: 400, maxPerView: 12, dwellMs: 1200, maxRequestsPerMin: 10, initialView: true }, cfg.feed);
  const track = (n, p) => window.navanTrack?.(n, p);
  const $ = s => document.querySelector(s);
  const pick = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));

  // A slot is an empty labelled box until its request: the <ins> is created inside fill(), right before adsbygoogle.push().
  // AdSense fills the FIRST unprocessed <ins> in the page, so having exactly one at push time guarantees the right box gets the ad.
  const make = (cls, key, id, fmt = 'auto') => {
    const a = document.createElement('aside'); a.className = `ad-slot ${cls}`; a.dataset.slot = key; a.dataset.unit = id; a.dataset.fmt = fmt;
    a.setAttribute('aria-label', 'Advertisement'); a.innerHTML = '<span class="ad-label">Advertisement</span>'; return a;
  };
  const insFor = slot => {
    const ins = document.createElement('ins'); ins.className = 'adsbygoogle'; ins.style.display = 'block';
    ins.setAttribute('data-ad-client', cfg.client); ins.setAttribute('data-ad-slot', slot.dataset.unit);
    ins.setAttribute('data-ad-format', slot.dataset.fmt); ins.setAttribute('data-full-width-responsive', 'true'); return ins;
  };

  // ---- request gate shared by every placement: visible tab only, bounded request rate ----
  const stamps = [];
  const allowed = () => { const now = Date.now(); while (stamps.length && now - stamps[0] > 60000) stamps.shift(); return stamps.length < (F.maxRequestsPerMin || 10); };
  const waiting = new Set();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') [...waiting].forEach(s => { waiting.delete(s); fill(s); }); });

  const feed = { tab: null, armed: false, pending: [], timer: null };
  let io;
  function fill(slot) {                    // one request per slot element, never into a zero-width responsive box
    if (!slot.isConnected || slot.dataset.requested) return;
    if (document.visibilityState !== 'visible') { waiting.add(slot); return; }
    if (slot.getBoundingClientRect().width === 0) return;
    if (!allowed()) {                      // over the per-minute cap: a feed unit is simply dropped (the view is stale by then); the end unit waits for the window to clear
      track('ads_slot_throttled', { slot: slot.dataset.slot });
      if (slot.classList.contains('ad-feed')) { slot.remove(); return; }
      setTimeout(() => fill(slot), Math.max(1000, 60200 - (Date.now() - stamps[0])));
      return;
    }
    slot.dataset.requested = '1'; stamps.push(Date.now());
    const ins = insFor(slot); slot.append(ins);
    new MutationObserver((_, mo) => {
      const s = ins.getAttribute('data-ad-status');
      if (s !== 'filled' && s !== 'unfilled') return;
      mo.disconnect();
      slot.classList.add(s === 'filled' ? 'is-filled' : 'is-empty');
      track('ads_slot_' + s, { slot: slot.dataset.slot });
    }).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); track('ads_slot_requested', { slot: slot.dataset.slot }); }
    catch { slot.classList.add('is-empty'); }
  }

  // ---- in-feed units between cards, a fresh set for every category the agent opens ----
  const activeTab = () => $('.script-nav-container .nav-btn.active')?.dataset.tab || null;
  function clearFeed() {
    clearTimeout(feed.timer); feed.armed = false; feed.pending = [];
    document.querySelectorAll('.ad-feed').forEach(el => { io.unobserve(el); waiting.delete(el); el.remove(); });
  }
  function planFeed() {
    clearFeed();
    const id = S.feed || S.banner;
    if (!F.enabled || !id || document.body.classList.contains('search-active')) return;
    const mod = $('.script-module.active'); if (!mod) return;
    const subs = [...mod.querySelectorAll(':scope > .script-card-sub.active')];
    let since = 0, height = 0, goal = pick(F.everyCards), placed = 0;
    const minPx = innerWidth <= 768 ? (F.minContentPxMobile ?? F.minContentPx) : F.minContentPx;   // phone cards are taller and ads fill the width: keep ads clearly outweighed by content
    subs.forEach((sub, si) => {
      const cards = [...sub.querySelectorAll(':scope > .card-module')];
      cards.forEach((card, ci) => {
        since++; height += card.offsetHeight;
        if ((F.maxPerView && placed >= F.maxPerView) || since < goal || height < minPx) return;
        const lastCard = ci === cards.length - 1;
        if (lastCard && si === subs.length - 1) return;              // nothing follows: the end-of-page unit covers it
        const el = make('ad-feed', 'feed', id, 'horizontal');
        (lastCard ? sub : card).after(el);                           // between two cards, or between two script entries
        io.observe(el);
        placed++; since = 0; height = 0; goal = pick(F.everyCards);
      });
    });
    if (placed) feed.timer = setTimeout(() => { feed.armed = true; feed.pending.splice(0).forEach(fill); }, F.dwellMs);
  }
  function viewChanged() {                                           // after the clicked category is on screen
    const t = activeTab();
    if (t === feed.tab) return;                                      // same category again: no new request
    feed.tab = t; planFeed();
  }

  document.addEventListener('scripts:rendered', () => {
    if (!cfg.enabled || window.NAVAN_CONSENT?.ads === false) return;
    const main = $('.main-page');
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      if (e.target.classList.contains('ad-feed') && !feed.armed) { feed.pending.push(e.target); return; }   // feed units wait for the dwell time
      fill(e.target);
    }), { rootMargin: '400px 0px' });                                // the page scrolls, so the viewport is the root: ads load just below the fold

    if (S.end) { const end = make('ad-end', 'end', S.end); main.append(end); io.observe(end); }
    $('.script-nav-container').addEventListener('click', e => {      // runs after the tab's own handler, so the new category is already active
      if (!e.target.closest('.nav-btn')) return;
      requestAnimationFrame(() => requestAnimationFrame(viewChanged));
    });
    feed.tab = activeTab();
    if (F.initialView) requestAnimationFrame(planFeed);
  }, { once: true });
})();
