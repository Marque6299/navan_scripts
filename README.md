# Navan Scripts V4

Static site (no build step): push the contents of this folder to GitHub and deploy on Cloudflare Pages or Netlify. `_headers` works on both.

## Edit the scripts
All scripts live in `script_entries.json` (unchanged from V3). One object per script entry:
`id` is the category button, `title` / `description` are the left block, `cards` are the copyable texts (`content`, `created`, `updated`).
Inside `content` use plain text, `<br>` for a line break and `[Placeholder]` for fields. Nothing else is rendered as markup.
`[Customer Name]`, `[Customer’s Name]` and `[Agent Name]` fill from the header boxes; any other placeholder is filled by clicking it, and is shared by every card that uses the same text.
Cards created or updated in the last 7 days get a New / Updated tag and a dot on their category button.

## Settings (`config.js`)
- `tabs.groups`: colour families (display only). A tab id that is not listed lands in "More" (purple).
- `tabs.rail`: rows shown (2), order (`group` or `data`), hover-open on/off.
- `ads`: AdSense account, ad units, in-feed spacing (every 2-3 cards), caps and request limits.
- `updates`: the 10-minute version check.
- `placeholders`: which header box fills which placeholder.

## What changed from V3
- **Tab rail**: 20 ungrouped chips, 20px tall, coloured by family (Conversation blue, Rapport green, Bookings & Travel amber, Escalation & Risk red), two rows; extra rows open downward over the page on hover or the +N button; the current tab always stays visible.
- **Ads (Google AdSense, ca-pub-6978764838614552)**: a new in-feed unit after every 2-3 cards each time a different category is opened, one unit after the last card, all labelled "Advertisement", zero height until filled, lazy, rate-limited, hidden while searching, never inside a card and never requested before scripts are on screen. Units reused from your ACES config: `end` 7813895425 and `banner` 5267623137 (used for the feed). Create units dedicated to this site if you want separate reporting.
- **Auto-update**: every 10 minutes the page compares its files (and `script_entries.json`) with what it loaded; only if something changed does it save names, placeholders, search, category and scroll, reload when you pause typing, and restore everything.
- **Theme**: the saved theme is applied before first paint; Auto / Light / Dark plus the four colour themes (palettes unchanged); a header button opens an accessible panel; follows the device live; syncs across tabs; text on every coloured surface is chosen by contrast (all text passes WCAG AA in all 8 combinations).
- **Layout (V4.1)**: the page itself scrolls (no inner scroll box), so wheel, touch, PageUp/PageDown/Home/End and "Back to top" work natively. The header and category rail are sticky at the top; a one-to-two line, full-width About strip and the footer are fixed at the bottom, so they are always visible. On windows shorter than 520px (phones in landscape) the header scrolls away and the About strip hides to give the scripts the space. Picking a category returns to the top of its list.
- **Cards**: whole card copies on click / tap / Enter; the first empty placeholder opens before copying; selecting text no longer triggers a copy; copied text no longer contains `&amp;`; card text is escaped (no HTML injection from the JSON); `[Customer’s Name]` now follows the Customer box.
- **Footer and pages**: fixed footer with Privacy Policy, Terms & Conditions, Cookie Policy, Disclaimer, About, Help, Contact and Privacy choices; all pages carry the Google tag; `ads.txt`, `robots.txt`, `sitemap.xml`, canonical and Open Graph tags are included.
- **Google tag** `G-EEHXSE9PG0` is in the `<head>` of every page exactly as given. `analytics.js` adds a few non-personal events (tab opened, script copied by title, search result count, theme change); names, search text and script text are never sent.

## Before AdSense review
1. Buy a custom domain (AdSense does not approve free `*.pages.dev` / `*.netlify.app` subdomains), then run `node tools/set-domain.mjs https://your-domain.com`.
2. Add the domain under AdSense > Sites; keep `ads.txt` at the site root.
3. In AdSense > Privacy & messaging, publish the EEA/UK/CH consent message (the footer "Privacy choices" link reopens it).
   In AdSense > Ads > By site, turn **Auto ads off** for this site (or at least Anchor, Vignette and Side-rail formats): this page places its own units, and an Auto-ads anchor would sit on top of the always-visible footer.
4. The scripts mention Navan and other travel brands. The pages state the site is independent and unaffiliated; make sure you have the right to publish that wording.
5. Replace the contact email if needed (`contact.html`, privacy policy, terms).

## Known data notes (not changed)
`script_entries.json`: one Opening card ends "...to help yo" (cut off); three other cards end without punctuation (Opening, Assurance, Power Words/Phrases). The tab id `Emphathy` is shown as "Empathy" through `tabs.labels`.

## Tools
`tools/set-domain.mjs`: swaps the site address everywhere after a domain change.
