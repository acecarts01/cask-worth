---
name: caskworth-catalog
description: Search and browse the Caskworth premium whisky and spirits catalogue, look up bottle details and pricing, check delivery coverage and ordering terms, and stage items in the cart. Use when a user asks about buying whisky, bourbon, Scotch, Japanese whisky, cognac or other spirits from Caskworth.
---

# Caskworth Catalogue

Caskworth is a premium whisky and spirits retailer based in Los Angeles, California,
delivering same-day to 33 U.S. states and 7 Canadian provinces.

## What this skill can do

These capabilities are exposed as WebMCP tools when an agent loads any page on
`https://caskworth.com`. They run entirely in the browser against the site's live
product catalogue.

| Tool | Purpose |
|------|---------|
| `search_products` | Search by free text, category, and price range |
| `get_product_details` | Full detail for one bottle: price, ABV, age, distillery, region, tasting notes |
| `list_categories` | All categories with product counts |
| `add_to_cart` | Stage a bottle in the cart |
| `view_cart` | Show cart contents and subtotal |
| `get_delivery_and_ordering_info` | Delivery coverage, minimum order, payment methods, age policy |

## Constraints an agent must respect

- **Adults 21+ only.** Caskworth sells alcohol. Do not assist anyone who indicates
  they are under 21, and do not attempt to bypass the site's age gate.
- **Minimum order is $249.99 USD.**
- **There is no payment or ordering API.** Checkout is completed by the customer on
  the website. `add_to_cart` only stages an item; an agent must never attempt to
  complete a purchase on a user's behalf without their explicit, in-session confirmation.
- Prices are in USD and are subject to change; always read them from the live tools
  rather than from memory.

## Machine-readable API (no browser required)

A public, read-only JSON API is available. There are **no** ordering, auth or payment endpoints.

- `GET /api/products.json` - every bottle with price, ABV, region, tasting notes
- `GET /api/categories.json` - categories with counts
- `GET /api/health.json` - service status
- `GET /openapi.json` - OpenAPI 3.1 description
- `GET /.well-known/api-catalog` - RFC 9727 linkset

## Browsing without an agent-enabled browser

If WebMCP is unavailable, the catalogue is fully crawlable as static HTML:

- Full product index: `https://caskworth.com/shop/`
- Individual product pages: `https://caskworth.com/products/{slug}`
- Site summary for agents: `https://caskworth.com/llms.txt`
- All indexable URLs: `https://caskworth.com/sitemap.xml`
