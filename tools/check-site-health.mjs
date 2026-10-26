// Pre-push guard for the problems Search Console keeps reporting. Run: node tools/check-site-health.mjs
// Fails (exit 1) on: sitemap URLs that are missing or redirected, internal links to .html or redirected URLs,
// product canonicals that are not self-referencing, invalid JSON-LD, and redirect-file problems.
import fs from 'fs';
const root = '.';
const read = f => fs.readFileSync(f, 'utf8');
let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };

// redirect sources
const redirects = new Map();
for (const l of read('_redirects').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const [src, dst] = t.split(/\s+/); if (redirects.has(src)) fail(`duplicate redirect source ${src}`); redirects.set(src, dst);
  if (src === dst) fail(`self redirect ${src}`);
}
console.log('redirect rules:', redirects.size, '(limit 2000)'); if (redirects.size > 2000) fail('too many redirect rules');

// pages that exist
const exists = u => { const p = u.replace(/^https:\/\/caskworth\.com/, '').split(/[?#]/)[0]; if (p === '/' ) return true; const c = p.replace(/\/$/, ''); return fs.existsSync(`${root}${c}.html`) || fs.existsSync(`${root}${c}/index.html`); };

// sitemap
const sm = read('sitemap.xml'); const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const seen = new Set();
for (const u of locs) {
  if (seen.has(u)) fail(`duplicate sitemap url ${u}`); seen.add(u);
  const p = u.replace('https://caskworth.com', '');
  if (!exists(u)) fail(`sitemap url has no page: ${u}`);
  if (redirects.has(p) || redirects.has(p.replace(/\/$/, ''))) fail(`sitemap url is a redirect source: ${u}`);
  if (/\.html($|\?)/.test(u) || /[?]/.test(u)) fail(`sitemap url has .html or query: ${u}`);
}
console.log('sitemap urls:', locs.length);

// product pages: canonical, json-ld, internal links
const prods = fs.readdirSync('products').filter(f => f.endsWith('.html'));
for (const f of prods) {
  const h = read('products/' + f); const slug = f.slice(0, -5);
  const c = (h.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  if (c !== `https://caskworth.com/products/${slug}`) fail(`canonical mismatch ${slug}: ${c}`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(`invalid JSON-LD ${slug}`); } }
}
// internal links in html: no .html product links, no links to redirect sources
let bad = 0;
const scan = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
  if (['node_modules', '.git', 'Reviews Folder', 'Products to Stock', 'docs', 'content', 'tools'].includes(e.name)) continue;
  const p = `${dir}/${e.name}`;
  if (e.isDirectory()) scan(p);
  else if (e.name.endsWith('.html')) {
    const h = read(p);
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const u = m[1];
      if (/^\/products\/.+\.html$/.test(u)) { bad++; if (bad < 15) console.log('FAIL .html link', p, u); }
      else if (redirects.has(u) || redirects.has(u.replace(/\/$/, ''))) { bad++; if (bad < 15) console.log('FAIL link to redirect', p, u); }
    }
  } } };
scan('.'); if (bad) { fails += bad; console.log('bad internal links:', bad); }
console.log(fails ? `\n${fails} problem(s)` : '\nAll health checks passed'); process.exit(fails ? 1 : 0);
