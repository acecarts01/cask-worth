// Builds /whiskey-sale/ (Christmas & New Year sale landing page) from the About page shell.
// Run after tools/christmas-promo.mjs apply:  node tools/build-sale-page.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = 'https://caskworth.com/whiskey-sale/';
const TITLE = 'Whiskey Sale: Buy Any Bottle 15% Off | Caskworth';
const DESC = 'Whiskey sale at Caskworth: buy any whiskey, bourbon, Scotch or cognac 15% off until 20 February 2027. Flat $24.35 delivery, free over $900.';
const PRIMARY = 'whiskey sale';
const SECONDARY = ['whiskey sales', 'whiskey on sale', 'christmas whiskey', 'whiskey gift for christmas', 'whiskey christmas gift', 'whiskey christmas present', 'whiskey for christmas', 'pappy van winkle bourbon whiskey for sale', 'crown royal whiskey for sale', 'jack daniels whiskey for sale', 'jameson whiskey for sale', 'christmas whiskey cocktails', 'whiskey christmas drinks', 'jack daniels christmas whiskey', 'christmas whiskey glasses'];
const TODAY = '2026-11-18';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = n => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const words = s => (s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').match(/[A-Za-z0-9$%.,'’-]+/g) || []).length;

function prod(slug) {
  const h = fs.readFileSync(`${R}/products/${slug}.html`, 'utf8');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const o = JSON.parse(m[1]); if (o['@type'] === 'Product') { const list = parseFloat(o.offers.priceSpecification ? o.offers.priceSpecification.price : o.offers.price); return { slug, name: o.name, list, sale: Math.round(list * 85) / 100 }; } } catch { } }
  throw new Error('no product ' + slug);
}
const T = ['jameson-original', 'jack-daniels-old-no-7', 'eagle-rare-10-year', 'macallan-12-double-cask', 'blantons-original-single-barrel', 'hennessy-xo', 'johnnie-walker-blue-label', 'pappy-van-winkle-15-year'].map(prod);
const G = ['woodford-reserve-gift-set-with-glasses', 'macallan-discovery-set', 'japanese-whisky-trio'].map(prod);
const pl = (p) => `<a href="/products/${p.slug}">${esc(p.name)}</a>`;
const P = Object.fromEntries([...T, ...G].map(p => [p.slug, p]));
const crown = prod('crown-royal-deluxe'), woodford = P['woodford-reserve-gift-set-with-glasses'];

const sections = [];
const sec = (id, h2, opener, rest) => sections.push({ id, h2, opener, rest });
sec('what', 'What is the Caskworth whiskey sale?',
  'The Caskworth whiskey sale is a limited Christmas and New Year offer: 15% off every product in our catalogue, from everyday bourbon to rare Scotch, cognac and gift sets. There is no code to enter. The sale price shows on each bottle, and the saving appears as its own line in your cart and at checkout.',
  `<p>Every sale needs a clear rule, so here it is: the discount is 15% of the list price on every single bottle, with no exclusions in the catalogue. Browse our <a href="/shop/bourbon/">bourbon</a>, <a href="/shop/scotch/">Scotch</a>, <a href="/shop/cognac/">cognac</a>, <a href="/shop/irish/">Irish whiskey</a>, <a href="/shop/japanese/">Japanese whisky</a> and <a href="/shop/rye/">rye</a> collections and you will see the old price crossed out beside the new one. These whiskey sales run only once a year, so the offer ends on a fixed date rather than when stock runs out.</p>`);
