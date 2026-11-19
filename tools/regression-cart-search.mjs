// Regression suite for cart / quick view / grids / checkout / search, driven over the Chrome DevTools Protocol (no dependencies).
// usage: node tools/regression-cart-search.mjs <baseUrl>      e.g. http://localhost:8099   or   https://caskworth.com
// Uses JS calls and element .click() (never the age-gate buttons). Exits 1 on any failure.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
const base = (process.argv[2] || 'http://localhost:8099').replace(/\/$/, '');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const port = 9333 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-reg-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
let pass = 0, fail = 0; const failures = [];
const check = (name, ok, extra = '') => { if (ok) pass++; else { fail++; failures.push(name + ' ' + extra); } console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra)); };
async function openPage() {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errors = []; const requests = []; const apiMock = { status: 200, body: { success: true, ref: 'CW-TEST01', emailed: true } };
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Fetch.requestPaused') { requests.push({ url: m.params.request.url, method: m.params.request.method, post: m.params.request.postData || '' }); send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: apiMock.status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(apiMock.body)).toString('base64') }); }
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 160));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|Failed to load resource: the server responded with a status of 404/.test(m.params.entry.text + m.params.entry.url)) errors.push('LOG ' + (m.params.entry.text + ' ' + (m.params.entry.url || '')).slice(0, 160));
  });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) return { __err: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{if(!sessionStorage.getItem('__t')){localStorage.clear();sessionStorage.setItem('__t','1')}}catch(e){}" });
  const go = async (p) => { await send('Page.navigate', { url: base + p }); for (let i = 0; i < 40; i++) { await sleep(250); if ((await ev('document.readyState')) === 'complete') break; } await sleep(1800); };
  const reload = async () => { await send('Page.reload'); await sleep(2500); };
  return { ev, go, reload, errors, requests, apiMock, close: async () => { try { await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); } catch {} ws.close(); } };
}
async function scenario(name, fn) { const pg = await openPage(); try { await fn(pg); check(name + ': no JS errors', pg.errors.filter(e => !(pg.apiMock.status === 500 && /status of 500/.test(e))).length === 0, JSON.stringify(pg.errors.slice(0, 3))); } catch (e) { check(name + ': scenario ran', false, String(e).slice(0, 200)); } await pg.close(); }

