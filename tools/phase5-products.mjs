// Phase 5: rebuilds the SEO layer of product pages from facts already on the page + verified data in content/product-seo.json.
// usage: node tools/phase5-products.mjs slug [slug...]   (no args = every slug in content/product-seo.json)
// Idempotent (<!--p5-start-->..<!--p5-end--> block, FAQ item tagged data-p5). Never invents data: GTIN only from product-seo.json.
import fs from 'fs';
const seo = JSON.parse(fs.readFileSync('content/product-seo.json', 'utf8'));
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(seo).filter(k => !k.startsWith('_'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dec = s => String(s).replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&mdash;/g, '—').replace(/&quot;/g, '"');
const tc = s => s.replace(/\b([a-z])([a-z']*)/g, (m, a, b) => a.toUpperCase() + b).replace(/\b(\d+)ml\b/gi, '$1ml');
const wc = s => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const gtinOk = s => { const d = s.split('').map(Number); const c = d.pop(); let t = 0; d.reverse().forEach((x, i) => t += x * (i % 2 === 0 ? 3 : 1)); return (10 - t % 10) % 10 === c; };
const serve = (type, cat) => {
  const t = (type + ' ' + cat).toLowerCase();
  if (/cognac|brandy|armagnac/.test(t)) return 'Pour it neat into a tulip-shaped glass and let it sit for a minute so the aromas open up. A few drops of water can soften the spirit, and cognac of this kind also works in classic cocktails such as the Sidecar.';
  if (/japanese/.test(t)) return 'Pour it neat in a tulip glass, or add a few drops of room-temperature water to open it up. Japanese whisky also suits a tall highball with chilled soda water and plenty of ice.';
  if (/scotch|single malt|blended/.test(t)) return 'Pour it neat in a tulip glass, then add a few drops of room-temperature water if you want the aromas to open up. Avoid heavy ice, which dulls the flavour as it chills the glass.';
  if (/bourbon|rye|american/.test(t)) return 'Pour it neat, over one large ice cube, or with a few drops of water. It also holds up in the classics, such as an Old Fashioned or a Manhattan, where the grain character carries through.';
  return 'Pour it neat in a tulip or Glencairn glass, over one large ice cube, or with a few drops of room-temperature water, whichever shows the bottle at its best for you.';
};
let done = 0, problems = 0;
for (const slug of slugs) {
  const f = `products/${slug}.html`; const d = seo[slug];
  if (!fs.existsSync(f) || !d) { console.log('SKIP', slug); continue; }
  let h = fs.readFileSync(f, 'utf8'); const eol = h.includes('\r\n') ? '\r\n' : '\n';
  const name = dec((h.match(/<h1 class="pdp-name">([^<]*)<\/h1>/) || [])[1] || '');
  const dist = dec((h.match(/<p class="pdp-distillery">([^<]*)</) || [])[1] || '');
  const region = dec((h.match(/<p class="pdp-region">[^<]*?\s([^<]*)</) || [])[1] || '').replace(/^\W+/, '');
  const cat = dec((h.match(/<span class="pdp-cat-label">([^<]*)</) || [])[1] || '');
  const spec = k => dec((h.match(new RegExp(`<span class="spec-val">([^<]*)</span><span class="spec-key">${k}<`)) || [])[1] || '');
  const abv = spec('ABV'), age = spec('Age'), type = spec('Type');
  const was = (h.match(/data-was="\$([\d,.]+)"/) || [])[1] || (h.match(/"price": "([\d.]+)"/) || [])[1];
  const price = Number(String(was).replace(/,/g, '')); const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const crypto = money(Math.round(price * 0.9 * 100) / 100);
  const notes = [...h.matchAll(/<span class="tn-tag">([^<]*)<\/span>/g)].map(m => dec(m[1]));
  const bp = (h.match(/<!--bp-start-->([\s\S]*?)<!--bp-end-->/) || [])[1] || '';
  const bpf = k => dec((bp.match(new RegExp(`<dt[^>]*>${k}</dt><dd[^>]*>([^<]*)</dd>`)) || [])[1] || '');
  const nose = bpf('Nose'), palate = bpf('Palate'), finish = bpf('Finish');
  const P = d.primary, PT = tc(P);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const ageTxt = /yr|year/i.test(age) || /^\d/.test(age) ? age.replace(/yr$/, ' year') : '';
  // --- sections (answer-first openers 40-60 words) ---
  const s1 = (nose || palate || finish)
    ? `${name} is described by its producer ${nose ? `with a nose of ${nose.charAt(0).toLowerCase() + nose.slice(1)}` : ''}${palate ? `${nose ? ', ' : ' with '}a palate of ${palate.charAt(0).toLowerCase() + palate.slice(1)}` : ''}${finish ? ` and a finish that is ${finish.charAt(0).toLowerCase() + finish.slice(1)}` : ''}. At Caskworth the listed tasting notes are ${list(notes.map(x => x.toLowerCase()))}, so expect those flavours to lead when you pour a glass.`
    : `${name} is listed at Caskworth with tasting notes of ${list(notes.map(x => x.toLowerCase()))}. Those flavours are what you should expect to lead when you pour a glass, and they are the reason many buyers choose this ${type ? type.toLowerCase() : 'whisky'}.`;
  const trim = t => { const w = t.split(' '); return w.length > 58 ? w.slice(0, 58).join(' ').replace(/[,;]\s*\S*$/, '') + '.' : t; };
  const s2 = `The price is easy to check here: ${name} is listed at ${money(price)} at Caskworth, and paying with cryptocurrency (Bitcoin, Ethereum, USDT, Solana, XRP or BNB) takes 10% off automatically, bringing it to ${crypto}. Delivery is a flat $24.35 per order, and orders over $900 ship free.`;
  const s3 = serve(type, cat) + ' Serve it at room temperature in a clean glass and take your time over the first sip.';
  const s4 = `Ordering ${name} from Caskworth is simple: add it to the cart and check out, with orders of $249.99 or more eligible for same-day delivery to 33 U.S. states and 7 Canadian provinces when placed by 2PM. Other states and provinces receive delivery in 1–3 business days, and every buyer must be 21 or over.`;
  const facts = [dist && `produced by ${dist}`, region && `in ${region}`, abv && `bottled at ${abv} ABV`, ageTxt && `with an age statement of ${ageTxt}`].filter(Boolean);
  const intro = `${P.split(' ').length >= 5 ? '' : PT + ': '}${name} is ${facts.length ? facts.join(', ') : 'available now'}, and Caskworth lists it at ${money(price)} with delivery across the U.S. and Canada. This guide covers its flavour, price, serving and how ordering works.`;
  const guideLinks = [...h.matchAll(/<a href="(\/blog\/[^"]+)">([^<]+)<\/a>/g)].slice(0, 2);
  const catHref = (h.match(/<a href="(\/shop\/[a-z-]+\/)">([^<]+)<\/a>\s*&rsaquo;\s*<span/) || []);
  const links = !catHref[1] ? '' : `<p>${catHref[1] ? `Browse more in our <a href="${catHref[1]}">${catHref[2]} collection</a>. ` : ''}</p>`;
  const fit = t => { let w = wc(t); if (w < 41) t += ' Give it a minute in the glass before you judge it.'; w = wc(t); if (w > 60) t = t.replace(/, with orders of \$249\.99 or more eligible for same-day delivery to 33 U\.S\. states and 7 Canadian provinces when placed by 2PM/, ', with same-day delivery available in 33 U.S. states and 7 Canadian provinces on qualifying orders'); return t; };
  const q = [[`What does ${name} taste like?`, fit(trim(s1))], [`How much is ${name} at Caskworth?`, s2], [`How should you drink ${name}?`, s3], [`How do I order ${name} from Caskworth?`, fit(s4)]];
  const block = `<!--p5-start-->${eol}<section class="pdp-guide-p5" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);font-size:14px;line-height:1.7;">${eol}<div class="pdp-section-label">${esc(name)} Buying Guide</div>${eol}<p>${esc(intro)}</p>${eol}${q.map(([h2, a]) => `<h2 style="font-size:17px;margin:20px 0 6px;">${esc(h2)}</h2>${eol}<p>${esc(a)}</p>`).join(eol)}${eol}${links}${eol}</section>${eol}<!--p5-end-->`;
  for (const [h2, a] of q) { const w = wc(a); if (w < 40 || w > 60) { console.log(`  opener ${w}w: ${slug} | ${h2}`); problems++; } }
  h = h.replace(/<!--p5-start-->[\s\S]*?<!--p5-end-->\r?\n?/, '');
  const anchor = ['<p class="pdp-guide"', '<div class="pdp-tags">', '<div class="pdp-faq"'].find(a => h.includes(a));
  if (!anchor) { console.log('no anchor', slug); continue; }
  h = h.replace(anchor, () => block + eol + anchor);
  // --- FAQ ---
  const faqQ = /^buy .* online$/.test(P) ? `Can I ${P} at Caskworth?` : /^buy /.test(P) ? `Can I ${P} from Caskworth?` : /(price|cost)$/.test(P) ? `What is the ${P}?` : /for sale$/.test(P) ? `Where can I find ${P}?` : `Where can I find ${P} online?`;
  const faqA = `Caskworth stocks ${name} for ${money(price)}, and you can order it in a few clicks. Add it to your cart, pay by card or cryptocurrency, and receive it by same-day delivery in eligible areas or within 1–3 business days elsewhere. Every buyer must be 21 or over.`;
  h = h.replace(/<div class="faq-item" data-p5[\s\S]*?<\/div><\/div>\s*<\/div>/, '');
  const li = h.lastIndexOf('<div class="faq-item">'); const endMark = '</div></div>\n</div>'; let ei = h.indexOf(endMark, li);
  if (li < 0 || ei < 0) { const endMark2 = '</div></div>\r\n</div>'; ei = h.indexOf(endMark2, li); if (ei < 0) { console.log('no faq end', slug); continue; } h = h.slice(0, ei + 12) + `<div class="faq-item" data-p5>${eol}  <button class="faq-q" onclick="toggleFaq(this)"><span>${esc(faqQ)}</span><span class="faq-icon">+</span></button>${eol}  <div class="faq-a"><div class="faq-a-inner">${esc(faqA)}</div></div>${eol}</div>` + h.slice(ei + 12); }
  else h = h.slice(0, ei + 12) + `<div class="faq-item" data-p5>${eol}  <button class="faq-q" onclick="toggleFaq(this)"><span>${esc(faqQ)}</span><span class="faq-icon">+</span></button>${eol}  <div class="faq-a"><div class="faq-a-inner">${esc(faqA)}</div></div>${eol}</div>` + h.slice(ei + 12);
  // --- JSON-LD ---
  h = h.replace(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)<\/script>/, (m, j) => {
    const o = JSON.parse(j); o.mainEntity = o.mainEntity.filter(x => x.name !== faqQ && !/^Caskworth stocks /.test(x.acceptedAnswer.text));
    o.mainEntity.push({ '@type': 'Question', name: faqQ, acceptedAnswer: { '@type': 'Answer', text: faqA } });
    return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  });
  h = h.replace(/<script type="application\/ld\+json">(\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "Product"[\s\S]*?)<\/script>/, (m, j) => {
    const o = JSON.parse(j);
    if (d.gtin) {
      if (!gtinOk(d.gtin)) throw new Error('bad GTIN check digit ' + slug);
      delete o.gtin12; delete o.gtin13; delete o.gtin14;
      const key = { 12: 'gtin12', 13: 'gtin13', 14: 'gtin14' }[d.gtin.length]; if (!key) throw new Error('bad GTIN length ' + slug);
      const out = {}; for (const [k, v] of Object.entries(o)) { out[k] = v; if (k === 'sku') out[key] = d.gtin; } if (!out[key]) out[key] = d.gtin;
      return `<script type="application/ld+json">${JSON.stringify(out, null, 2)}</script>`;
    }
    return m;
  });
  // --- meta/title/keywords ---
  const buyKw = /^buy |online$/.test(P);
  const title = (buyKw ? [`${PT} | Caskworth`, PT] : [`${PT} — Buy Online | Caskworth`, `${PT} — Buy Online`, `${PT} | Caskworth`, PT]).find(t => t.length <= 60) || PT;
  let metaD = `${PT}: ${buyKw ? 'in stock' : 'buy ' + name + ' online'} at Caskworth for ${money(price)}${abv ? `, ${abv} ABV` : ''}. Same-day delivery in 33 U.S. states and 7 Canadian provinces.`;
  if (metaD.length > 155) metaD = metaD.replace('in 33 U.S. states and 7 Canadian provinces', 'across the U.S. and Canada');
  if (metaD.length > 155) metaD = metaD.replace(/, [\d.]+% ABV/, '');
  if (metaD.length > 155) metaD = `${PT}: buy online at Caskworth for ${money(price)}. Delivery across the U.S. and Canada.`;
  if (metaD.length > 160) metaD = `${PT}: buy online at Caskworth for ${money(price)}.`;
  h = h.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(metaD)}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, () => `<meta property="og:title" content="${esc(title)}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${esc(metaD)}">`);
  const kws = [P, ...(d.secondary || [])].filter((x, i, a) => a.indexOf(x) === i);
  const oldKw = (h.match(/<meta name="keywords" content="([^"]*)"/) || [])[1];
  if (oldKw) { const merged = [...kws, ...dec(oldKw).split(',').map(x => x.trim()).filter(x => x && !kws.includes(x))].slice(0, 10); h = h.replace(/<meta name="keywords" content="[^"]*">/, () => `<meta name="keywords" content="${esc(merged.join(', '))}">`); h = h.replace(/(<p class="pdp-tags-text">)[^<]*(<\/p>)/, (m, a, b) => `${a}${esc(merged.join(', '))}${b}`); }
  h = h.replace(/"dateModified": "[\d-]+"/g, '"dateModified": "2026-11-18"').replace(/(Last updated: <time datetime=")[\d-]+(">)[^<]*(<\/time>)/, (m, a, b, c) => a + '2026-11-18' + b + 'November 18, 2026' + c);
  fs.writeFileSync(f, h);
  const text = h.slice(h.indexOf('<main')); const words = wc(text.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
  const pc = (text.replace(/<script[\s\S]*?<\/script>/g, '').toLowerCase().match(new RegExp(P.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`${slug}: words ${words}, primary "${P}" x${pc} (${(pc * P.split(' ').length / words * 100).toFixed(1)}%), title ${title.length}c, meta ${metaD.length}c${d.gtin ? ', GTIN ' + d.gtin : ''}`);
  done++;
}
console.log('done', done, 'opener problems', problems);