sec('save', 'How much can you save in the whiskey sale?',
  'Your saving is exactly 15% of each bottle’s list price, rounded to the cent. A $22.99 everyday bourbon drops to $19.54, while a $199.99 cognac drops to $169.99. The table below shows real prices for popular bottles, so you can see the whiskey on sale before you add anything to your cart.',
  `<table><thead><tr><th>Bottle</th><th>List price</th><th>Sale price</th><th>You save</th></tr></thead><tbody>${T.map(p => `<tr><td>${pl(p)}</td><td>${money(p.list)}</td><td><strong>${money(p.sale)}</strong></td><td>${money(Math.round((p.list - p.sale) * 100) / 100)}</td></tr>`).join('')}</tbody></table>
<p>The same maths applies to the rest of the range. On a ${money(P['pappy-van-winkle-15-year'].list)} ${pl(P['pappy-van-winkle-15-year'])} the offer is worth ${money(Math.round((P['pappy-van-winkle-15-year'].list - P['pappy-van-winkle-15-year'].sale) * 100) / 100)}, and because that order is over $900 the delivery is free as well.</p>`);
sec('ends', 'When does the Christmas whiskey sale end?',
  'The Christmas whiskey sale ends at 11:59 PM Pacific time on 20 February 2027, so it covers the holidays, New Year and Valentine’s gifting. Prices return to list price on 21 February. The live countdown at the top of this page shows exactly how much time is left, down to the second.',
  `<p>If you are planning ahead, remember that same-day delivery applies to orders placed by 2 PM local time in 33 U.S. states and 7 Canadian provinces, and all other areas receive delivery in 1 to 3 business days. Order a few days before a deadline you care about, such as December 24 or Valentine’s Day, to be safe.</p>`);
sec('gift', 'Which bottles make the best Christmas whiskey gift?',
  'The best Christmas whiskey gift matches the drinker: a smooth bourbon for newcomers, a Japanese or single malt bottle for enthusiasts, and a boxed gift set when presentation matters. Every whiskey gift for Christmas in our catalogue is part of the 15% offer, including the three ready-to-give sets listed below.',
  `<ul><li>${pl(G[0])}: ${money(G[0].list)}, now ${money(G[0].sale)}. A whiskey christmas gift that includes glasses.</li><li>${pl(G[1])}: ${money(G[1].list)}, now ${money(G[1].sale)}. Three Macallan expressions, a whiskey christmas present for collectors.</li><li>${pl(G[2])}: ${money(G[2].list)}, now ${money(G[2].sale)}. A trio for anyone curious about Japanese whisky.</li></ul>
<p>Searching for whiskey for Christmas can feel endless, so start with our <a href="/shop/gifts/">gift sets collection</a> or read the <a href="/blog/best-whiskey-gift-sets/">best whiskey gift sets guide</a> for how each set compares. Whether you want Christmas whiskey for a host, a colleague or yourself, the sale price applies automatically.</p>`);
sec('brands', 'Is Pappy Van Winkle, Crown Royal, Jack Daniel’s, Jameson or Blanton’s whiskey for sale here?',
  'Yes. Pappy Van Winkle bourbon whiskey for sale, Crown Royal whiskey for sale, Jack Daniel’s whiskey for sale, Jameson whiskey for sale and Blanton’s whiskey for sale all appear in our catalogue when in stock, and every bottle is part of the 15% offer. Stock changes quickly, so check each bottle’s page for availability.',
  `<p>Popular examples include ${pl(prod('crown-royal-deluxe'))} at ${money(crown.sale)}, ${pl(P['jack-daniels-old-no-7'])} at ${money(P['jack-daniels-old-no-7'].sale)} and ${pl(P['jameson-original'])} at ${money(P['jameson-original'].sale)}. For something rarer, see ${pl(P['blantons-original-single-barrel'])} at ${money(P['blantons-original-single-barrel'].sale)} or our <a href="/shop/allocated/">allocated bottles</a>, where Pappy Van Winkle and other hard-to-find releases are listed.</p>`);
sec('delivery', 'How do delivery and the minimum order work during the sale?',
  'Delivery is a flat $24.35 to anywhere in the USA and Canada, and free when your order is over $900. The $249.99 minimum order and the $900 free-delivery threshold are both measured on list prices before the 15% offer, so the offer never stops a cart from qualifying.',
  `<p>In practice that means a cart of list-price bottles worth $250 can check out even though the 15% offer lowers what you pay to about $212.50, plus delivery. The full rules are on our <a href="/shipping-policy/">shipping policy</a> page.</p>`);
sec('stack', 'Does the whiskey sale stack with the crypto discount?',
  'Yes. Pay with cryptocurrency and the existing 10% crypto discount is applied on top of the 15% sale, calculated on the already-reduced subtotal. For example, a $300 subtotal becomes $255 after the offer and $229.50 after the crypto discount, before the flat delivery fee.',
  `<p>You can see each line separately in the order summary at checkout: subtotal, the Christmas and New Year offer, the crypto discount if you choose it, delivery and the final total. Nothing is hidden or added after you pay.</p>`);
