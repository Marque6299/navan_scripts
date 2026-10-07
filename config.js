// Navan Scripts: site switches. Everything you are likely to change lives here.
window.NAVAN_CONFIG = {
  site: {
    name: 'Navan Scripts',
    url: 'https://webtoolscript.pages.dev',                       // run `node tools/set-domain.mjs https://your-domain` after buying a domain
    dataFile: 'script_entries.json',                              // the file you edit on GitHub to change scripts
    dataFallbackUrl: 'https://webtoolscript.pages.dev/script_entries.json'   // used only if the local file cannot be loaded (e.g. opened from disk)
  },

  // Header fields -> the [placeholders] they fill in every card. Typing a value into a card fills the header field too.
  placeholders: {
    '[Customer Name]': 'customer',
    '[Customer\u2019s Name]': 'customer',
    '[Agent Name]': 'user'
  },
  newBadgeDays: 7,                                                // cards created / updated within this many days get a New / Updated tag

  // Display-only tab grouping (colour = group). Tab ids come from script_entries.json and are never changed here.
  // A tab that is not listed lands in "More", so a brand-new tab never disappears.
  tabs: {
    groups: [
      { key: 'flow',    label: 'Conversation',      ids: ['Opening', 'Paraphrasing', 'Hold Procedure', 'Closing', 'Abandoned Chat'] },
      { key: 'rapport', label: 'Rapport',           ids: ['Acknowledgement', 'Emphathy', 'Assurance', 'Power Words'] },
      { key: 'travel',  label: 'Bookings & Travel', ids: ['Airline Calling', 'App Issues', 'Baggage', 'Booking Related', 'Exchanges', 'Refunds', 'Hotel'] },
      { key: 'risk',    label: 'Escalation & Risk', ids: ['Complaint', 'High Critical', 'Possible Fraud', 'Escalation'] }
    ],
    other: { key: 'more', label: 'More' },
    labels: { Emphathy: 'Empathy' },                              // display-only fixes for ids you do not want to rename in the JSON
    // Tab rail: `rows` rows are always visible; further rows open downward on hover (mouse), on the +N button (touch / keyboard)
    // and fold back after a pick. order: 'group' keeps each colour together, 'data' = file order.
    rail: { rows: 2, order: 'group', hoverOpen: true, openDelayMs: 140, closeDelayMs: 300 }
  },

  ads: {
    enabled: true,
    client: 'ca-pub-6978764838614552',
    // Ad units from your AdSense account (AdSense > Ads > By ad unit). An empty ID keeps that placement off.
    //   feed : in-feed units between script cards (falls back to `banner`).   end : one unit after the last card.
    slots: { end: '7813895425', banner: '5267623137', feed: '' },

    // In-feed ads between script cards. Every click on a DIFFERENT category starts a fresh view: the old units are removed and
    // new ones are planned (one after every 2-3 cards). Requests stay lazy and rate-limited so rapid tab flipping cannot spam AdSense.
    feed: {
      enabled: true,
      everyCards: [2, 3],        // one ad after every 2 or 3 cards (re-rolled after each ad)
      minContentPx: 240,         // an ad waits until at least this much script content sits above it, so very short cards stretch the gap a little (0 = strict 2-3 cards)
      minContentPxMobile: 400,   // same rule on screens up to 768px wide: phone cards are taller and ads fill the whole width, so the gap stretches to about 3-4 cards
      maxPerView: 12,            // hard cap per category view (0 = no cap)
      dwellMs: 1200,             // request only after the agent stayed on the category this long
      maxRequestsPerMin: 10,     // sliding-window guard on ALL ad requests from this tab
      initialView: true          // also fill the first category shown on page load
    }
  },

  // Version check + safe refresh. Every `checkEveryMin` minutes the app compares the live files with the ones it loaded.
  // If something changed it saves every input (sessionStorage, this tab only), waits for a quiet moment, reloads and puts everything back.
  updates: {
    enabled: true,
    checkEveryMin: 10,
    quietMs: 4000,               // reload only after this long without typing/clicking...
    maxWaitMs: 60000,            // ...but never wait longer than this once a new version is found (inputs are restored anyway)
    reloadEvenIfUnchanged: false // true = literal reload every 10 min. Not recommended with AdSense (automatic reloads = extra page views / ad requests)
  }
};
