// Phase 7: accessibility + LCP fixes found by PageSpeed Insights (mobile). Idempotent. usage: node tools/phase7-a11y.mjs [--dry]
import fs from 'fs';
import { execSync } from 'child_process';
const DRY = process.argv.includes('--dry');
const files = execSync('git ls-files "*.html"', { maxBuffer: 1 << 26 }).toString().split('\n').filter(f => f && !/^(Reviews Folder|Products to Stock|New |new |backlink|node_modules)/.test(f));
const stats = {};
const bump = k => { stats[k] = (stats[k] || 0) + 1; };
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8'); const o = h;
  // 1. age-gate button: white text on gold fails contrast -> dark text
  h = h.replace(/(background:#c9941a;\s*)color:#fff;(border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">\s*Yes, I am 21\+)/, (m, a, b) => { bump('agegate'); return a + 'color:#1c1c1e;' + b; });
  // 2. footer social icon links: give them an accessible name
  h = h.replace(/<a href="#" class="fsoc">(<svg[^>]*><rect x="2")/g, (m, a) => { bump('instagram'); return `<a href="#" class="fsoc" aria-label="Instagram">${a}`; });
  h = h.replace(/<a href="#" class="fsoc">(<svg[^>]*><path d="M18 2h-3a5)/g, (m, a) => { bump('facebook'); return `<a href="#" class="fsoc" aria-label="Facebook">${a}`; });
  // 3. product pages: inline style colours that fail WCAG AA (grey/gold text) and LCP image priority
  if (f.startsWith('products/')) {
    const sub = (rx, to, key) => { h = h.replace(rx, (m, a, b) => { bump(key); return a + to + b; }); };
    sub(/(\.pdp-bc\{[^}]*?color:)#999(;)/, '#6b6b6b', 'bc');
    sub(/(\.pdp-bc a\{color:)#999(;)/, '#6b6b6b', 'bca');
    sub(/(\.pdp-cat-label\{[^}]*?color:)#c9941a(;)/, '#7a5800', 'catlabel');
    sub(/(\.pdp-region\{[^}]*?color:)#888(;)/, '#6b6b6b', 'region');
    sub(/(\.spec-key\{[^}]*?color:)#999(;)/, '#6b6b6b', 'speckey');
    sub(/(\.pdp-price\{[^}]*?color:)#c9941a(;)/, '#8a6712', 'price');
    sub(/(\.pdp-section-label\{[^}]*?color:)#888(;)/, '#6b6b6b', 'seclabel');
    sub(/(\.pdp-crypto-note\{[^}]*?color:)#16a34a(;)/, '#15803d', 'cryptonote');
    sub(/(\.pdp-link-label\{[^}]*?color:)#888(;)/, '#6b6b6b', 'linklabel');
    sub(/(\.pdp-tags-lbl\{[^}]*?color:)#888(;)/, '#6b6b6b', 'tagslbl');
    sub(/(\.pdp-tags-text\{[^}]*?color:)#999(;)/, '#6b6b6b', 'tagstext');
    h = h.replace(/(\.pdp-copy-btn\{[^}]*?)background:#c9941a(;)/, (m, a, b) => { bump('copybtn'); return a + 'background:#8a6712' + b; });
    h = h.replace(/(<div class="pdp-img-side">\s*<img )((?:(?!fetchpriority)[^>])*?loading="eager")/, (m, a, b) => { bump('fetchpriority'); return a + 'fetchpriority="high" ' + b; });
  }
  // 4. skipped heading level: bottle-profile "Recognition" h3 follows the H1 directly
  h = h.replace(/<h3 (style="font-size:15px;margin:18px 0 6px;">Recognition)<\/h3>/g, (m, a) => { bump('recognition'); return `<h2 ${a}</h2>`; });
  if (h !== o) { bump('files'); if (!DRY) fs.writeFileSync(f, h); }
}
// shared CSS: skip link white-on-gold
const css = 'assets/css/style.css'; let c = fs.readFileSync(css, 'utf8');
const c2 = c.replace(/(\.skip-link\{[^}]*?)background:#c9941a;color:#fff/, (m, a) => { bump('skiplink'); return a + 'background:#7a5800;color:#fff'; });
if (c2 !== c && !DRY) fs.writeFileSync(css, c2);
// tool template: keep the generator consistent
const t = 'tools/apply-bottle-profiles.mjs'; let ts = fs.readFileSync(t, 'utf8');
const t2 = ts.replace('<h3 style="font-size:15px;margin:18px 0 6px;">Recognition</h3>', '<h2 style="font-size:15px;margin:18px 0 6px;">Recognition</h2>');
if (t2 !== ts && !DRY) { fs.writeFileSync(t, t2); bump('tool'); }
console.log(files.length, 'html files scanned', JSON.stringify(stats));
