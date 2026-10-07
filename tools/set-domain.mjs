// Usage: node tools/set-domain.mjs https://your-domain.com
// Replaces the site address in the canonical / Open Graph tags, sitemap.xml, robots.txt and config.js after you buy a custom domain.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(arg)) { console.error('Give the new address, e.g.  node tools/set-domain.mjs https://navanscripts.com'); process.exit(1); }

const config = readFileSync(join(root, 'config.js'), 'utf8');
const old = (config.match(/url:\s*'(https:\/\/[^']+)'/) || [])[1];
if (!old) { console.error('Could not find site.url in config.js'); process.exit(1); }
if (old === arg) { console.log('Already set to ' + arg); process.exit(0); }

const files = readdirSync(root).filter(f => /\.(html|xml|txt|js)$/.test(f) && f !== 'script_entries.json');
let changed = 0;
for (const f of files) {
  const p = join(root, f), text = readFileSync(p, 'utf8');
  if (!text.includes(old)) continue;
  writeFileSync(p, text.split(old).join(arg)); changed++; console.log('updated ' + f);
}
console.log(`\n${old} -> ${arg} in ${changed} file(s).\nAlso: add the new domain in AdSense (Sites) and in your Google Analytics data stream, and keep ads.txt at the site root.`);
