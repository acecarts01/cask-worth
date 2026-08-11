/* Catalogue consolidated into the single PRODUCTS array in app.source.js, generated
   directly from api/products.json (the site's one source of truth for product data).
   This file is kept only so ALL_PRODUCTS()'s `typeof NEW_PRODUCTS !== 'undefined'`
   check still passes — it used to duplicate ~310 products already present in PRODUCTS,
   which was quietly showing the same bottle 2-3x in the shop grid. */
const NEW_PRODUCTS = [];
