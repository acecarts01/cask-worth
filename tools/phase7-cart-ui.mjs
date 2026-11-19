// Phase 7: every page that loads app.js must have the cart overlay, cart drawer and toast, so "Add to Cart" always gives visible feedback
// (product pages shipped with only the header badge). Also adds accessible names / a live region. Idempotent. usage: node tools/phase7-cart-ui.mjs [--dry]
import fs from 'fs';
import { execSync } from 'child_process';
const DRY = process.argv.includes('--dry');
const files = execSync('git ls-files "*.html"', { maxBuffer: 1 << 26 }).toString().split('\n').filter(f => f && !/^(Reviews Folder|Products to Stock|New |new |backlink|node_modules)/.test(f));
const stats = {}; const bump = k => { stats[k] = (stats[k] || 0) + 1; };
const DRAWER = eol => [
  '<div id="cart-overlay"></div>',
  '<div id="cart-drawer" role="dialog" aria-label="Shopping cart">',
  '  <div class="cart-hd"><div class="cart-title">Your Cart</div><button class="cart-x" onclick="toggleCart()" aria-label="Close cart">×</button></div>',
  '  <div class="cart-body" id="cart-body"></div>',
  '  <div id="cart-foot" style="display:none;">',
  '    <div class="cart-ft">',
  '      <div id="cart-warn"></div>',
  '      <div class="cart-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>',
  '      <div class="cart-total-row"><span>Total</span><span id="cart-total-disp">$0.00</span></div>',
  '      <div class="min-warn" style="margin-top:10px;">Minimum order: <strong>$249.99 USD</strong></div>',
  '      <button class="btn btn-gold btn-full" id="cart-co-btn" onclick="goCheckout()" style="margin-top:12px;">Checkout</button>',
  '    </div>',
  '  </div>',
  '</div>',
].join(eol);
const TOAST = '<div id="toast" role="status" aria-live="polite"></div>';
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8'); const o = h;
  if (!/\/assets\/js\/app\.js/.test(h)) continue;
  const eol = h.includes('\r\n') ? '\r\n' : '\n';
  const hasOv = /id="cart-overlay"/.test(h), hasDr = /id="cart-drawer"/.test(h), hasToast = /id="toast"/.test(h);
  // insertion point: right before the footer comment/element, else before </body>
  const place = (block) => {
    if (h.includes('<!-- Footer -->')) h = h.replace('<!-- Footer -->', () => block + eol + eol + '<!-- Footer -->');
    else if (/<footer/.test(h)) h = h.replace(/<footer/, m => block + eol + m);
    else h = h.replace('</body>', () => block + eol + '</body>');
  };
  if (!hasOv && !hasDr) { place(DRAWER(eol) + eol + (hasToast ? '' : TOAST)); bump('drawer+overlay'); if (!hasToast) bump('toast'); }
  else if (!hasToast) { place(TOAST); bump('toast'); }
  // accessibility of the existing markup
  h = h.replace('<div id="toast"></div>', () => { bump('toast-live'); return TOAST; });
  h = h.replace('<div id="cart-drawer">', () => { bump('drawer-role'); return '<div id="cart-drawer" role="dialog" aria-label="Shopping cart">'; });
  h = h.replace(/<button class="cart-x" onclick="toggleCart\(\)">×<\/button>/g, () => { bump('close-label'); return '<button class="cart-x" onclick="toggleCart()" aria-label="Close cart">×</button>'; });
  if (h !== o) { bump('files'); if (!DRY) fs.writeFileSync(f, h); }
}
console.log(JSON.stringify(stats));
