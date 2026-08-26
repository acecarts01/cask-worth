# Products to Stock — Competitor Gap Analysis (Maximum Scope)

**Built:** 2026-08-26 · **Method:** every candidate verified absent against the live `PRODUCTS` array (`assets/js/app.source.js`, 425 SKUs) — not just checked against category-page text, which can drift (see `docs/PROJECT.md` "Static/live category sync"). Researched against real competitor catalogs (Total Wine, Caskers, ReserveBar, The Whisky Exchange, Wooden Cork, Flaviar) and 2026 industry rankings (VinePair, Robb Report, Men's Journal, Wine-Searcher, Bourbon Inspector). Ranked by a mix of mainstream search volume (global blend giants like Ballantine's) and enthusiast/collector demand (craft and allocated names).

Every product carries 1 Primary + 5 Secondary keyword, ready to paste into `<title>` and `<meta name="keywords">` the moment it's added to `products/` — no research delay when you actually stock it.

## Files

| File | Category | Candidates |
|---|---|---|
| `scotch.md` | Scotch Whisky | 25 |
| `bourbon.md` | Bourbon & American Whiskey | 22 |
| `allocated.md` | Rare & Allocated | 10 |
| `japanese.md` | Japanese Whisky | 10 |
| `irish.md` | Irish Whiskey | 12 |
| `rye.md` | Rye Whiskey | 12 |
| `canadian.md` | Canadian Whisky | 10 |
| `cognac.md` | Cognac | 12 |
| `brandy-armagnac.md` | Brandy, Armagnac & Calvados | 12 |
| `gift-sets.md` | Gift Sets (bundle concepts, not brands) | 8 |
| **Total** | | **133 candidates** |

## How to use this

1. When you decide to stock something from these lists, add it to `assets/js/app.source.js`'s `PRODUCTS` array with the right `cat`/`tag`, and create its `products/{slug}.html` page.
2. Copy the Primary keyword into that page's `<title>` and H1.
3. Copy the 5 Secondary keywords into `<meta name="keywords">`, following the exact template already live on every other product page: `buy {product} online, {product} for sale, {product} delivery usa, {product} price $X, buy {product} {category} online, {category} buy online`.
4. If it's a brand-new category leader (e.g. first Irish peated whiskey with Connemara), consider whether it changes any category-page copy in `shop/{category}/index.html` or the `keyword-map.md` category Secondary set.
5. Update `sitemap.xml` and the relevant `shop/{category}/index.html` static product list (see the generator pattern in `docs/PROJECT.md`).

## Relationship to other docs
- `docs/product-to-stock.md` — a smaller, earlier list covering **missing expressions of brands you already carry** (Tier 1, e.g. Macallan 15) plus one confirmed brand-absent item (Ballantine's, also listed here). That file stays scoped to what the original Semrush export surfaced; this folder is the comprehensive follow-up covering every category at maximum depth.
- `docs/keyword-map.md` §4 (Phase 2) — keyword research for brands **already carried** but lacking Semrush data. Do not confuse with this folder, which is exclusively brands **not carried at all**.
