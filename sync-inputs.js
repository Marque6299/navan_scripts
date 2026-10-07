// Loads script_entries.json and renders the category buttons, entry titles and cards.
// Content rules: titles and descriptions are plain text; a card is plain text plus <br> line breaks and [placeholders].
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const cfg = window.NAVAN_CONFIG || {}, site = cfg.site || {};
  const $ = s => document.querySelector(s);
  const nav = $('.script-nav-container'), canvas = $('.script-canvas'), err = $('#load-error');
  const NEW_MS = (cfg.newBadgeDays || 7) * 86400000;

  async function getJson(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' ' + r.status);
    const d = await r.json();
    if (!Array.isArray(d)) throw new Error('script_entries.json must be a list');
    return d;
  }
  async function fetchData() {
    try { return await getJson(site.dataFile || 'script_entries.json'); }
    catch (e) {
      if (!site.dataFallbackUrl) throw e;
      return getJson(site.dataFallbackUrl);                            // e.g. the page was opened from disk
    }
  }

  // "[Customer Name]" becomes an editable chip; "<br>" is the only markup a card may contain.
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function renderContent(text) {
    return String(text).split(/<br\s*\/?>/i).map(part => {
      let out = '', last = 0;
      part.replace(/\[(.+?)\]/g, (m, _g, at) => { out += esc(part.slice(last, at)) + `<span class="manual-edit" data-default-text="${esc(m)}">${esc(m)}</span>`; last = at + m.length; return m; });
      return out + esc(part.slice(last));
    }).join('<br>');
  }
  const labelOf = id => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const fmtDate = iso => new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });

  function render(data) {
    const groups = new Map();
    data.forEach(e => { if (e && e.id != null && Array.isArray(e.cards)) { if (!groups.has(e.id)) groups.set(e.id, []); groups.get(e.id).push(e); } });
    const ids = [...groups.keys()], first = ids.includes('Opening') ? 'Opening' : ids[0];

    nav.textContent = '';
    ids.forEach(id => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nav-btn' + (id === first ? ' active' : ''); b.dataset.tab = id;
      const s = document.createElement('span'); s.textContent = labelOf(id); b.appendChild(s); nav.appendChild(b);
    });

    canvas.textContent = '';
    const now = Date.now(); let cardCount = 0, newest = 0;
    ids.forEach(id => {
      const mod = document.createElement('div'); mod.className = 'script-module' + (id === first ? ' active' : ''); mod.dataset.tab = id;
      groups.get(id).forEach((entry, ei) => {
        const t = document.createElement('div'); t.className = 'script-title' + (id === first ? ' active' : '');
        const h = document.createElement('h4'); h.textContent = entry.title || id; t.appendChild(h);
        if (entry.description && entry.description.trim()) { const p = document.createElement('p'); p.textContent = entry.description; t.appendChild(p); }
        mod.appendChild(t);
        const sub = document.createElement('div'); sub.className = 'script-card-sub' + (id === first ? ' active' : ''); mod.appendChild(sub);
        entry.cards.forEach((c, ci) => {
          const card = document.createElement('div'); card.className = 'card-module'; card.dataset.uid = `${id}|${ei}|${ci}`;
          if (c.created) card.dataset.created = c.created; if (c.updated) card.dataset.updated = c.updated;
          const body = document.createElement('div'); body.className = 'card-content'; body.innerHTML = renderContent(c.content || ''); card.appendChild(body);
          const isNew = c.created && now - new Date(c.created) < NEW_MS, isUpd = c.updated && now - new Date(c.updated) < NEW_MS;
          if (isNew || isUpd) {
            const tag = document.createElement('div'); tag.className = 'timestamp-banner ' + (isNew ? 'new-banner' : 'updated-banner'); tag.textContent = isNew ? 'New' : 'Updated';
            card.classList.add('has-banner'); card.insertBefore(tag, card.firstChild);
          }
          const u = Date.parse(c.updated || c.created || ''); if (u > newest) newest = u;
          cardCount++; sub.appendChild(card);
        });
      });
      canvas.appendChild(mod);
      if (mod.querySelector('.timestamp-banner')) {                    // "something new in here" dot on the category button
        const b = nav.querySelector(`.nav-btn[data-tab="${CSS.escape(id)}"]`);
        if (b) { b.classList.add('has-updates'); const dot = document.createElement('span'); dot.className = 'nav-badge'; dot.textContent = '!'; dot.setAttribute('aria-hidden', 'true'); b.appendChild(dot); }
      }
    });

    canvas.setAttribute('aria-busy', 'false'); err.classList.remove('show');
    window.NavanApp.activeTab = first;
    window.NavanCards?.init(canvas);
    const meta = $('#footer-meta');
    if (meta) meta.textContent = `${ids.length} categories \u00B7 ${cardCount} scripts` + (newest ? ` \u00B7 updated ${fmtDate(newest)}` : '');
    window.NavanApp.ready = true;
    document.dispatchEvent(new CustomEvent('scripts:rendered', { detail: { tabs: ids.length, cards: cardCount } }));
  }

  async function load() {
    err.classList.remove('show'); canvas.setAttribute('aria-busy', 'true');
    try { render(await fetchData()); }
    catch (e) {
      console.error('Failed to load scripts:', e);
      canvas.textContent = ''; canvas.setAttribute('aria-busy', 'false'); err.classList.add('show');
    }
  }
  window.NavanLoad = load;
  load();
});