sec('drinks', 'What are the best Christmas whiskey cocktails and drinks?',
  'The simplest Christmas whiskey cocktail is the Old Fashioned. The International Bartenders Association recipe uses 45 ml of bourbon or rye, one sugar cube, two dashes of Angostura bitters and a few drops of water, stirred over ice and finished with an orange peel. It suits almost any bourbon or rye in the sale.',
  `<p>For whiskey christmas drinks that need little effort, pour a good bourbon over ice, add a twist of orange, and serve. Many people reach for Jack Daniel’s Christmas whiskey ideas, such as the ${pl(P['jack-daniels-old-no-7'])}, because it is easy to find and easy to mix. If you are hosting, a set of Christmas whiskey glasses makes the pour feel special, which is why the ${pl(woodford)} is a popular choice. Our <a href="/blog/best-whiskey-for-old-fashioned/">guide to the best whiskey for an Old Fashioned</a> compares eight bottles by cost per drink.</p>`);

const FAQ = [
  ['How long does the whiskey sale last?', 'The offer runs until 11:59 PM Pacific time on 20 February 2027. Orders placed before that moment keep the 15% discount. From 21 February, prices return to the normal list price, so the countdown at the top of the page is the safest guide.'],
  ['Do I need a code for the Christmas offer?', 'No code is needed. The 15% discount is applied automatically to every bottle. You will see the crossed-out list price beside the sale price on each product, and the saving shows as a separate line in your cart and at checkout.'],
  ['Is every bottle included in the Christmas whiskey sale?', 'Yes. The Christmas whiskey sale covers the entire catalogue: bourbon, Scotch, Irish, Japanese, Canadian, rye, cognac, brandy, allocated bottles and gift sets. Products shown as coming soon cannot be ordered yet, so they carry no sale price until they are listed.'],
  ['Can I buy a whiskey christmas gift for someone else?', 'Yes. Any bottle or gift set can be a whiskey christmas gift, and we deliver to the address you enter at checkout. Orders over $249.99 list value qualify, and the recipient or an adult over 21 must be available to receive the delivery.'],
  ['What does delivery cost during the whiskey sale?', 'Delivery is a flat $24.35 to anywhere in the USA and Canada, and free when your list-price subtotal is over $900. The fee is shown in your order summary at checkout before you pay, so there are no surprises on the final total.']
];

function body() {
  let h = '';
  for (const s of sections) h += `<h2 id="${s.id}">${esc(s.h2)}</h2>\n<p class="sale-ans">${s.opener.replace(/&/g, '&amp;')}</p>\n${s.rest}\n`;
  h += `<h2 id="faq">Whiskey Sale FAQ</h2>\n` + FAQ.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n');
  return h;
}
const bodyHtml = body();
const totalWords = words(bodyHtml);
const checks = sections.map(s => [s.id, words(s.opener)]).concat(FAQ.map((f, i) => ['faq' + i, words(f[1])]));
const bad = checks.filter(([, w]) => w < 40 || w > 60);
const intro = 'Our Christmas and New Year whiskey sale takes 15% off every bottle at Caskworth until 20 February 2027. Whiskey, bourbon, Scotch, Irish, Japanese, rye, cognac and gift sets all qualify, with the discount applied automatically. Delivery is a flat $24.35, and free on orders over $900.';
checks.push(['intro', words(intro)]);
const txt = (bodyHtml + ' ' + intro).replace(/<[^>]+>/g, ' ').toLowerCase().replace(/&amp;/g, '&');
const occ = (txt.match(/whiskey sale/g) || []).length; const dens = occ * 2 / words(bodyHtml + intro) * 100;
console.log('body words', totalWords, '| primary occurrences', occ, '| density', dens.toFixed(2) + '%', '| opener word counts', checks.map(c => c.join(':')).join(' '));
if (bad.length) console.log('OPENERS OUT OF 40-60:', JSON.stringify(bad));

