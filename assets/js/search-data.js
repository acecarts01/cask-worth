// Import products from global scope if available, otherwise we define a subset or wait for app.js
// Since this is vanilla JS, we'll assume PRODUCTS is available globally after app.js loads.

export const BLOG_POSTS = [
  { title: "Best Bourbon 2025", url: "/blog/best-bourbon-2025/", type: "blog" },
  { title: "Macallan 12 vs 18", url: "/blog/macallan-12-vs-18/", type: "blog" },
  { title: "Pappy Van Winkle Guide", url: "/blog/pappy-van-winkle-guide/", type: "blog" },
  { title: "Hibiki Harmony Buy", url: "/blog/hibiki-harmony-buy/", type: "blog" },
  { title: "What is Allocated Bourbon?", url: "/blog/what-is-allocated-bourbon/", type: "blog" },
  { title: "Bourbon vs Rye vs Scotch", url: "/blog/bourbon-vs-rye-vs-scotch/", type: "blog" },
  { title: "How to Store Whiskey at Home", url: "/blog/how-to-store-whiskey-at-home/", type: "blog" }
];

export function getSearchItems() {
  // Access global PRODUCTS defined in app.js (non-module script)
  const productsSource = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : null);
  
  const products = productsSource ? productsSource.map(p => ({
    title: p.name,
    url: `/products/${p.id}/`,
    type: "product",
    category: p.cat
  })) : [];

  return [...products, ...BLOG_POSTS];
}
