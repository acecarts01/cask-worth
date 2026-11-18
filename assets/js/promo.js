/* Caskworth Christmas & New Year sale: 15% off every bottle until 20 Feb 2027 (end of day, Pacific time).
   Classic script, loaded with `defer` AFTER app.js. After the end date every decoration removes itself
   and prices revert to the list price. Prices in the cart stay at LIST price; the 15% is applied as a
   separate discount line (cart drawer + checkout), so the $249.99 minimum and the $900 free-delivery
   threshold keep using the list subtotal. */
(function () {
  'use strict';
  var RATE = 0.15;
  var END = Date.parse('2027-02-21T08:00:00Z'); /* 23:59:59 Pacific on 20 Feb 2027 */
  function active() { return Date.now() < END; }
  var money = function (n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var sale = function (p) { return Math.round(p * (1 - RATE) * 100) / 100; };
  window.CW_PROMO = { rate: RATE, end: END, active: active, sale: sale, amount: function (sub) { return active() ? Math.round(sub * RATE * 100) / 100 : 0; } };

  var n = 0;
  function seal(size, extra) {
    var id = 'ps' + (++n);
    var ring = 'CHRISTMAS &amp; NEW YEAR SALE ✦ UP TO 20 FEB ✦ CHRISTMAS &amp; NEW YEAR SALE ✦ ';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Christmas and New Year sale: 15 percent off everything until 20 February">' +
      '<defs>' +
      '<radialGradient id="' + id + 'r" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="#ff5d5d"/><stop offset=".55" stop-color="#c1121f"/><stop offset="1" stop-color="#6e0813"/></radialGradient>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#f0c020"/><stop offset="1" stop-color="#a87408"/></linearGradient>' +
      '<path id="' + id + 'p" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/>' +
      '</defs>' +
      '<g class="ps-spin2"><circle cx="100" cy="100" r="98" fill="none" stroke="url(#' + id + 'g)" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/></g>' +
      '<g class="ps-spin"><path fill="url(#' + id + 'g)" d="' + scallop(100, 100, 94, 88, 28) + '"/></g>' +
      '<circle cx="100" cy="100" r="82" fill="url(#' + id + 'r)" stroke="url(#' + id + 'g)" stroke-width="3"/>' +
      '<circle cx="100" cy="100" r="62" fill="none" stroke="rgba(255,243,176,.55)" stroke-width="1.4"/>' +
      '<g class="ps-spin"><text font-family="Inter,Arial,sans-serif" font-size="11.2" font-weight="800" letter-spacing="1.6" fill="#fff3b0"><textPath href="#' + id + 'p" startOffset="0">' + ring + '</textPath></text></g>' +
      '<text x="100" y="116" text-anchor="middle" font-family="Georgia,serif" font-size="56" font-weight="700" fill="url(#' + id + 'g)" stroke="#5a0a10" stroke-width="1.2" paint-order="stroke">15%</text>' +
      '<text x="100" y="136" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="800" letter-spacing="5" fill="#fff">OFF</text>' +
      '<text x="100" y="154" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="9.2" font-weight="700" letter-spacing="1.6" fill="#fff3b0">EVERYTHING · TILL 20 FEB</text>' +
      '<g><path d="M82 70c8-14 20-14 26 0-8 8-18 8-26 0z" fill="#16a34a" stroke="#0f5b3b" stroke-width="1.2"/><path d="M96 66c10-12 24-8 26 6-10 6-20 4-26-6z" fill="#22c55e" stroke="#0f5b3b" stroke-width="1.2"/><circle cx="96" cy="70" r="4.6" fill="#e11d2e" stroke="#7a0a14" stroke-width="1"/><circle cx="104" cy="73" r="3.8" fill="#e11d2e" stroke="#7a0a14" stroke-width="1"/></g>' +
      spark(26, 40, 'a') + spark(176, 52, 'b') + spark(168, 164, 'c') + spark(30, 158, 'd') +
      '<ellipse class="ps-glint" cx="72" cy="58" rx="22" ry="9" fill="#fff" opacity="0" transform="rotate(-28 72 58)"/>' +
      '</svg>';
  }
  function spark(x, y, k) { return '<path class="ps-tw ' + k + '" d="M' + x + ' ' + (y - 9) + 'l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z" fill="#fff6c2"/>'; }
  function scallop(cx, cy, r1, r2, k) {
    var d = '', i, a1, a2, am;
    for (i = 0; i < k; i++) {
      a1 = (i / k) * 2 * Math.PI; am = ((i + 0.5) / k) * 2 * Math.PI; a2 = ((i + 1) / k) * 2 * Math.PI;
      d += (i ? 'L' : 'M') + (cx + r2 * Math.cos(a1)).toFixed(1) + ' ' + (cy + r2 * Math.sin(a1)).toFixed(1) +
        'L' + (cx + r1 * Math.cos(am)).toFixed(1) + ' ' + (cy + r1 * Math.sin(am)).toFixed(1);
    }
    return d + 'Z';
  }
  window.CW_PROMO.sealSVG = seal;

  function teardown() {
    [].forEach.call(document.querySelectorAll('#promo-strip,#promo-float,#promo-snow,.promo-seal,.promo-ribbon,.promo-chip,.pdp-promo-note,.promo-row'), function (e) { e.remove(); });
    [].forEach.call(document.querySelectorAll('.promo-was'), function (w) { var p = w.parentNode; if (p) { p.textContent = w.getAttribute('data-was') || w.textContent; } });
  }

  function parsePrice(t) { var m = /\$\s*([\d,]+(?:\.\d+)?)/.exec(t || ''); return m ? parseFloat(m[1].replace(/,/g, '')) : NaN; }
  function fmtLike(orig, v) { return /\./.test(orig) ? money(v) : '$' + Math.round(v).toLocaleString('en-US'); }

  function decorate(root) {
    root = root || document;
    [].forEach.call(root.querySelectorAll('.pc-price'), function (el) {
      if (el.querySelector('.promo-was')) return;
      var t = el.textContent.trim(), p = parsePrice(t); if (isNaN(p)) return;
      el.innerHTML = '<s class="promo-was" data-was="' + t + '">' + t + '</s><span class="promo-now">' + fmtLike(t, sale(p)) + '</span>';
      var wrap = el.closest ? el.closest('.pc') : null; wrap = wrap && wrap.querySelector('.pc-img-wrap');
      if (wrap && !wrap.querySelector('.promo-ribbon')) { var r = document.createElement('span'); r.className = 'promo-ribbon'; r.innerHTML = '<i>✳</i>−15%'; wrap.appendChild(r); }
    });
    [].forEach.call(root.querySelectorAll('.pc-crypto'), function (el) {
      if (el.getAttribute('data-px')) return; var m = /\$([\d,]+(?:\.\d+)?)\s*with crypto/.exec(el.textContent); if (!m) return;
      var v = parseFloat(m[1].replace(/,/g, '')) * (1 - RATE); el.setAttribute('data-px', '1');
      el.innerHTML = '&#127881; <span class="promo-x">' + fmtLike(m[1], v) + '</span> with crypto';
    });
    [].forEach.call(root.querySelectorAll('.pdp-price'), function (el) {
      if (el.querySelector('.promo-was')) return;
      var t = el.textContent.trim(), p = parsePrice(t); if (isNaN(p)) return;
      el.innerHTML = '<s class="promo-was" data-was="' + t + '">' + t + '</s><span class="promo-now">' + money(sale(p)) + '</span><span class="promo-chip">−15%</span>';
      if (!el.nextElementSibling || !el.nextElementSibling.classList.contains('pdp-promo-note')) { var n2 = document.createElement('div'); n2.className = 'pdp-promo-note'; n2.innerHTML = '🎄 <b>Christmas &amp; New Year offer:</b> you save ' + money(p - sale(p)) + ' &middot; ends 20 Feb 2027'; el.parentNode.insertBefore(n2, el.nextSibling); }
    });
    var qv = root.querySelector && root.querySelector('#qv-price');
    if (qv && !qv.querySelector('.promo-was')) { var qt = qv.textContent.trim(), qp = parsePrice(qt); if (!isNaN(qp)) qv.innerHTML = '<s class="promo-was" data-was="' + qt + '">' + qt + '</s><span class="promo-now">' + fmtLike(qt, sale(qp)) + '</span>'; }
  }

  function countdown() {
    var ms = END - Date.now(); if (ms <= 0) { teardown(); return; }
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    var txt = d + 'd ' + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
    [].forEach.call(document.querySelectorAll('.ps-count'), function (e) { e.textContent = txt; });
    [].forEach.call(document.querySelectorAll('[data-cd]'), function (e) { var k = e.getAttribute('data-cd'); e.textContent = k === 'd' ? d : k === 'h' ? String(h).padStart(2, '0') : k === 'm' ? String(m).padStart(2, '0') : String(s).padStart(2, '0'); });
  }

  function snow() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = document.createElement('div'); box.id = 'promo-snow'; box.setAttribute('aria-hidden', 'true');
    var count = window.innerWidth < 600 ? 10 : 22, glyphs = ['❄', '❅', '❆', '•'], i, f;
    for (i = 0; i < count; i++) {
      f = document.createElement('i'); f.textContent = glyphs[i % glyphs.length];
      f.style.left = (Math.random() * 100).toFixed(1) + '%'; f.style.fontSize = (10 + Math.random() * 14).toFixed(0) + 'px';
      f.style.animationDuration = (9 + Math.random() * 12).toFixed(1) + 's'; f.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's';
      f.style.setProperty('--dx', (Math.random() * 80 - 40).toFixed(0) + 'px'); f.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
      box.appendChild(f);
    }
    document.body.appendChild(box);
  }

  function floatSeal() {
    if (document.getElementById('promo-float') || /^\/(checkout|admin|whiskey-sale)\//.test(location.pathname)) return;
    try { if (sessionStorage.getItem('px_float_x') === '1') return; } catch (e) {}
    var w = document.createElement('div'); w.id = 'promo-float';
    w.innerHTML = '<a class="promo-seal" href="/whiskey-sale/" aria-label="Christmas and New Year sale, 15 percent off">' + seal() + '</a><button class="pf-x" type="button" aria-label="Hide sale badge">×</button>';
    w.querySelector('.pf-x').addEventListener('click', function () { w.remove(); try { sessionStorage.setItem('px_float_x', '1'); } catch (e) {} });
    document.body.appendChild(w);
  }

  function heroSeal() {
    var hero = document.querySelector('.hero-slider, .hero, #hero, .hero-section'); if (!hero || hero.querySelector('.promo-seal-hero')) return;
    if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    var a = document.createElement('a'); a.className = 'promo-seal promo-seal-hero'; a.href = '/whiskey-sale/'; a.setAttribute('aria-label', 'Christmas and New Year sale, 15 percent off'); a.innerHTML = seal();
    hero.appendChild(a);
  }

  function stripSparkle() {
    var s = document.getElementById('promo-strip'); if (!s || s.querySelector('.ps-tw')) return;
    ['a', 'b', 'c', 'd'].forEach(function (k) { var t = document.createElement('span'); t.className = 'ps-tw ' + k; t.textContent = '✦'; t.setAttribute('aria-hidden', 'true'); s.appendChild(t); });
  }

  /* ---- cart drawer: add the offer as a separate discount line ---- */
  function wrapCart() {
    var orig = window.updateCartUI; if (typeof orig !== 'function' || orig.__px) return;
    var w = function () {
      var r = orig.apply(this, arguments);
      try {
        if (!active() || typeof getSubtotal !== 'function') return r;
        var sub = getSubtotal(), ft = document.querySelector('#cart-foot .cart-ft'); if (!ft) return r;
        var promo = CW_PROMO.amount(sub), row = ft.querySelector('.promo-row');
        if (promo <= 0) { if (row) row.remove(); return r; }
        if (!row) { row = document.createElement('div'); row.className = 'cart-row promo-row'; var base = ft.querySelector('.cart-row'); if (base && base.parentNode) base.parentNode.insertBefore(row, base.nextSibling); else ft.insertBefore(row, ft.firstChild); }
        row.innerHTML = '<span>🎄 Christmas &amp; New Year offer (15% off)</span><span>−' + money(promo) + '</span>';
        var tot = document.getElementById('cart-total-disp'); if (tot) tot.textContent = money(sub - promo);
      } catch (e) {}
      return r;
    };
    w.__px = true; window.updateCartUI = w;
  }

  function init() {
    if (!active()) { teardown(); return; }
    [].forEach.call(document.querySelectorAll('.promo-seal-static'), function (el) { el.innerHTML = seal(); }); decorate(document); countdown(); stripSparkle(); snow(); floatSeal(); heroSeal(); wrapCart();
    try { if (typeof updateCartUI === 'function') updateCartUI(); } catch (e) {}
    var pending = false, mo = new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; decorate(document); }); });
    mo.observe(document.body, { childList: true, subtree: true });
    setInterval(countdown, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
