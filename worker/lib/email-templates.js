// Luxury-branded HTML email templates, built from the site's real design tokens
// (assets/css/style.css :root) rather than generic styling:
//   --dark:#1c1c1e   --gold:#c9941a   --gold2:#e8a820
//   near-black gradient family used sitewide: #0d0a04 / #1a0d03 / #2a1a06
//   headings: 'Playfair Display', Georgia, serif   body: 'Inter', system-ui, sans-serif

import { WALLETS } from './wallets.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function itemsRows(itemsStr) {
  return esc(itemsStr)
    .split(' | ')
    .filter(Boolean)
    .map((line) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee3d0;color:#2d2d2d;font-size:14px;font-family:'Inter',Arial,sans-serif;">${line}</td></tr>`)
    .join('');
}

// Real payment instructions for whichever method the customer chose at checkout --
// never fabricated, mirrors checkout/index.html's payment-option copy exactly.
export function paymentInstructionsHtml(order) {
  const method = (order.payment || '').toUpperCase();

  if (method === 'CRYPTO') {
    const wallet = WALLETS[order.wallet_key] || WALLETS['usdt-eth'];
    return `
      <div style="background:#fdf6e8;border:1px solid rgba(201,148,26,.3);border-radius:14px;padding:20px 24px;margin-top:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#8a6712;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;">Payment &mdash; Cryptocurrency (10% discount applied)</p>
        <p style="margin:0 0 4px;font-size:13px;color:#444;font-family:'Inter',Arial,sans-serif;">${esc(wallet.label)} address:</p>
        <p style="margin:0;font-size:14px;font-family:monospace;color:#1c1c1e;word-break:break-all;background:#fff;border:1px solid #e8e0d4;border-radius:8px;padding:10px 12px;">${esc(wallet.addr)}</p>
        <p style="margin:10px 0 0;font-size:12px;color:#8a6712;">Please include your order reference (${esc(order.ref)}) in the transaction memo, and allow a short delay for network confirmation.</p>
      </div>`;
  }
  if (method === 'PAYPAL') {
    return `
      <div style="background:#f0f7ff;border:1px solid #b3d4f5;border-radius:14px;padding:20px 24px;margin-top:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1c4a7a;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;">Payment &mdash; PayPal</p>
        <p style="margin:0;font-size:13px;color:#444;font-family:'Inter',Arial,sans-serif;">A PayPal invoice for this order will be sent to your email address shortly &mdash; no PayPal account required to pay it.</p>
      </div>`;
  }
  if (method === 'APPLEPAY') {
    return `
      <div style="background:#f5f5f5;border:1px solid #ddd;border-radius:14px;padding:20px 24px;margin-top:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1c1c1e;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;">Payment &mdash; Apple Pay</p>
        <p style="margin:0;font-size:13px;color:#444;font-family:'Inter',Arial,sans-serif;">A secure Apple Pay payment link will follow by email or WhatsApp.</p>
      </div>`;
  }
  return `
    <div style="background:#f0fff5;border:1px solid #86efac;border-radius:14px;padding:20px 24px;margin-top:20px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#15803d;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;">Payment &mdash; Chime / Zelle</p>
      <p style="margin:0;font-size:13px;color:#444;font-family:'Inter',Arial,sans-serif;">Bank transfer details will follow by WhatsApp or email.</p>
    </div>`;
}

