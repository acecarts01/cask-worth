// Phase 7: wire catalog.js into pages. Home, shop and search render grids from PRODUCTS, so they load it up front (before app.js).
// Every other page prefetches it at idle priority and app.js loads it on first add-to-cart / quick view. Idempotent.
import fs from 'fs';
import { execSync } from 'child_process';
const V = '20261119a';
const EAGER = new Set(['index.html', 'shop/index.html', 'search/index.html']);
const files = execSync('git ls-files "*.html"', { maxBuffer: 1 << 26 }).toString().split('\n').filter(f => f && !/^(Reviews Folder|Products to Stock|New |new |backlink|node_modules)/.test(f));
let eager = 0, lazy = 0, bumped = 0, skipped = 0;
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8'); const o = h;
  if (!/\/assets\/js\/app\.js/.test(h)) { skipped++; continue; }
  h = h.replace(/\/assets\/js\/app\.js\?v=[\w]+/g, () => { bumped++; return `/assets/js/app.js?v=${V}`; });
  h = h.replace(/<link rel="prefetch" href="\/assets\/js\/catalog\.js[^>]*>\s*/g, '').replace(/<script src="\/assets\/js\/catalog\.js[^>]*><\/script>\s*/g, '');
  const eol = h.includes('\r\n') ? '\r\n' : '\n';
  if (EAGER.has(f)) {
    h = h.replace(/(<script src="\/assets\/js\/app\.js)/, (m, a) => { eager++; return `<script src="/assets/js/catalog.js?v=${V}" defer></script>${eol}${a}`; });
  } else {
    h = h.replace(/<\/head>/, () => { lazy++; return `<link rel="prefetch" href="/assets/js/catalog.js?v=${V}" as="script">${eol}</head>`; });
  }
  if (h !== o) fs.writeFileSync(f, h);
}
console.log({ files: files.length, skipped, bumped, eager, lazy });
