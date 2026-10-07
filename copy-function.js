// Script cards: editable [placeholders], click-to-copy, per-card reset, and sync with the Customer / Agent header fields.
(() => {
  'use strict';
  const cfg = window.NAVAN_CONFIG || {};
  const BIND = cfg.placeholders || {};                                // '[Customer Name]' -> 'customer' (id of the header input)
  const MSG = { success: '\u2713 Copied to clipboard', empty: '\u26A0 Please fill in all fields', error: '\u2717 Failed to copy' };
  const TOOLTIP_MS = 1500;
  const $ = s => document.querySelector(s);
  const live = msg => { const l = $('#live'); if (l) l.textContent = msg; };
  const fieldsAll = () => [...document.querySelectorAll('.manual-edit')];
  const fieldsOf = dt => fieldsAll().filter(f => f.dataset.defaultText === dt);
  const isDefault = f => f.textContent.trim() === '' || f.textContent === f.dataset.defaultText;

  // ---------- tooltip (fixed position, so it stays right inside the scrolling page) ----------
  let tip, tipTimer, tipTarget;
  function showTip(message, type, target) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'copy-tooltip'; tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip); }
    tipTarget = target; tip.className = `copy-tooltip ${type} show`; tip.textContent = message; placeTip();
    clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.classList.remove('show'); tipTarget = null; }, TOOLTIP_MS);
    live(message.replace(/^[^\w]+/, ''));
  }
  function placeTip() {
    if (!tip || !tipTarget) return;
    const r = tipTarget.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
    tip.style.top = Math.max(8, Math.min(r.top - h - 8, innerHeight - h - 8)) + 'px';
  }
  addEventListener('resize', placeTip, { passive: true });
  document.addEventListener('scroll', placeTip, { passive: true, capture: true });

  // ---------- card status line ("1 of 2 fields filled" / "Ready") ----------
  function status(card) {
    const f = [...card.querySelectorAll('.manual-edit')];
    if (!f.length) { card.dataset.status = 'Click to copy'; card.setAttribute('data-ready', ''); return; }
    const filled = f.filter(x => !isDefault(x)).length;
    if (filled === f.length) { card.dataset.status = 'Ready \u00B7 tap or click to copy'; card.setAttribute('data-ready', ''); }
    else { card.dataset.status = `${filled} of ${f.length} fields filled`; card.removeAttribute('data-ready'); }
  }
  const statusAll = () => document.querySelectorAll('.card-module').forEach(status);

  // ---------- keeping fields in step ----------
  // A header-bound placeholder takes its value from the header input; any other placeholder is shared by every card that uses the same text.
  function syncBound(inputId) {
    const input = document.getElementById(inputId), v = input ? input.value.trim() : '';
    fieldsAll().forEach(f => { if (BIND[f.dataset.defaultText] === inputId && !f.classList.contains('editing')) f.textContent = v || f.dataset.defaultText; });
    statusAll();
  }
  function commit(field, value) {
    const dt = field.dataset.defaultText, bound = BIND[dt];
    if (bound) { const input = document.getElementById(bound); if (input) input.value = value; syncBound(bound); }
    else { fieldsOf(dt).forEach(f => { if (f !== field && !f.classList.contains('editing')) f.textContent = value || dt; }); statusAll(); }
  }

  // ---------- one editable placeholder ----------
  function setupField(el) {
    el.tabIndex = 0; el.setAttribute('role', 'textbox'); el.setAttribute('aria-label', 'Edit ' + el.dataset.defaultText.replace(/^\[|\]$/g, ''));
    const edit = () => {
      if (el.classList.contains('editing') || el.closest('.card-module').classList.contains('copying')) return;
      if (el.textContent === el.dataset.defaultText) el.textContent = '';
      el.classList.add('editing'); el.contentEditable = 'true'; el.focus();
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    el.addEventListener('click', e => { e.stopPropagation(); edit(); });
    el.addEventListener('blur', () => {
      el.classList.remove('editing'); el.contentEditable = 'false';
      const v = el.textContent.replace(/\s+/g, ' ').trim();
      el.textContent = v || el.dataset.defaultText; commit(el, v);
    });
    el.addEventListener('input', () => commit(el, el.textContent.replace(/\s+/g, ' ').trim()));
    el.addEventListener('keydown', e => {
      e.stopPropagation();
      if (!el.classList.contains('editing')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); edit(); } return; }
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); el.blur(); }
    });
    el.addEventListener('paste', e => {                               // plain text only, one line
      e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
      const s = getSelection(); if (!s.rangeCount) return; const r = s.getRangeAt(0); r.deleteContents(); r.insertNode(document.createTextNode(t)); r.collapse(false);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  // ---------- copy ----------
  function textOf(card) {
    const box = card.querySelector('.card-content'); if (!box) return '';
    const copy = box.cloneNode(true);
    if ([...copy.querySelectorAll('.manual-edit')].some(f => !f.textContent.trim() || f.textContent === f.dataset.defaultText)) throw new Error(MSG.empty);
    copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return copy.textContent.replace(/[ \t]+\n/g, '\n').trim();
  }
  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); if (!ok) throw new Error('copy');
  }
  async function copyCard(card) {
    try {
      await writeClipboard(textOf(card));
      showTip(MSG.success, 'success', card);
      card.classList.add('copying'); setTimeout(() => card.classList.remove('copying'), TOOLTIP_MS);
      const t = card.closest('.script-card-sub')?.previousElementSibling?.querySelector('h4')?.textContent.trim();
      window.navanTrack?.('card_copy', { tab: card.closest('.script-module')?.dataset.tab || '', card_name: t || '' });
    } catch (err) {
      showTip(err && err.message === MSG.empty ? MSG.empty : MSG.error, 'error', card);
    }
  }
  function cardClick(card) {
    const first = [...card.querySelectorAll('.manual-edit')].find(isDefault);   // fill the first empty field before copying
    if (first) first.click(); else copyCard(card);
  }

  // ---------- reset ----------
  function resetCard(card) {
    card.querySelectorAll('.manual-edit').forEach(f => {
      const dt = f.dataset.defaultText; if (BIND[dt]) return;          // header-bound values come from the header
      fieldsOf(dt).forEach(x => { x.textContent = dt; });
    });
    statusAll();
  }
  function resetAll() {
    const keepAgent = (document.getElementById('user')?.value || '').trim();
    const cust = document.getElementById('customer'); if (cust) cust.value = '';
    fieldsAll().forEach(f => { const dt = f.dataset.defaultText; f.textContent = BIND[dt] === 'user' && keepAgent ? keepAgent : dt; f.classList.remove('editing'); });
    statusAll();
  }

  // ---------- card setup ----------
  function setupCard(card) {
    if (card.dataset.ready === 'init') return; card.dataset.ready = 'init';
    card.tabIndex = 0; card.setAttribute('role', 'group'); card.setAttribute('aria-label', 'Script card. Press Enter to copy.');
    card.querySelectorAll('.manual-edit').forEach(setupField);
    if (card.querySelector('.manual-edit')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'module-reset-button'; b.setAttribute('aria-label', 'Reset this script\u2019s fields'); b.title = 'Reset fields';
      b.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i>';
      b.addEventListener('click', e => { e.stopPropagation(); resetCard(card); });
      card.appendChild(b);
    }
    card.addEventListener('click', e => {
      if (e.target.closest('.module-reset-button, .manual-edit')) return;
      const sel = getSelection(); if (sel && !sel.isCollapsed && card.contains(sel.anchorNode)) return;   // the agent is selecting text: do not copy
      cardClick(card);
    });
    card.addEventListener('keydown', e => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); cardClick(card); } });
    card.removeAttribute('data-ready'); status(card);
  }

  let headerBound = false;
  window.NavanCards = {
    init(root = document) {
      root.querySelectorAll('.card-module').forEach(setupCard);
      if (!headerBound) {
        headerBound = true;
        new Set(Object.values(BIND)).forEach(id => document.getElementById(id)?.addEventListener('input', () => syncBound(id)));
      }
      new Set(Object.values(BIND)).forEach(syncBound);                // header may already hold text (browser autofill / restore)
    },
    resetAll, syncBound, updateAll: statusAll, copy: copyCard
  };
})();
