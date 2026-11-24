// Keep the WebPage JSON-LD "name" identical to the page <title> (rule 22: schema must match visible content). Idempotent.
// usage: node tools/sync-webpage-schema.mjs [--dry]
import fs from 'fs';
import { execSync } from 'child_process';
const DRY = process.argv.includes('--dry');
const files = execSync('git ls-files "*.html"', { maxBuffer: 1 << 26 }).toString().split('\n').filter(f => f && !/^(Reviews Folder|Products to Stock|New |new |backlink|node_modules)/.test(f));
const dec = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const rx = /("@type":\s*"WebPage",\s*"@id":\s*"[^"]*",\s*"url":\s*"[^"]*",\s*"name":\s*)"((?:[^"\\]|\\.)*)"/;
let changed = 0, same = 0, none = 0;
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1]; const m = h.match(rx);
  if (!t || !m) { none++; continue; }
  const name = dec(t);
  let cur; try { cur = JSON.parse('"' + m[2] + '"'); } catch { cur = m[2]; }
  if (cur === name) { same++; continue; }
  h = h.replace(rx, (all, a) => a + JSON.stringify(name));
  for (const b of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(b[1]);
  if (!DRY) fs.writeFileSync(f, h);
  changed++;
}
console.log({ changed, same, none });
