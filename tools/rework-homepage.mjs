// Rework the homepage keyword layer: primary "whiskey bottles for sale" + 10 Transactional/Commercial secondaries (no category primary taken over).
// Idempotent. usage: node tools/rework-homepage.mjs
import fs from 'fs';
const f = 'index.html'; let h = fs.readFileSync(f, 'utf8'); const eol = h.includes('\r\n') ? '\r\n' : '\n';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PRIMARY = 'whiskey bottles for sale';
const SECONDARY = ['buying whiskey online', 'best place to buy whiskey online', 'buy bourbon whiskey online', 'bourbon whiskey for sale', 'scotch whiskey for sale', 'irish whiskey for sale', 'rare whiskey for sale', 'buy cognac', 'buy rye whiskey', 'whiskey gift set', 'buy whisky online'];
const TITLE = 'Whiskey Bottles for Sale — Buy Whisky Online | Caskworth';
const META = 'Shop whiskey bottles for sale and buy whisky online: bourbon, Scotch, Irish, Japanese and rare. Same-day delivery to 33 US states and 7 Canadian provinces.';
const rep = (rx, to, label) => { if (!rx.test(h)) throw new Error('not found: ' + label); h = h.replace(rx, () => to); };
rep(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)}</title>`, 'title');
rep(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(META)}"`, 'meta description');
for (const p of ['og:title', 'twitter:title']) h = h.replace(new RegExp(`(<meta (?:property|name)="${p}" content=")[^"]*(")`), (m, a, b) => a + esc(TITLE) + b);
for (const p of ['og:description', 'twitter:description']) h = h.replace(new RegExp(`(<meta (?:property|name)="${p}" content=")[^"]*(")`), (m, a, b) => a + esc(META) + b);
rep(/<meta name="keywords" content="[^"]*"/, `<meta name="keywords" content="${esc([PRIMARY, ...SECONDARY].join(', '))}"`, 'keywords');
rep(/<h1 class="hero-h1">[\s\S]*?<\/h1>/, '<h1 class="hero-h1">Whiskey Bottles for Sale,<br><em>Delivered Today.</em></h1>', 'h1');
rep(/<p class="hero-sub">[\s\S]*?<\/p>/, '<p class="hero-sub">Buy whisky online and shop whiskey bottles for sale in every style — Bourbon, Scotch, Japanese, Irish &amp; Rye, hand-picked and ready to pour — with same-day delivery to 33 U.S. states and 7 Canadian provinces. Minimum order $249.99 USD.</p>', 'hero-sub');
rep(/<h2 class="section-title">(?:Our Collections|What Whiskey Can You Buy Online at Caskworth\?)<\/h2>/, '<h2 class="section-title">What Whiskey Can You Buy Online at Caskworth?</h2>', 'collections h2');
const intro = 'Caskworth lists hundreds of authentic whiskey bottles for sale across bourbon, Scotch, Japanese, Irish and rye whiskey, plus cognac and brandy, with same-day delivery to 33 U.S. states and 7 Canadian provinces. Every bottle card shows its price and its cryptocurrency price, so you can compare before you order.';
const links = 'Browse <a href="/shop/bourbon/">bourbon whiskey for sale</a>, <a href="/shop/scotch/">scotch whiskey for sale</a> or <a href="/shop/irish/">irish whiskey for sale</a>, shop <a href="/shop/allocated/">rare whiskey for sale</a>, or <a href="/shop/cognac/">buy cognac</a> and <a href="/shop/rye/">buy rye whiskey</a> from the same cart. A <a href="/shop/gifts/">whiskey gift set</a> ships the same way, and you can buy bourbon whiskey online in a few clicks.';
const pStyle = 'style="max-width:560px;margin:12px auto 0;text-align:center;"';
rep(/(<p data-kw-rekey[^>]*>[\s\S]*?<\/p>\s*)+/,`<p data-kw-rekey ${pStyle}>${intro}</p>${eol}  <p data-kw-rekey ${pStyle}>${links}</p>`, 'collections paragraph');
// FAQ: item carrying the primary and natural secondaries (HTML + FAQPage schema)
const faqQ = 'Where can I buy whiskey bottles for sale online?';
const faqA = 'Caskworth has whiskey bottles for sale online in every style, with same-day delivery to 33 U.S. states and 7 Canadian provinces. If you are comparing the best place to buy whiskey online, buying whiskey online here takes a few clicks: add bottles to your cart, reach the $249.99 minimum and check out. Paying with cryptocurrency saves 10% automatically, and every buyer must be 21 or over.';
h = h.replace(/<div class="faq-item" data-home-kw>[\s\S]*?<\/div><\/div>\s*<\/div>/, '');
const first = h.indexOf('<div class="faq-item">'); if (first < 0) throw new Error('faq not found');
const item = `<div class="faq-item" data-home-kw>${eol}  <button class="faq-q" onclick="toggleFaq(this)"><span>${esc(faqQ)}</span><span class="faq-icon">+</span></button>${eol}  <div class="faq-a"><div class="faq-a-inner">${esc(faqA)}</div></div>${eol}</div>`;
h = h.slice(0, first) + item + h.slice(first);
h = h.replace(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)<\/script>/, (m, j) => {
  const o = JSON.parse(j); o.mainEntity = o.mainEntity.filter(x => x.name !== faqQ); o.mainEntity.unshift({ '@type': 'Question', name: faqQ, acceptedAnswer: { '@type': 'Answer', text: faqA } });
  return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
});
h = h.replace(/"dateModified": "[\d-]+"/g, '"dateModified": "2026-11-24"').replace(/(Last updated: <time datetime=")[\d-]+(">)[^<]*(<\/time>)/, (m, a, b, c) => a + '2026-11-24' + b + 'November 24, 2026' + c);
fs.writeFileSync(f, h);
console.log('homepage reworked');
