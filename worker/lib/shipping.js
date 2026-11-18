// Delivery fee helper. Checkout charges a flat $24.35 delivery fee (FedEx One Rate medium box) on
// orders with a subtotal of $900 or less; orders over $900 ship free. The fee is not stored in its own
// column, so it is derived from the stored strings: shipping = total - (subtotal - discount).
export const SHIPPING_FLAT = 24.35;
export const SHIPPING_FREE_OVER = 900;
const money = (s) => { const m = String(s == null ? '' : s).replace(/,/g, '').match(/-?\$?\s*(-?\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : NaN; };
export function shippingText(order) {
  const sub = money(order.subtotal);
  const disc = Math.abs(money(order.discount)) || 0;
  const total = money(order.total);
  if (Number.isNaN(sub) || Number.isNaN(total)) return 'See total';
  const ship = Math.round((total - (sub - disc)) * 100) / 100;
  return ship > 0.004 ? '$' + ship.toFixed(2) + ' USD' : 'FREE';
}
