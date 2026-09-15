import { sendEmail } from './lib/resend.js';
import { randomToken } from './lib/auth.js';
import { renderOrderNotificationEmail, renderOrderConfirmationEmail, renderInvoiceEmail, paymentInstructionsHtml } from './lib/email-templates.js';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address', 'items', 'subtotal', 'discount', 'total', 'payment'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MERCHANT_EMAIL = 'info@caskworth.com';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function invoiceUrlFor(token) {
  return `https://caskworth.com/invoice/${token}`;
}

export async function handleCreateOrder(request, env) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      return Response.json({ success: false, error: `Missing field: ${field}` }, { status: 400 });
    }
  }
  if (!EMAIL_RE.test(data.email)) {
    return Response.json({ success: false, error: 'Invalid email address' }, { status: 400 });
  }

  const invoiceToken = randomToken(24);
  const createdAt = new Date().toISOString();

  const insert = await env.DB.prepare(
    `INSERT INTO orders (invoice_token, status, name, email, phone, address, items, subtotal, discount, total, payment, wallet_key, created_at)
     VALUES (?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    invoiceToken, data.name, data.email, data.phone, data.address, data.items,
    data.subtotal, data.discount, data.total, data.payment, data.walletKey || null, createdAt
  ).run();

  const id = insert.meta.last_row_id;
  const ref = 'CW-' + String(id).padStart(6, '0');
  await env.DB.prepare('UPDATE orders SET ref = ? WHERE id = ?').bind(ref, id).run();

  const order = { id, ref, name: data.name, email: data.email, phone: data.phone, address: data.address, items: data.items, subtotal: data.subtotal, discount: data.discount, total: data.total, payment: data.payment, wallet_key: data.walletKey };
  const invoiceUrl = invoiceUrlFor(invoiceToken);

  let emailed = true;
  try {
    if (!env.RESEND_API_KEY) throw new Error('Email service is not configured');
    await sendEmail(env, {
      from: 'Caskworth Orders <orders@caskworth.com>',
      to: MERCHANT_EMAIL,
      replyTo: order.email,
      subject: `New Order ${ref} - Caskworth Premium Whisky`,
      html: renderOrderNotificationEmail(order),
    });
    await sendEmail(env, {
      from: 'Caskworth <orders@caskworth.com>',
      to: order.email,
      bcc: MERCHANT_EMAIL,
      replyTo: MERCHANT_EMAIL,
      subject: `Your Caskworth Order ${ref}`,
      html: renderOrderConfirmationEmail(order, invoiceUrl),
    });
  } catch (e) {
    emailed = false;
  }

  return Response.json({ success: true, ref, emailed });
}

export async function handleInvoicePage(token, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE invoice_token = ?').bind(token).first();
  if (!order) {
    return new Response('Invoice not found.', { status: 404, headers: { 'content-type': 'text/plain' } });
  }

  const itemsRows = esc(order.items).split(' | ').filter(Boolean)
    .map((line) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e0d4;font-size:14px;">${line}</td></tr>`).join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${esc(order.ref)} — Caskworth</title>
<style>
  body{margin:0;background:#f4f0ea;font-family:'Inter',system-ui,sans-serif;color:#2d2d2d}
  .wrap{max-width:640px;margin:0 auto;padding:40px 16px}
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.10)}
  .hd{background:linear-gradient(135deg,#2a1a06,#0d0a04);padding:36px 40px;text-align:center}
  .hd .wm{font-family:Georgia,serif;font-size:26px;font-weight:700;color:#f0c020;letter-spacing:.03em}
  .hd .tag{font-size:10px;color:rgba(255,255,255,.55);letter-spacing:.15em;text-transform:uppercase;margin-top:6px}
  .body{padding:40px}
  .status{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
  .status.new{background:#fdf6e8;color:#8a6712}
  .status.invoiced{background:#f0f7ff;color:#1c4a7a}
  .status.paid{background:#f0fff5;color:#15803d}
  h1{font-family:Georgia,serif;font-size:24px;margin:16px 0 24px}
  table{width:100%;border-collapse:collapse}
  .totals td{font-size:13px;padding:3px 0}
  .totals .grand td{font-size:15px;font-weight:700;border-top:1px solid #e8e0d4;padding-top:10px}
  .ft{background:#faf8f5;padding:24px 40px;border-top:1px solid #e8e0d4;font-size:11px;color:#9b9b9b;line-height:1.6}
</style></head>
<body><div class="wrap"><div class="card">
  <div class="hd"><div class="wm">CASKWORTH</div><div class="tag">Premium Whisky &amp; Spirits</div></div>
  <div class="body">
    <span class="status ${esc(order.status)}">${esc(order.status)}</span>
    <h1>Invoice ${esc(order.ref)}</h1>
    <table><tr><td style="color:#6b6b6b;font-size:13px;width:110px">Customer</td><td style="font-size:13px">${esc(order.name)}</td></tr>
    <tr><td style="color:#6b6b6b;font-size:13px">Address</td><td style="font-size:13px">${esc(order.address)}</td></tr></table>
    <table style="margin-top:20px">${itemsRows}</table>
    <table class="totals" style="margin-top:16px">
      <tr><td>Subtotal</td><td align="right">${esc(order.subtotal)}</td></tr>
      <tr><td>Discount</td><td align="right">${esc(order.discount)}</td></tr>
      <tr class="grand"><td>Total</td><td align="right">${esc(order.total)}</td></tr>
    </table>
    ${paymentInstructionsHtml(order)}
  </div>
  <div class="ft">Caskworth Premium Whisky, a trade name of 49er Liquors Inc, a licensed California Stock Corporation (Entity No. 5373948). Questions about this invoice? Reply to the invoice email, or contact info@caskworth.com.</div>
</div></div></body></html>`;

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

export async function dispatchInvoiceForOrder(orderId, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
  if (!order) return { ok: false, error: 'Order not found' };

  const invoiceUrl = invoiceUrlFor(order.invoice_token);
  await sendEmail(env, {
    from: 'Caskworth <orders@caskworth.com>',
    to: order.email,
    bcc: MERCHANT_EMAIL,
    replyTo: MERCHANT_EMAIL,
    subject: `Invoice ${order.ref} - Caskworth Premium Whisky`,
    html: renderInvoiceEmail(order, invoiceUrl),
  });

  await env.DB.prepare(`UPDATE orders SET status = 'invoiced', invoiced_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), orderId).run();

  return { ok: true };
}
