// Renders content/bottle-profiles.json into each product page, between <!--bp-start--> and <!--bp-end-->.
// Idempotent. Only slugs present in the JSON are touched.
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('content/bottle-profiles.json', 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rows = [['colour', 'Colour'], ['nose', 'Nose'], ['palate', 'Palate'], ['finish', 'Finish'], ['casks', 'Cask &amp; make']];
let n = 0;
for (const [slug, d] of Object.entries(data)) {
  if (slug.startsWith('_')) continue;
  const f = `products/${slug}.html`;
  if (!fs.existsSync(f)) { console.log('MISSING page', slug); continue; }
  let h = fs.readFileSync(f, 'utf8');
  const eol = h.includes('\r\n') ? '\r\n' : '\n';
  const name = (h.match(/<h1 class="pdp-name">([^<]*)<\/h1>/) || [])[1];
  if (!name) { console.log('no h1', slug); continue; }
  if (!d.source || !/^https:\/\//.test(d.source.url)) { console.log('NO SOURCE', slug); continue; }
  if (d.abv) { const t=(h.match(/<span class="spec-val">([\d.]+)%<\/span><span class="spec-key">ABV/)||[])[1]; if (t && Math.abs(+t - d.abv) > 0.05) console.log('ABV MISMATCH', slug, 'page', t, 'producer', d.abv); }
  const dl = rows.filter(([k]) => d[k]).map(([k, l]) => `<dt style="font-weight:700;color:var(--dark);">${l}</dt><dd style="margin:0 0 10px;">${k === 'casks' ? esc(d[k]) : esc(d[k])}</dd>`).join('');
  const aw = d.awards && d.awards.length ? `<h3 style="font-size:15px;margin:18px 0 6px;">Recognition</h3><ul style="margin:0 0 12px 18px;">${d.awards.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '';
  const block = `<!--bp-start-->
<section class="pdp-profile" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);font-size:14px;line-height:1.7;">
<div class="pdp-section-label">About ${name}</div>
<p>${esc(d.about)}</p>
<dl style="margin:12px 0;">${dl}</dl>${aw}
<p style="font-size:12px;color:var(--muted2);">Source: <a href="${esc(d.source.url)}" rel="noopener" target="_blank">${esc(d.source.name)}</a>, producer information checked October 2026.</p>
</section>
<!--bp-end-->`.replace(/\n/g, eol);
  h = h.replace(/<!--bp-start-->[\s\S]*?<!--bp-end-->\r?\n?/, '');
  const anchor = '<div class="pdp-tags">';
  if (!h.includes(anchor)) { console.log('no anchor', slug); continue; }
  h = h.replace(anchor, block + eol + anchor);
  fs.writeFileSync(f, h); n++;
}
console.log('profiles applied:', n);