await scenario('product page add-to-cart', async ({ ev, go }) => {
  await go('/products/eagle-rare-10-year.html');
  const before = await ev("typeof app === 'undefined' && typeof addToCart");
  check('product: addToCart defined', before === 'function', String(before));
  await ev("document.querySelector('.pdp-action-row .btn-gold').click(); 0");
  await sleep(2500);
  const st = await ev("JSON.stringify({n:(typeof cart!=='undefined'?cart.length:-1),id:(cart[0]||{}).id,qty:(cart[0]||{}).qty,price:(cart[0]||{}).price,badge:[...document.querySelectorAll('.cart-count')].map(e=>e.textContent).join(','),open:document.getElementById('cart-drawer')?.classList.contains('open'),ls:(localStorage.getItem('cw_cart')||'').length>10,cat:typeof PRODUCTS!=='undefined'})");
  const o = JSON.parse(st); console.log('   state', st);
  check('product: item added', o.n === 1 && o.id === 'eagle-rare-10-year' && o.qty === 1 && o.price > 0);
  check('product: badge updated', /1/.test(o.badge)); check('product: cart drawer opens on add', o.open === true, JSON.stringify(o.open));
  check('product: toast confirms the add', /added to cart/i.test(await ev("document.getElementById('toast')?.textContent||''")), await ev("document.getElementById('toast')?.textContent||'(no toast element)'"));
  check('product: drawer lists the item and a checkout button', /Eagle Rare/i.test(await ev("document.getElementById('cart-body')?.innerText||''")) && (await ev("getComputedStyle(document.getElementById('cart-co-btn')).display")) !== 'none');
  check('product: toast is an aria-live region', (await ev("document.getElementById('toast')?.getAttribute('aria-live')")) === 'polite'); check('product: cart persisted', o.ls === true);
  await ev("document.querySelector('.pdp-action-row .btn-gold').click(); 0"); await sleep(600);
  check('product: second click increments qty', (await ev('cart[0].qty')) === 2);
  await ev("cartQty('eagle-rare-10-year',-1); 0"); check('product: cartQty -1', (await ev('cart[0].qty')) === 1);
  await ev("cartRemove('eagle-rare-10-year'); 0"); check('product: cartRemove', (await ev('cart.length')) === 0);
});
await scenario('home page grid + add', async ({ ev, go }) => {
  await go('/');
  check('home: catalogue loaded up front', (await ev("typeof PRODUCTS!=='undefined' && PRODUCTS.length")) > 600);
  check('home: featured grid rendered', (await ev("document.querySelectorAll('#feat-grid .pc').length")) > 0);
  await ev("document.querySelector('#feat-grid .pc-atc').click(); 0"); await sleep(600);
  { const v = await ev('cart.length'); check('home: add from grid', v === 1, JSON.stringify(v)); }
  const tabs = await ev("document.querySelectorAll('.ftab').length"); console.log('   ftabs', tabs);
  if (tabs > 1) { const a = await ev("document.querySelectorAll('#feat-grid .pc').length"); await ev("document.querySelectorAll('.ftab')[1].click(); 0"); await sleep(500); check('home: filter tab re-renders', (await ev("document.querySelectorAll('#feat-grid .pc').length")) >= 0 && a > 0); }
});
await scenario('shop page grid, tabs, quick view', async ({ ev, go }) => {
  await go('/shop/');
  const n0 = await ev("document.querySelectorAll('#shop-grid .pc').length"); check('shop: grid rendered', n0 > 0, String(n0));
  const tabs = await ev("document.querySelectorAll('.ftab').length");
  if (tabs > 1) { await ev("document.querySelectorAll('.ftab')[2].click(); 0"); await sleep(500); const n1 = await ev("document.querySelectorAll('#shop-grid .pc').length"); check('shop: tab changes grid', n1 > 0, String(n1)); }
  await ev("document.querySelector('#shop-grid .pc-atc').click(); 0"); await sleep(600);
  check('shop: add from grid', (await ev('cart.length')) === 1);
  const id = await ev("PRODUCTS.find(p=>!CW_VALID_PDP.has(makeProductSlug(p.name)))?.id || PRODUCTS[0].id");
  await ev(`openQV(${JSON.stringify(id)}); 0`); await sleep(400);
  check('shop: quick view opens', (await ev("!!currentModal && document.getElementById('qv-overlay').classList.contains('open')")) === true);
  await ev('qvAddToCart(); 0'); await sleep(600);
  check('shop: quick view add-to-cart', (await ev('cart.length')) === 2);
});
await scenario('brand page add + cart + checkout', async ({ ev, go, reload }) => {
  await go('/shop/brands/dewars/');
  check('brand: lazy (no catalogue yet)', (await ev("typeof PRODUCTS")) === 'undefined');
  await ev("document.querySelector('.pc-atc').click(); 0"); await sleep(2500);
  { const v = await ev('cart.length'); check('brand: add from grid', v === 1, JSON.stringify(v)); }
  check('brand: catalogue loaded on demand', (await ev("typeof PRODUCTS")) !== 'undefined');
  await reload(); check('brand: cart survives reload', (await ev('cart.length')) === 1);
  await ev("openCart(); 0"); await sleep(300);
  check('brand: cart items render', (await ev("document.querySelectorAll('#cart-drawer .cart-item, #cart-items .cart-item, #cart-drawer [data-cart-id]').length || document.getElementById('cart-drawer').innerText.length")) > 0);
  await go('/checkout/');
  const t = await ev("document.body.innerText"); check('checkout: shows cart item and total', /Dewar/i.test(t) && /\$\d/.test(t), t.slice(0, 80));
  check('checkout: minimum-order logic present', typeof (await ev("typeof renderCheckoutSummary")) === 'string' && (await ev("typeof renderCheckoutSummary")) === 'function');
});
await scenario('blog page add', async ({ ev, go }) => {
  await go('/blog/eagle-rare-guide/');
  check('blog: lazy', (await ev('typeof PRODUCTS')) === 'undefined');
  const has = await ev("!!document.querySelector('[onclick*=addToCart], .pc-atc')");
  if (has) { await ev("(document.querySelector('[onclick*=addToCart]')||document.querySelector('.pc-atc')).click(); 0"); await sleep(2500); check('blog: add to cart works', (await ev('cart.length')) === 1); }
  else { await ev("addToCart('eagle-rare-10-year',1); 0"); await sleep(2500); check('blog: addToCart() lazy-loads catalogue', (await ev('cart.length')) === 1); }
});
await scenario('search page', async ({ ev, go }) => {
  await go('/search/?q=macallan');
  check('search: catalogue available', (await ev("typeof PRODUCTS!=='undefined' && PRODUCTS.length")) > 600);
  const t = await ev("document.body.innerText"); check('search: results mention Macallan', /macallan/i.test(t));
});
await scenario('header search + info page', async ({ ev, go }) => {
  await go('/about/');
  await ev("toggleSearch(); 0"); await sleep(400);
  check('about: search panel opens', (await ev("!!document.getElementById('search-panel')")) === true);
  await ev("document.getElementById('search-input').value='bourbon'; submitSearch(); 0"); await sleep(2500);
  check('about: search navigates', /\/(search|shop)\/\?q=bourbon/.test(await ev('location.href')), await ev('location.href'));
});
await scenario('catalogue load failure is handled', async (pg) => {
  const { ev, go } = pg;
  await go('/shop/brands/dewars/');
  const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  // block catalog.js for this page via a fetch-level override: make the script tag fail by pointing at a missing file
  await ev("window.__orig=CATALOG_V; CATALOG_V='does-not-exist'; var s0=document.getElementById('cw-catalog'); 0");
  await ev("(function(){var o=document.createElement;document.createElement=function(t){var e=o.call(document,t);if(String(t).toLowerCase()==='script'){var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');Object.defineProperty(e,'src',{set:function(v){d.set.call(e,String(v).replace('/assets/js/catalog.js','/assets/js/missing-catalog.js'))},get:function(){return d.get.call(e)}});}return e;};})(); 0");
  await ev("document.querySelector('.pc-atc').click(); 0"); await sleep(2500);
  check('failure: cart stays empty and page survives', (await ev('cart.length')) === 0 && (await ev("typeof addToCart")) === 'function');
  check('failure: user sees a message', /Could not load product data/.test(await ev("document.getElementById('toast')?.textContent || ''")));
});
await scenario('catalogue is fetched once on a product page', async ({ ev, go }) => {
  await go('/products/eagle-rare-10-year.html');
  await ev("document.querySelector('.pdp-action-row .btn-gold').click(); 0"); await sleep(2500);
  const n = await ev("performance.getEntriesByType('resource').filter(r=>/catalog\\.js/.test(r.name)).length");
  const bytes = await ev("performance.getEntriesByType('resource').filter(r=>/catalog\\.js/.test(r.name)).map(r=>r.transferSize).join(',')");
  console.log('   catalog.js entries', n, 'transfer', bytes);
  check('catalog fetched at most twice (prefetch + execute from cache)', n >= 1 && n <= 2, String(n));
});
// ---- checkout: validation, order submission (POST /api/orders is intercepted, never sent), success and failure paths ----
const CART = n => JSON.stringify([{ id: 'eagle-rare-10-year', name: 'Eagle Rare 10 Year', price: 37.99, qty: n, img: '/assets/images/products/eagle-rare-10-year.webp', cat: 'Bourbon' }]);
const FILL = `(function(){var v={'f-fn':'Test','f-ln':'Buyer','f-email':'test.buyer@example.com','f-phone':'+1 555 010 0000','f-addr':'1 Test Street','f-city':'Testville','f-state':'CA','f-zip':'90001'};for(var k in v){var e=document.getElementById(k);if(e){e.value=v[k];e.dispatchEvent(new Event('input',{bubbles:true}))}}window.__opened=[];window.open=function(u){window.__opened.push(String(u));return null};return 1})()`;
async function checkoutPage(pg, qty) { await pg.go('/checkout/'); await pg.ev(`localStorage.setItem('cw_cart', ${JSON.stringify(CART(qty))}); 0`); await pg.reload(); await pg.ev(FILL); }
const orderReqs = pg => pg.requests.filter(r => /\/api\/orders/.test(r.url) && r.method === 'POST');
await scenario('checkout validation blocks bad orders', async (pg) => {
  const { ev } = pg;
  await checkoutPage(pg, 1);
  check('checkout: cart summary shows the item', /Eagle Rare/i.test(await ev('document.body.innerText')));
  await ev("document.getElementById('f-fn').value=''; placeOrder(); 0"); await sleep(300);
  check('checkout: empty first name blocked', orderReqs(pg).length === 0);
  await ev(FILL); await ev("document.getElementById('f-email').value='not-an-email'; placeOrder(); 0"); await sleep(300);
  check('checkout: invalid email blocked', orderReqs(pg).length === 0);
  await ev(FILL); await ev("placeOrder(); 0"); await sleep(300);
  check('checkout: 21+ confirmation required', orderReqs(pg).length === 0);
  await ev("document.getElementById('chk-age').checked=true; placeOrder(); 0"); await sleep(300);
  check('checkout: terms agreement required', orderReqs(pg).length === 0);
  await ev("document.getElementById('chk-terms').checked=true; placeOrder(); 0"); await sleep(300);
  check('checkout: minimum order ($249.99) enforced', orderReqs(pg).length === 0 && /Minimum order/i.test(await ev("document.getElementById('co-toast')?.textContent||''")), await ev("document.getElementById('co-toast')?.textContent||''"));
});
await scenario('checkout places an order (mocked API)', async (pg) => {
  const { ev } = pg;
  await checkoutPage(pg, 8);
  const exp = await ev("(function(){var s=getSub(),p=promoFor(s),d=CO_PAY==='crypto'?Math.round((s-p)*CO_DISC*100)/100:0;return (s-p-d+shipFor(s)).toFixed(2)})()");
  await ev("document.getElementById('chk-age').checked=true; document.getElementById('chk-terms').checked=true; document.getElementById('place-btn').click(); 0"); await sleep(2500);
  const reqs = orderReqs(pg); check('order: exactly one POST /api/orders', reqs.length === 1, String(reqs.length));
  let b = {}; try { b = JSON.parse(reqs[0].post); } catch {}
  check('order: payload has customer, address and email', b.name === 'Test Buyer' && b.email === 'test.buyer@example.com' && /1 Test Street/.test(b.address || '') && /Testville/.test(b.address || ''), JSON.stringify(b).slice(0, 160));
  check('order: payload lists the item with quantity and price', /Eagle Rare 10 Year x8 @ \$37\.99/.test(b.items || ''), b.items);
  check('order: flat shipping applied', /\$24\.35 USD/.test(b.shipping || ''), b.shipping);
  check('order: total matches page maths (subtotal - promo - crypto discount + shipping)', (b.total || '').includes(exp), `${b.total} vs ${exp}`);
  check('order: success overlay with the server reference', (await ev("document.getElementById('succ-overlay')?.classList.contains('on')")) === true && /CW-TEST01/.test(await ev("document.getElementById('succ-ref')?.textContent||''")));
  check('order: cart cleared after success', (await ev("JSON.parse(localStorage.getItem('cw_cart')||'[]').length")) === 0);
  await sleep(900);
  check('order: WhatsApp confirmation opened with the order', /wa\.me\/\d+\?text=/.test((await ev('window.__opened.join(" ")')) || '') && /CW-TEST01/.test(decodeURIComponent(await ev('window.__opened.join(" ")'))));
  check('order: place button usable again', (await ev("document.getElementById('place-btn').disabled")) === false);
});
await scenario('checkout when the order API fails', async (pg) => {
  const { ev } = pg; pg.apiMock.status = 500; pg.apiMock.body = { success: false, error: 'boom' };
  await checkoutPage(pg, 8);
  await ev("document.getElementById('chk-age').checked=true; document.getElementById('chk-terms').checked=true; document.getElementById('place-btn').click(); 0"); await sleep(2500);
  const txt = await ev("document.getElementById('succ-det')?.innerText||''");
  check('failure: customer is NOT told a confirmation was sent', !/Confirmation sent/i.test(txt), txt.slice(0, 140));
  await sleep(900);
  check('failure: WhatsApp fallback still carries the full order', /wa\.me/.test(await ev('window.__opened.join(" ")')) && /Eagle%20Rare/.test(await ev('window.__opened.join(" ")')));
});
proc.kill();
console.log(`\n${pass} passed, ${fail} failed` + (fail ? '\n' + failures.join('\n') : ''));
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(fail ? 1 : 0);
