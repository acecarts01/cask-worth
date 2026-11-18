// Christmas & New Year sale (15% off everything, until 20 Feb 2027, Pacific).
//   node tools/christmas-promo.mjs apply    adds the sale markup to every page + product schema
//   node tools/christmas-promo.mjs revert   removes all of it again (run on or after 21 Feb 2027)
// Both modes are idempotent. promo.js also hides the decorations in the browser after the end date,
// but the static markup and the product schema need this revert run to go back to list prices.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv[2];
if (!['apply', 'revert'].includes(MODE)) { console.log('usage: apply | revert'); process.exit(1); }
const RATE = 0.15, V = '20261118a', VALID_UNTIL = '2027-02-20', AFTER_VALID = '2027-12-31';
const sale = p => Math.round(p * (1 - RATE) * 100) / 100;
const money = n => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const SKIP = new Set(['node_modules', '.git', 'Reviews Folder', 'admin', 'api', 'functions', 'worker', 'docs', 'content', 'tools', 'feeds', 'backlink-outreach', 'Products to Stock', 'New Keywords Cluster for Cask Worth', 'New CASK WORTH Product images', 'new cask worth images', 'assets']);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p); } })(R);

const STRIP = '<a id="promo-strip" href="/whiskey-sale/" aria-label="Christmas and New Year sale: 15% off every bottle until 20 February"><span class="ps-in"><span class="ps-flake" aria-hidden="true">❄</span><b>Christmas &amp; New Year Sale</b><span class="ps-pct">15% OFF</span><span>every bottle · ends 20 Feb</span><span class="ps-count" aria-hidden="true">Limited time</span><span class="ps-cta">Shop the sale →</span></span></a>\n';
const LINK = `<link rel="stylesheet" href="/assets/css/promo.css?v=${V}">`;
const SCRIPT = `<script src="/assets/js/promo.js?v=${V}" defer></script>`;
let stats = { pages: 0, strip: 0, pdp: 0, ld: 0, css: 0, js: 0 };
for (const f of files) {
  const rel = path.relative(R, f).replace(/\\/g, '/');
  const raw = fs.readFileSync(f, 'utf8'); const crlf = raw.includes('\r\n'); let h = raw.split('\r\n').join('\n'); const before = h;
  if (!/<header[^>]*id="site-header"/.test(h) && !/class="pdp-price"/.test(h)) continue;
  if (MODE === 'apply') {
    { /* the main stylesheet is often loaded through preload + <noscript>: keep promo.css OUTSIDE the <noscript> block */
      const had = h.includes('promo.css'); h = h.replace(/\n?<link rel="stylesheet" href="\/assets\/css\/promo\.css[^>]*>/, '');
      const pre = h.search(/<link rel="preload" href="\/assets\/css\/style\.css[^>]*>/);
      let done = false;
      if (pre >= 0) { const seg = h.slice(pre, pre + 400); const ns = seg.indexOf('<noscript>'), ne = seg.indexOf('</noscript>'); if (ns >= 0 && ne > ns) { const at = pre + ne + '</noscript>'.length; h = h.slice(0, at) + '\n' + LINK + h.slice(at); done = true; } }
      if (!done) { const before2 = h; h = h.replace(/(<link rel="stylesheet" href="\/assets\/css\/style\.css[^>]*>)/, (m) => m + '\n' + LINK); done = h !== before2; }
      if (!done && pre >= 0) { h = h.replace(/(<link rel="preload" href="\/assets\/css\/style\.css[^>]*>)/, (m) => m + '\n' + LINK); }
      if (h.includes('promo.css') && !had) stats.css++; }
    if (!h.includes('promo.js')) { const all = [...h.matchAll(/<script[^>]*src="\/assets\/js\/[^"]*"[^>]*><\/script>/g)]; if (all.length) { const last = all[all.length - 1]; const at = last.index + last[0].length; h = h.slice(0, at) + '\n' + SCRIPT + h.slice(at); stats.js++; } }
    if (!h.includes('id="promo-strip"') && /<header[^>]*id="site-header"/.test(h)) { h = h.replace(/<header[^>]*id="site-header"[^>]*>/, (m) => STRIP + m); stats.strip++; }
    // product page: visible price + schema
    h = h.replace(/<div class="pdp-price">\s*\$([\d,]+(?:\.\d+)?)\s*<\/div>/, (m, p) => { const list = parseFloat(p.replace(/,/g, '')); stats.pdp++; return `<div class="pdp-price"><s class="promo-was" data-was="$${p}">$${p}</s><span class="promo-now">${money(sale(list))}</span><span class="promo-chip">−15%</span></div>\n<div class="pdp-promo-note">🎄 <b>Christmas &amp; New Year offer:</b> you save ${money(list - sale(list))} &middot; ends 20 Feb 2027</div>`; });
    h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
      let o; try { o = JSON.parse(body); } catch { return m; }
      if (o['@type'] !== 'Product' || !o.offers || o.offers.priceSpecification) return m;
      const list = parseFloat(o.offers.price); if (!(list > 0)) return m;
      o.offers.priceSpecification = { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: list.toFixed(2), priceCurrency: 'USD' };
      o.offers.price = sale(list).toFixed(2); o.offers.priceValidUntil = VALID_UNTIL;
      if (o.offers.shippingDetails) o.offers.shippingDetails.shippingRate.value = list > 900 ? 0 : 24.35;
      stats.ld++; return `<script type="application/ld+json">${JSON.stringify(o, null, 2)}</script>`;
    });
  } else {
    h = h.replace(/\n?<link rel="stylesheet" href="\/assets\/css\/promo\.css[^>]*>/, '').replace(/\n?<script src="\/assets\/js\/promo\.js[^>]*><\/script>/, '').replace(/<a id="promo-strip"[\s\S]*?<\/a>\n/, '');
    h = h.replace(/<div class="pdp-price"><s class="promo-was" data-was="([^"]*)">[^<]*<\/s>[\s\S]*?<\/div>\n<div class="pdp-promo-note">[\s\S]*?<\/div>/, (m, was) => `<div class="pdp-price">${was}</div>`);
    h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
      let o; try { o = JSON.parse(body); } catch { return m; }
      if (o['@type'] !== 'Product' || !o.offers || !o.offers.priceSpecification) return m;
      o.offers.price = o.offers.priceSpecification.price; delete o.offers.priceSpecification; o.offers.priceValidUntil = AFTER_VALID;
      stats.ld++; return `<script type="application/ld+json">${JSON.stringify(o, null, 2)}</script>`;
    });
  }
  if (h !== before) { stats.pages++; fs.writeFileSync(f, crlf ? h.split('\n').join('\r\n') : h); }
}
console.log(MODE, stats);