function emailShell({ eyebrow, heading, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f0ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#2a1a06,#0d0a04);padding:36px 40px;text-align:center;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:700;color:#f0c020;letter-spacing:.03em;">CASKWORTH</div>
            <div style="font-family:'Inter',Arial,sans-serif;font-size:10px;color:rgba(255,255,255,.55);letter-spacing:.15em;text-transform:uppercase;margin-top:6px;">Premium Whisky &amp; Spirits</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${eyebrow ? `<div style="font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:700;color:#8a6712;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">${esc(eyebrow)}</div>` : ''}
            <h1 style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#1c1c1e;">${esc(heading)}</h1>
            ${bodyHtml}
            ${ctaUrl ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr><td style="border-radius:10px;background:linear-gradient(135deg,#e8a820,#c9941a);">
                <a href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#1c1c1e;text-decoration:none;">${esc(ctaLabel)}</a>
              </td></tr>
            </table>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background:#faf8f5;padding:24px 40px;border-top:1px solid #e8e0d4;">
            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:11px;color:#9b9b9b;line-height:1.6;">
              Caskworth Premium Whisky, a trade name of 49er Liquors Inc, a licensed California Stock Corporation (Entity No. 5373948). Based in Placerville, California, USA.<br>
              Questions? Reply directly to this email &mdash; it reaches us.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderSummaryTable(order) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${itemsRows(order.items)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:3px 0;">Subtotal</td><td align="right" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#2d2d2d;">${esc(order.subtotal)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:3px 0;">Discount</td><td align="right" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#2d2d2d;">${esc(order.discount)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:15px;font-weight:700;color:#1c1c1e;padding:10px 0 0;border-top:1px solid #e8e0d4;">Total</td><td align="right" style="font-family:'Inter',Arial,sans-serif;font-size:15px;font-weight:700;color:#1c1c1e;padding:10px 0 0;border-top:1px solid #e8e0d4;">${esc(order.total)}</td></tr>
    </table>`;
}

export function renderOrderNotificationEmail(order) {
  const orderDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  const bodyHtml = `
    <p style="font-family:'Inter',Arial,sans-serif;font-size:14px;color:#444;margin:0 0 20px;">${esc(orderDate)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:4px 0;width:110px;">Customer</td><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#1c1c1e;">${esc(order.name)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:4px 0;">Email</td><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#1c1c1e;">${esc(order.email)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:4px 0;">Phone</td><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#1c1c1e;">${esc(order.phone)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:4px 0;">Address</td><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#1c1c1e;">${esc(order.address)}</td></tr>
      <tr><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;padding:4px 0;">Payment</td><td style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#1c1c1e;">${esc(order.payment)}</td></tr>
    </table>
    ${orderSummaryTable(order)}
  `;
  return emailShell({
    eyebrow: `New Order ${order.ref}`,
    heading: 'You have a new order',
    bodyHtml,
    ctaLabel: 'Open in Admin',
    ctaUrl: 'https://caskworth.com/admin/',
  });
}

export function renderOrderConfirmationEmail(order, invoiceUrl) {
  const bodyHtml = `
    <p style="font-family:'Inter',Arial,sans-serif;font-size:14px;color:#444;line-height:1.7;margin:0 0 20px;">
      Thank you, ${esc(order.name.split(' ')[0] || order.name)}. We've received your order and our team is preparing it with the same care every Caskworth collector expects. Your reference is <strong>${esc(order.ref)}</strong>.
    </p>
    ${orderSummaryTable(order)}
    ${paymentInstructionsHtml(order)}
  `;
  return emailShell({
    eyebrow: `Order ${order.ref}`,
    heading: 'Your order has been received',
    bodyHtml,
    ctaLabel: 'View Your Order',
    ctaUrl: invoiceUrl,
  });
}

export function renderInvoiceEmail(order, invoiceUrl) {
  const bodyHtml = `
    <p style="font-family:'Inter',Arial,sans-serif;font-size:14px;color:#444;line-height:1.7;margin:0 0 20px;">
      Dear ${esc(order.name)}, here is your formal invoice for order <strong>${esc(order.ref)}</strong>. Please review the details below and complete payment using the method you selected at checkout.
    </p>
    ${orderSummaryTable(order)}
    ${paymentInstructionsHtml(order)}
    <p style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#6b6b6b;margin-top:20px;">
      A permanent copy of this invoice is always available at the link below.
    </p>
  `;
  return emailShell({
    eyebrow: `Invoice ${order.ref}`,
    heading: 'Your Caskworth Invoice',
    bodyHtml,
    ctaLabel: 'View Invoice',
    ctaUrl: invoiceUrl,
  });
}