const ld = [
  { '@context': 'https://schema.org', '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: TITLE, description: DESC, inLanguage: 'en-US', datePublished: TODAY, dateModified: TODAY, about: 'Christmas and New Year whiskey sale, 15% off everything until 20 February 2027' },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://caskworth.com/' }, { '@type': 'ListItem', position: 2, name: 'Whiskey Sale', item: URL_ }] },
  { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Whiskey sale: example bottles at 15% off', itemListElement: T.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `https://caskworth.com/products/${p.slug}` })) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
];

const gridItems = T.slice(0, 4).concat(G.slice(0, 2)).map(p => `<a href="/products/${p.slug}"><img src="/assets/images/products/${p.slug}.webp" alt="${esc(p.name)} in the Caskworth whiskey sale, 15% off" width="110" height="140" loading="lazy" style="display:block;margin:0 auto 10px;object-fit:contain">${esc(p.name)}<small><s>${money(p.list)}</s> <strong style="color:#e11d2e">${money(p.sale)}</strong></small></a>`).join('');
const mainHtml = `<main id="main-content">
<section class="sale-hero"><div class="container">
  <a class="promo-seal promo-seal-static" href="#what" aria-label="Christmas and New Year sale, 15 percent off">${'<!--SEAL-->'}</a>
  <h1>Whiskey Sale: 15% Off Every Bottle This Christmas &amp; New Year</h1>
  <p>${intro}</p>
  <div class="sale-count" role="timer" aria-label="Time left in the whiskey sale"><div><b data-cd="d">0</b><span>Days</span></div><div><b data-cd="h">00</b><span>Hours</span></div><div><b data-cd="m">00</b><span>Mins</span></div><div><b data-cd="s">00</b><span>Secs</span></div></div><br>
  <a class="sale-cta" href="/shop/">Shop the whiskey sale</a>
</div></section>
<div class="sale-wrap">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Whiskey Sale</span></nav>
<div class="sale-grid">${gridItems}</div>
${bodyHtml}
<p style="margin-top:30px"><a class="sale-cta" href="/shop/">Browse every bottle at 15% off</a></p>
</div></main>`;

// ---------- assemble page from the About shell ----------
const shellRaw = fs.readFileSync(R + '/about/index.html', 'utf8'); const crlf = shellRaw.includes('\r\n'); let h = shellRaw.split('\r\n').join('\n');
const kw = [PRIMARY, ...SECONDARY].join(', ');
const setMeta = (re, tag) => { if (re.test(h)) h = h.replace(re, () => tag); else h = h.replace('</head>', () => tag + '\n</head>'); };
h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(TITLE)}</title>`);
setMeta(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(DESC)}">`);
setMeta(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${esc(kw)}">`);
setMeta(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${URL_}">`);
h = h.replace(/<link rel="alternate" hreflang="([^"]*)" href="[^"]*">/g, (m, l) => `<link rel="alternate" hreflang="${l}" href="${URL_}">`);
setMeta(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(TITLE)}">`);
setMeta(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(DESC)}">`);
setMeta(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${URL_}">`);
setMeta(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(TITLE)}">`);
setMeta(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(DESC)}">`);
h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');
h = h.replace('</head>', () => ld.map(o => `<script type="application/ld+json">${JSON.stringify(o, null, 2)}</script>`).join('\n') + '\n</head>');
h = h.replace(/<main[\s\S]*?<\/main>/, () => mainHtml.replace('<!--SEAL-->', '<span data-seal></span>'));
// last-updated line before the footer
if (!h.includes('class="page-updated"')) h = h.replace(/<footer/, () => `<p class="page-updated" style="margin:0;padding:18px 20px;font-size:12px;color:#8a8a8a;text-align:center;background:#fff">Last updated: <time datetime="${TODAY}">November 18, 2026</time></p>\n<footer`);
// seal markup is injected client side too, but ship a static copy for no-JS crawlers via an inline script-free SVG placeholder
h = h.replace('<span data-seal></span>', '<span class="sr-only">15% off everything until 20 February</span>');
fs.mkdirSync(R + '/whiskey-sale', { recursive: true });
fs.writeFileSync(R + '/whiskey-sale/index.html', crlf ? h.split('\n').join('\r\n') : h);
console.log('wrote whiskey-sale/index.html', h.length);
