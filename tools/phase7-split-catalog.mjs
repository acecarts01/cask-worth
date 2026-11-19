// Phase 7: split the 690-product catalogue out of assets/js/app.source.js into assets/js/catalog.source.js.
// app.js keeps only the cart/UI logic and loads catalog.js on demand (addToCart / quick view); the home, shop and search pages load it up front.
// Rebuild minified files with: npx terser assets/js/app.source.js --compress --mangle -o assets/js/app.js  (same for catalog)
import fs from 'fs';
const dir = 'assets/js/';
const src = fs.readFileSync(dir + 'app.source.js', 'utf8');
if (src.includes('function loadCatalog')) { console.log('already split'); process.exit(0); }
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const lines = src.split(/\r?\n/);
const start = lines.findIndex(l => l.startsWith('const PRODUCTS = ['));
const end = lines.findIndex((l, i) => i > start && l === '];');
if (start < 0 || end < 0) throw new Error('PRODUCTS block not found');
const data = lines.slice(start, end + 1);
fs.writeFileSync(dir + 'catalog.source.js', ['/* CASKWORTH - product catalogue (split from app.js). Loaded on demand by loadCatalog() in app.js, or up front on the home, shop and search pages. */', ...data, ''].join(eol));
const loader = [
  "var CATALOG_V = '20261119a';",
  'var _catalogCbs = null;',
  '// loads the product catalogue on demand (cart add / quick view on pages that do not ship it up front)',
  'function loadCatalog(cb){',
  "  if(typeof PRODUCTS!=='undefined'){if(cb)cb();return;}",
  '  if(cb)(_catalogCbs=_catalogCbs||[]).push(cb);',
  "  if(document.getElementById('cw-catalog'))return;",
  "  var s=document.createElement('script');s.id='cw-catalog';s.src='/assets/js/catalog.js?v='+CATALOG_V;",
  '  s.onload=function(){var q=_catalogCbs||[];_catalogCbs=null;q.forEach(function(f){f();});};',
  "  s.onerror=function(){var el=document.getElementById('cw-catalog');if(el)el.remove();_catalogCbs=null;showToast('Could not load product data. Please check your connection and try again.');};",
  '  document.head.appendChild(s);',
  '}',
];
let out = [...lines.slice(0, start), ...loader, ...lines.slice(end + 1)].join(eol);
const rep = (a, b) => { a = a.replace(/\n/g, eol); b = b.replace(/\n/g, eol); if (!out.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); out = out.replace(a, () => b); };
{ const rx = /(\[\]\.concat\(\s*)PRODUCTS,/; if (!rx.test(out)) throw new Error('missing _findProduct concat'); out = out.replace(rx, (m, a) => a + "(typeof PRODUCTS!=='undefined'?PRODUCTS:[]),"); }
rep('function addToCart(id,qty){\n  qty=qty||1;', "function addToCart(id,qty){\n  if(typeof PRODUCTS==='undefined'){loadCatalog(function(){addToCart(id,qty);});return;}\n  qty=qty||1;");
rep('function openQV(id){\n  const p=_findProduct(id);', "function openQV(id){\n  if(typeof PRODUCTS==='undefined'){loadCatalog(function(){openQV(id);});return;}\n  const p=_findProduct(id);");
fs.writeFileSync(dir + 'app.source.js', out);
console.log('split: catalogue lines', data.length, '-> catalog.source.js; app.source.js now', out.length, 'bytes');
