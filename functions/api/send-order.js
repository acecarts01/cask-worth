// Sends a new-order notification email via Resend, replacing the previous
// FormSubmit.co integration. Requires the RESEND_API_KEY environment
// variable (set as a Cloudflare Pages secret) and a verified sending
// domain in the Resend dashboard.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const REQUIRED_FIELDS = ['ref', 'name', 'email', 'phone', 'address', 'items', 'subtotal', 'discount', 'total', 'payment'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(context) {
  const { request, env } = context;

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
  if (!env.RESEND_API_KEY) {
    return Response.json({ success: false, error: 'Email service is not configured' }, { status: 500 });
  }

  const itemsHtml = esc(data.items).split(' | ').filter(Boolean).map((line) => `<li>${line}</li>`).join('');
  const orderDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

  const html = `
    <h2 style="font-family:Georgia,serif;margin-bottom:4px;">New Order ${esc(data.ref)}</h2>
    <p style="color:#666;margin-top:0;">${orderDate}</p>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Customer</td><td>${esc(data.name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td>${esc(data.email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${esc(data.phone)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Address</td><td>${esc(data.address)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Payment</td><td>${esc(data.payment)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Subtotal</td><td>${esc(data.subtotal)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Discount</td><td>${esc(data.discount)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:700;">Total</td><td style="font-weight:700;">${esc(data.total)}</td></tr>
    </table>
    <h3 style="margin-bottom:4px;">Items</h3>
    <ul>${itemsHtml}</ul>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Caskworth Orders <orders@caskworth.com>',
        to: ['info@caskworth.com'],
        reply_to: data.email,
        subject: `New Order ${data.ref} - Caskworth Premium Whisky`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return Response.json({ success: false, error: `Resend error: ${errBody}` }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function onRequestGet() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
