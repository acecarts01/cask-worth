/* Catalogue consolidated into the single PRODUCTS array in app.source.js — see
   new_products.source.js for why. This file's 70 ultra-rare entries were also being
   force-merged into NEW_PRODUCTS via .push(...ULTRA_PRODUCTS) below, on top of being
   concatenated a second time in shop/index.html's ALL_PRODUCTS(), so each one was
   appearing in the shop grid up to 3 times. */
const ULTRA_PRODUCTS = [];
if (typeof NEW_PRODUCTS !== 'undefined') NEW_PRODUCTS.push(...ULTRA_PRODUCTS);
