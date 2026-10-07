// Navigation, search, reset and small page behaviours. The script cards themselves live in copy-function.js; rendering in sync-inputs.js.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const live = msg => { const l = $('#live'); if (l) l.textContent = msg; };
  const DOM = {
    main: $('.main-page'), nav: $('.script-nav-container'), canvas: $('.script-canvas'),
    input: $('#search-input'), searchBtn: $('#search-action'), clearBtn: $('#search-clear'),
    count: $('#search-count'), noResults: $('#no-results'), reset: $('.global-script-reset')
  };
  const modules = () => [...DOM.canvas.querySelectorAll('.script-module')];
  const subOf = title => { let n = title.nextElementSibling; while (n && !n.classList.contains('script-card-sub')) n = n.nextElementSibling; return n; };

  // ---------- tab state ----------
  const App = window.NavanApp = {
    ready: false,
    activeTab: null,
    searching: false,
    setActive(tab) {                                                  // show one category
      if (this.searching) Search.restore(true);
      this.activeTab = tab;
      DOM.nav.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      this.applyActive();
    },
    applyActive() {
      modules().forEach(m => {
        const on = m.dataset.tab === this.activeTab;
        m.classList.toggle('active', on);
        m.querySelectorAll('.script-title, .script-card-sub').forEach(e => e.classList.toggle('active', on));
      });
    }
  };

  // ---------- search ----------
  const Search = {
    reset() { modules().forEach(m => { m.classList.remove('active'); m.querySelectorAll('.script-title, .script-card-sub').forEach(e => e.classList.remove('active')); }); },
    restore(keepInput) {
      App.searching = false; document.body.classList.remove('search-active');
      DOM.noResults.classList.remove('show'); DOM.count.textContent = '';
      if (!keepInput) DOM.input.value = '';
      DOM.clearBtn.hidden = !DOM.input.value;
      this.reset(); App.applyActive();
    },
    match(text, terms) {                                              // every typed word must start or sit inside some word of the text
      if (!text || !terms.length) return false;
      const words = text.toLowerCase().split(/\s+/);
      return terms.every(t => words.some(w => w.includes(t)));
    },
    activate(title) {
      const mod = title.closest('.script-module'), sub = subOf(title);
      if (!mod) return false;
      mod.classList.add('active'); title.classList.add('active'); sub?.classList.add('active'); return true;
    },
    run(term) {
      term = term.trim(); DOM.clearBtn.hidden = !DOM.input.value;
      if (!term) { if (App.searching) this.restore(); return; }
      App.searching = true; document.body.classList.add('search-active'); this.reset();
      const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
      let hits = 0;
      DOM.canvas.querySelectorAll('.script-title').forEach(t => {     // 1) titles and descriptions
        const h = t.querySelector('h4')?.textContent.trim() || '', p = t.querySelector('p')?.textContent.trim() || '';
        if (this.match(h, terms) || this.match(p, terms) || this.match((h + ' ' + p).trim(), terms)) { if (this.activate(t)) hits++; }
      });
      if (!hits) {                                                    // 2) no title matched: look inside the scripts
        DOM.canvas.querySelectorAll('.card-module').forEach(card => {
          const sub = card.closest('.script-card-sub'); if (!sub) return;
          const text = (card.querySelector('.card-content')?.textContent || '').toLowerCase();
          if (!terms.every(t => text.includes(t))) return;
          let t = sub.previousElementSibling; while (t && !t.classList.contains('script-title')) t = t.previousElementSibling;
          if (t && !t.classList.contains('active') && this.activate(t)) hits++;
        });
      }
      DOM.noResults.classList.toggle('show', !hits);
      const msg = hits ? `${hits} ${hits === 1 ? 'script' : 'scripts'} found` : 'No matching scripts found';
      DOM.count.textContent = hits ? msg : ''; live(msg);
      window.scrollTo({ top: 0 });
      window.navanTrack?.('search', { results: hits, terms: terms.length });
    },
    init() {
      DOM.searchBtn.addEventListener('click', () => this.run(DOM.input.value));
      DOM.input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); this.run(DOM.input.value); }
        else if (e.key === 'Escape' && DOM.input.value) { this.restore(); }
      });
      let timer; DOM.input.addEventListener('input', () => { clearTimeout(timer); DOM.clearBtn.hidden = !DOM.input.value; timer = setTimeout(() => this.run(DOM.input.value), 300); });
      DOM.clearBtn.addEventListener('click', () => { this.restore(); DOM.input.focus(); });
    }
  };

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', () => {
    Search.init();
    $('#year').textContent = new Date().getFullYear();
    DOM.nav.addEventListener('click', e => {                          // delegated: the tab buttons are created (and moved) after load
      const b = e.target.closest('.nav-btn'); if (!b) return;
      App.setActive(b.dataset.tab);
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'auto' });   // a new category starts at its first script
      window.navanTrack?.('tab_click', { tab: b.dataset.tab });
    });
    DOM.reset.addEventListener('click', () => { window.NavanCards?.resetAll(); live('All fields were reset'); });
    document.addEventListener('keydown', e => {                       // "/" jumps to search, like most script tools
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const a = document.activeElement; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      e.preventDefault(); DOM.input.focus(); DOM.input.select();
    });
    document.querySelector('.to-top')?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); DOM.main.focus({ preventScroll: true }); });
    // keep the page clear of the fixed bars: body padding / scroll-padding follow their real height (the footer grows when the Legal list opens)
    const size = (sel, prop) => { const el = $(sel); if (!el) return; const set = () => document.documentElement.style.setProperty(prop, Math.ceil(el.getBoundingClientRect().height) + 'px'); set(); new ResizeObserver(set).observe(el); };
    size('#top-stack', '--top-h'); size('#bottom-bar', '--bottom-h');
    const tg = $('.legal-toggle'), links = $('#legal-links');
    tg?.addEventListener('click', () => { const open = links.classList.toggle('open'); tg.setAttribute('aria-expanded', String(open)); $('#bottom-bar')?.classList.toggle('legal-open', open); });
    $('#privacy-choices')?.addEventListener('click', e => {           // Google's consent message (set up in AdSense > Privacy & messaging) can be re-opened here
      const fc = window.googlefc; if (fc && typeof fc.showRevocationMessage === 'function') { e.preventDefault(); fc.showRevocationMessage(); }
    });
    $('#load-retry')?.addEventListener('click', () => window.NavanLoad?.());
  });
})();
