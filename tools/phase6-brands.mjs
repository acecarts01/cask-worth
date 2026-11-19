// Phase 6 (no-research part): (A) take keywords that product pages now own off brand pages, (B) add a data-driven buying section to thin brand pages.
// usage: node tools/phase6-brands.mjs [--dry]
import fs from 'fs';
const DRY = process.argv.includes('--dry');
const seo = JSON.parse(fs.readFileSync('content/product-seo.json', 'utf8'));
const brandsMeta = JSON.parse(fs.readFileSync('docs/brand-pages.json', 'utf8'));
const norm = k => k.toLowerCase().replace(/&#39;|&rsquo;|[\u2019']/g, "'").replace(/'/g, '').replace(/\s+/g, ' ').trim();
const own = {}; for (const [s, d] of Object.entries(seo)) { if (s[0] === '_') continue; for (const k of [d.primary, ...(d.secondary || [])]) own[norm(k)] = s; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dec = s => String(s).replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&rsquo;/g, '\u2019');
const strip = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const wc = s => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kwRx = kw => new RegExp(kw.split(' ').map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/s$/, "(?:'|&#39;|\u2019)?s")).join('\\s+'), 'ig');
// primaries that product pages own and need a replacement (no research: next unowned keyword on the page, else a name-based one flagged for Semrush)
const NEWPRIMARY = {
  dewars: { kw: 'dewars 18 years price', disp: "Dewar's 18 Years Price" },
  'elijah-craig': { kw: 'elijah craig bourbon price', disp: 'Elijah Craig Bourbon Price' },
  glendronach: { kw: 'buy glendronach online', disp: 'Buy GlenDronach Online', pending: true },
  'johnnie-walker': { kw: 'johnnie walker black label', disp: 'Johnnie Walker Black Label' },
};
const summary = { conflictPages: 0, removed: 0, padded: 0, primaryChanged: 0, pending: [] };
for (const e of fs.readdirSync('shop/brands', { withFileTypes: true }).filter(e => e.isDirectory())) {
  const slug = e.name; const f = `shop/brands/${slug}/index.html`; let h = fs.readFileSync(f, 'utf8'); const eol = h.includes('\r\n') ? '\r\n' : '\n';
  const orig = h; const bname = dec((brandsMeta.find(b => b.slug === slug) || {}).name || slug);
  const kwsRaw = dec((h.match(/<meta name="keywords" content="([^"]*)"/) || [])[1] || '').split(',').map(x => x.trim()).filter(Boolean);
  const conflicts = kwsRaw.filter(k => own[norm(k)]); const oldPrimary = kwsRaw[0];
  // ---- A: conflicts ----
  if (conflicts.length) {
    summary.conflictPages++; summary.removed += conflicts.length;
    let kept = kwsRaw.filter(k => !own[norm(k)]);
    let np = NEWPRIMARY[slug];
    if (!np && conflicts.some(k => norm(k) === norm(oldPrimary)) && kept[0]) np = { kw: kept[0], disp: kept[0].replace(/\b([a-z])/g, c => c.toUpperCase()) };
    if (np) { kept = [np.kw, ...kept.filter(k => norm(k) !== norm(np.kw))]; summary.primaryChanged++; if (np.pending) summary.pending.push(slug); }
    h = h.replace(/<meta name="keywords" content="[^"]*">/, () => `<meta name="keywords" content="${esc(kept.join(', '))}">`);
    h = h.replace(/(<p class="pdp-tags-text">)[^<]*(<\/p>)/, (m, a, b) => a + esc(kept.join(', ')) + b);
    if (np) {
      const rx = kwRx(oldPrimary); const prevDisp = (h.match(/<h1>([^<]*)<\/h1>/) || [])[1] || '';
      for (const tag of [/<title>[^<]*<\/title>/, /<meta name="description" content="[^"]*">/, /<meta property="og:title" content="[^"]*">/, /<meta property="og:description" content="[^"]*">/, /<h1>[^<]*<\/h1>/]) h = h.replace(tag, m => m.replace(rx, () => np.disp));
    }
    // rewrite the keyword paragraph: drop sentences that carry a removed keyword
    h = h.replace(/(<p data-kw-brand>)([\s\S]*?)(<\/p>)/, (m, a, body, z) => {
      const sents = body.split(/(?<=[.?])\s+/).filter(s => !conflicts.some(k => kwRx(k).test(s) && (kwRx(k).lastIndex = 0, true)) && !conflicts.some(k => new RegExp(kwRx(k).source, 'i').test(s)));
      let text = sents.join(' ');
      if (np && !new RegExp(kwRx(np.kw).source, 'i').test(text)) {
        const prices = [...h.matchAll(/class="pc-price">\$([\d,.]+)</g)].map(x => Number(x[1].replace(/,/g, ''))); const n = prices.length;
        text = `The ${np.disp} range at Caskworth runs from ${money(Math.min(...prices))} to ${money(Math.max(...prices))} across ${n} bottle${n > 1 ? 's' : ''}. ` + text;
      }
      return a + text.trim() + z;
    });
    // FAQ must carry the primary: add one item when the primary changed
    if (np) {
      const pd = np.disp; const prices = [...h.matchAll(/class="pc-price">\$([\d,.]+)</g)].map(x => Number(x[1].replace(/,/g, '')));
      const q = `What is the ${pd.toLowerCase().replace(/\bdewar's\b/, "Dewar's").replace(/\bglendronach\b/, 'GlenDronach').replace(/\b(\w)/g, c => c)} at Caskworth?`.replace(/^What is the /, np.kw.startsWith('buy ') ? 'Can I ' : 'What is the ').replace(/at Caskworth\?$/, np.kw.startsWith('buy ') ? 'at Caskworth?' : 'at Caskworth?');
      const faqQ = np.kw.startsWith('buy ') ? `Can I ${np.kw} at Caskworth?` : `What is the ${np.kw} at Caskworth?`;
      const faqA = `Caskworth lists ${prices.length} ${bname} bottle${prices.length > 1 ? 's' : ''} from ${money(Math.min(...prices))} to ${money(Math.max(...prices))}, with same-day delivery in 33 U.S. states and 7 Canadian provinces on qualifying orders. Paying with cryptocurrency saves 10% automatically.`;
      if (!new RegExp(kwRx(np.kw).source, 'i').test(strip(h.slice(h.lastIndexOf('Frequently Asked Questions'))))) {
        const item = `<div class="faq-item" data-p6>${eol}  <button class="faq-q" onclick="toggleFaq(this)"><span>${esc(faqQ)}</span><span class="faq-icon">+</span></button>${eol}  <div class="faq-a"><div class="faq-a-inner">${esc(faqA)}</div></div>${eol}</div>`;
        const fi = h.indexOf('Frequently Asked Questions'); const lastItemEnd = h.indexOf('</div></div>', h.lastIndexOf('<div class="faq-item">'));
        if (fi > 0 && lastItemEnd > 0) { const cut = lastItemEnd + '</div></div>'.length; const rest = h.slice(cut); const closeIdx = rest.indexOf('</div>'); h = h.slice(0, cut) + rest.slice(0, closeIdx + 6) + item + rest.slice(closeIdx + 6); }
      }
      h = h.replace(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)<\/script>/, (m, j) => {
        const o = JSON.parse(j); o.mainEntity = o.mainEntity.filter(x => x.name !== faqQ); o.mainEntity.push({ '@type': 'Question', name: faqQ, acceptedAnswer: { '@type': 'Answer', text: faqA } });
        return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
      });
    }
  }
  // ---- B: thin pages ----
  const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
  if (wc(strip(main)) < 300 && !h.includes('<!--p6-start-->')) {
    const items = [...h.matchAll(/<div class="pc" data-pid="([^"]+)">[\s\S]*?class="pc-name">([^<]*)<[\s\S]*?class="pc-price">\$([\d,.]+)</g)].map(m => ({ slug: m[1], name: dec(m[2]), price: Number(m[3].replace(/,/g, '')) })).sort((a, b) => a.price - b.price);
    if (items.length) {
      const L = i => `<a href="/products/${i.slug}">${esc(i.name)}</a>`; const lo = items[0], hi = items.at(-1), mid = items[items.length >> 1];
      const opener = items.length === 1
        ? `${esc(lo.name)} is the ${esc(bname)} bottle Caskworth lists today, priced at ${money(lo.price)}. It is the one to buy if you want this producer's style without comparing releases, and it ships with the same delivery terms, 10% cryptocurrency saving and 21+ age check as every order.`
        : `For most buyers the best place to start with ${esc(bname)} is ${L(lo)} at ${money(lo.price)}, the most affordable of the ${items.length} bottles Caskworth lists. Step up to ${L(mid)} at ${money(mid.price)} for more depth, and keep ${L(hi)} at ${money(hi.price)} for a special occasion or gift.`;
      const second = `Caskworth ships ${esc(bname)} by same-day delivery to 33 U.S. states and 7 Canadian provinces on orders of $249.99 or more placed by 2PM, with a flat $24.35 delivery fee elsewhere (free over $900). Paying with cryptocurrency takes 10% off automatically, and every buyer must be 21 or over.`;
      const sec = `<!--p6-start-->${eol}<section class="section"><div class="container" style="max-width:860px;">${eol}<h2 style="font-size:20px;margin:0 0 8px;">Which ${esc(bname)} bottle should you buy?</h2>${eol}<p>${opener}</p>${eol}<h2 style="font-size:20px;margin:20px 0 8px;">How does ${esc(bname)} delivery work at Caskworth?</h2>${eol}<p>${second}</p>${eol}</div></section>${eol}<!--p6-end-->`;
      const anchor = '<div class="info-card reveal" style="text-align:center;">';
      if (h.includes(anchor)) { h = h.replace(anchor, () => sec + eol + '  ' + anchor); summary.padded++; }
    }
  }
  // ---- C: every brand FAQ must contain the primary keyword ----
  {
    const kwNow = dec((h.match(/<meta name="keywords" content="([^"]*)"/) || [])[1] || '').split(',').map(x => x.trim()).filter(Boolean);
    const P = kwNow[0]; const fi = h.lastIndexOf('Frequently Asked Questions');
    const flat = s => s.toLowerCase().replace(/&#39;|&rsquo;|[’']/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    if (P && fi > 0 && !flat(h.slice(fi)).includes(flat(P).replace(/'/g, ''))) {
      const prices = [...h.matchAll(/class="pc-price">\$([\d,.]+)</g)].map(x => Number(x[1].replace(/,/g, ''))); const n = prices.length;
      const faqQ = /^buy .* online$/.test(P) ? `Can I ${P} at Caskworth?` : /^buy /.test(P) ? `Can I ${P} from Caskworth?` : /(price|prices|cost)$/.test(P) ? `What is the ${P} at Caskworth?` : `Where can I find ${P} at Caskworth?`;
      const faqA = n ? `Caskworth lists ${n} ${bname} bottle${n > 1 ? 's' : ''} from ${money(Math.min(...prices))} to ${money(Math.max(...prices))}, so you can compare every release in one place. Orders ship by same-day delivery in 33 U.S. states and 7 Canadian provinces where eligible, and paying with cryptocurrency takes 10% off automatically.` : `Caskworth lists ${bname} bottles with same-day delivery in 33 U.S. states and 7 Canadian provinces where eligible, and paying with cryptocurrency takes 10% off automatically.`;
      const item = `<div class="faq-item" data-p6>${eol}  <button class="faq-q" onclick="toggleFaq(this)"><span>${esc(faqQ)}</span><span class="faq-icon">+</span></button>${eol}  <div class="faq-a"><div class="faq-a-inner">${esc(faqA)}</div></div>${eol}</div>`;
      const li = h.lastIndexOf('<div class="faq-item"'); const endA = h.indexOf('</div></div>', li);
      if (li > 0 && endA > 0) {
        const afterAns = endA + '</div></div>'.length; const closeItem = h.indexOf('</div>', afterAns) + '</div>'.length;
        h = h.slice(0, closeItem) + item + h.slice(closeItem);
        h = h.replace(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)<\/script>/, (m, j) => { const o = JSON.parse(j); o.mainEntity = o.mainEntity.filter(x => x.name !== faqQ); o.mainEntity.push({ '@type': 'Question', name: faqQ, acceptedAnswer: { '@type': 'Answer', text: faqA } }); return `<script type="application/ld+json">${JSON.stringify(o)}</script>`; });
        summary.faqAdded = (summary.faqAdded || 0) + 1;
      }
    }
  }
  if (h !== orig) {
    h = h.replace(/"dateModified": "[\d-]+"/g, '"dateModified": "2026-11-18"').replace(/(Last updated: <time datetime=")[\d-]+(">)[^<]*(<\/time>)/, (m, a, b, c) => a + '2026-11-18' + b + 'November 18, 2026' + c);
    if (!DRY) fs.writeFileSync(f, h);
    console.log(`${slug}: ${conflicts.length ? 'removed ' + conflicts.join(' ; ') : ''}${h.includes('<!--p6-start-->') ? ' [+buying section]' : ''}`);
  }
}
console.log(JSON.stringify(summary));
