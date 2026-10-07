(() => {
  'use strict';
  // Sends a few NON-personal usage events to Google Analytics 4 (the gtag.js tag itself sits in index.html's <head>).
  // Never sent: customer or agent names, search text, script text. Honours Do Not Track. Ad events stay local.
  window.dataLayer = window.dataLayer || [];
  const gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const SAFE = /^[A-Za-z0-9 _&./()'\u2019-]{0,100}$/;                 // only short, plain labels (tab names, card titles) pass
  window.navanTrack = (name, props = {}) => {
    if (navigator.doNotTrack === '1' || window.NAVAN_TRACK_OFF || window.NAVAN_RESTORING || /^ads_/.test(name)) return;
    const params = {};
    Object.keys(props).forEach(k => { const v = props[k]; if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && SAFE.test(v))) params[k] = v; });
    gtag('event', name.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40), params);
  };
})();
