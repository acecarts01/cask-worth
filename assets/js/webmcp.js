/* ─────────────────────────────────────────────────────────────
   Caskworth — WebMCP (Web Model Context Protocol)
   Exposes the real, client-side capabilities of this site to AI
   agents running in the browser (e.g. Claude in Chrome).

   Every tool below operates on the live product catalog and cart
   that already power the site. No tool advertises a capability
   the site does not actually have.

   Spec: https://webmachinelearning.github.io/webmcp/
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (typeof navigator === 'undefined') return;

  /* ── Catalog access ──────────────────────────────────────── */
  function allProducts() {
    var out = [];
    ['PRODUCTS', 'NEW_PRODUCTS', 'ULTRA_PRODUCTS', 'MORE_PRODUCTS'].forEach(function (k) {
      var arr = window[k];
      if (Array.isArray(arr)) out = out.concat(arr);
    });
    return out;
  }

  function slugFor(p) {
    if (typeof window.makeProductSlug === 'function') {
      try { return window.makeProductSlug(p.name); } catch (e) { /* fall through */ }
    }
    return String(p.name || '')
      .toLowerCase()
      .replace(/['’‘`]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function shape(p) {
    return {
      name: p.name,
      category: p.cat,
      subcategory: p.sub || null,
      distillery: p.dist || null,
      region: p.region || null,
      age: p.age || null,
      abv: typeof p.abv === 'number' ? p.abv : null,
      price_usd: p.price,
      tasting_notes: Array.isArray(p.tasting) ? p.tasting : [],
      description: p.desc || null,
      url: 'https://caskworth.com/products/' + slugFor(p),
      image: p.img ? 'https://caskworth.com' + p.img : null
    };
  }

  function ok(data) { return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }; }
  function err(msg) { return { content: [{ type: 'text', text: msg }], isError: true }; }

  /* ── Tool definitions ────────────────────────────────────── */
  var tools = [
    {
      name: 'search_products',
      description:
        'Search the Caskworth catalogue of premium whisky and spirits. Filter by free-text query ' +
        '(matches name, distillery, region, category and tasting notes), by category, and by price range. ' +
        'Returns matching bottles with price, tasting notes and a product URL.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text search, e.g. "peated Islay", "Pappy", "sherry cask".' },
          category: {
            type: 'string',
            description: 'Restrict to one category.',
            enum: ['Bourbon', 'Scotch', 'Japanese', 'Irish', 'Rye', 'Canadian', 'Allocated', 'Cognac', 'Brandy', 'Gifts', 'Whiskey']
          },
          min_price_usd: { type: 'number', description: 'Minimum price in USD.' },
          max_price_usd: { type: 'number', description: 'Maximum price in USD.' },
          limit: { type: 'number', description: 'Max results to return (default 10, max 50).' }
        }
      },
      async execute(args) {
        args = args || {};
        var items = allProducts();
        var q = (args.query || '').toLowerCase().trim();

        if (args.category) {
          items = items.filter(function (p) {
            return String(p.cat || '').toLowerCase() === String(args.category).toLowerCase();
          });
        }
        if (typeof args.min_price_usd === 'number') {
          items = items.filter(function (p) { return p.price >= args.min_price_usd; });
        }
        if (typeof args.max_price_usd === 'number') {
          items = items.filter(function (p) { return p.price <= args.max_price_usd; });
        }
        if (q) {
          items = items.filter(function (p) {
            var hay = [p.name, p.cat, p.sub, p.dist, p.region, p.age, p.desc]
              .concat(Array.isArray(p.tasting) ? p.tasting : [])
              .join(' ')
              .toLowerCase();
            return q.split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; });
          });
        }

        var limit = Math.min(Math.max(parseInt(args.limit, 10) || 10, 1), 50);
        var results = items.slice(0, limit).map(shape);

        return ok({
          total_matches: items.length,
          returned: results.length,
          minimum_order_usd: 249.99,
          results: results
        });
      }
    },

    {
      name: 'get_product_details',
      description:
        'Get full details for one bottle by exact or partial name — price, ABV, age, distillery, ' +
        'region, tasting notes, description and product URL.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name, e.g. "Macallan 18 Double Cask".' }
        },
        required: ['name']
      },
      async execute(args) {
        var n = String((args && args.name) || '').toLowerCase().trim();
        if (!n) return err('A product name is required.');
        var items = allProducts();
        var hit = items.find(function (p) { return String(p.name).toLowerCase() === n; }) ||
                  items.find(function (p) { return String(p.name).toLowerCase().indexOf(n) !== -1; });
        if (!hit) return err('No product found matching "' + args.name + '". Try search_products first.');
        return ok(shape(hit));
      }
    },

    {
      name: 'list_categories',
      description: 'List every product category Caskworth stocks, with how many bottles are in each.',
      inputSchema: { type: 'object', properties: {} },
      async execute() {
        var counts = {};
        allProducts().forEach(function (p) {
          var c = p.cat || 'Other';
          counts[c] = (counts[c] || 0) + 1;
        });
        var cats = Object.keys(counts).sort().map(function (c) {
          return { category: c, product_count: counts[c], url: 'https://caskworth.com/shop/?cat=' + c.toLowerCase() };
        });
        return ok({ total_products: allProducts().length, categories: cats });
      }
    },

    {
      name: 'add_to_cart',
      description:
        'Add a bottle to the shopping cart on this page by name. Requires user-visible confirmation ' +
        'before checkout; this only stages the item in the cart.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact or partial product name.' },
          quantity: { type: 'number', description: 'Quantity to add (default 1).' }
        },
        required: ['name']
      },
      async execute(args) {
        if (typeof window.addToCart !== 'function') {
          return err('The cart is not available on this page.');
        }
        var n = String((args && args.name) || '').toLowerCase().trim();
        var items = allProducts();
        var hit = items.find(function (p) { return String(p.name).toLowerCase() === n; }) ||
                  items.find(function (p) { return String(p.name).toLowerCase().indexOf(n) !== -1; });
        if (!hit) return err('No product found matching "' + args.name + '".');

        var qty = Math.max(parseInt((args && args.quantity), 10) || 1, 1);
        for (var i = 0; i < qty; i++) window.addToCart(hit.id, 1);

        return ok({
          added: hit.name,
          quantity: qty,
          unit_price_usd: hit.price,
          line_total_usd: +(hit.price * qty).toFixed(2),
          minimum_order_usd: 249.99,
          note: 'Item staged in the cart. The customer must review and complete checkout themselves.'
        });
      }
    },

    {
      name: 'view_cart',
      description: 'Show what is currently in the cart on this page, with the subtotal.',
      inputSchema: { type: 'object', properties: {} },
      async execute() {
        var raw;
        try { raw = JSON.parse(localStorage.getItem('cw_cart') || '[]'); }
        catch (e) { raw = []; }
        if (!Array.isArray(raw) || !raw.length) {
          return ok({ items: [], subtotal_usd: 0, minimum_order_usd: 249.99, note: 'The cart is empty.' });
        }
        var items = allProducts();
        var lines = raw.map(function (c) {
          var p = items.find(function (x) { return String(x.id) === String(c.id); });
          return {
            name: p ? p.name : String(c.id),
            quantity: c.qty || 1,
            unit_price_usd: p ? p.price : null,
            line_total_usd: p ? +(p.price * (c.qty || 1)).toFixed(2) : null
          };
        });
        var subtotal = lines.reduce(function (s, l) { return s + (l.line_total_usd || 0); }, 0);
        return ok({
          items: lines,
          subtotal_usd: +subtotal.toFixed(2),
          minimum_order_usd: 249.99,
          meets_minimum: subtotal >= 249.99
        });
      }
    },

    {
      name: 'get_delivery_and_ordering_info',
      description:
        'Get Caskworth delivery coverage, minimum order value, accepted payment methods and age policy. ' +
        'Use this to answer questions about whether and how a customer can order.',
      inputSchema: { type: 'object', properties: {} },
      async execute() {
        return ok({
          same_day_delivery: {
            united_states: '33 states',
            canada: '7 provinces'
          },
          minimum_order_usd: 249.99,
          currency: 'USD',
          payment_methods: ['Cryptocurrency', 'PayPal', 'Apple Pay'],
          age_restriction: 'Adults 21+ only. An age gate must be accepted before browsing.',
          contact: { email: 'info@caskworth.com', telephone: '+1-448-234-8667' },
          based_in: 'Los Angeles, California, USA',
          how_to_order_url: 'https://caskworth.com/how-to-order/',
          shipping_policy_url: 'https://caskworth.com/shipping-policy/',
          note: 'Checkout is completed by the customer on the site. There is no programmatic payment API.'
        });
      }
    }
  ];

  /* ── Register with the agent ─────────────────────────────── */
  // Expose the tool definitions so agents/auditors can detect them even if
  // the WebMCP API is injected after this script runs.
  window.__WEBMCP_TOOLS__ = tools;

  var registered = false;
  function register() {
    if (registered) return true;
    var mc = navigator.modelContext;
    if (!mc || typeof mc.provideContext !== 'function') return false;
    try {
      mc.provideContext({ tools: tools });
      registered = true;
      window.dispatchEvent(new CustomEvent('webmcp:registered', {
        detail: { count: tools.length }
      }));
      return true;
    } catch (e) {
      if (window.console && console.debug) console.debug('WebMCP registration failed:', e);
      return false;
    }
  }

  // Try immediately.
  if (!register()) {
    // Try again once the DOM is ready.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', register);
    }
    // And poll briefly, in case the agent injects navigator.modelContext late.
    var tries = 0;
    var timer = setInterval(function () {
      if (register() || ++tries > 40) clearInterval(timer); // ~10s max
    }, 250);
  }
})();
