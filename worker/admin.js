import { hashPassword, verifyPassword, createSessionCookie, clearSessionCookie, verifySessionFromRequest } from './lib/auth.js';
import { dispatchInvoiceForOrder } from './orders.js';

async function requireSession(request, env) {
  return verifySessionFromRequest(request, env.SESSION_SECRET);
}

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function handleAdminSetup(request, env, url) {
  const token = url.searchParams.get('token');
  if (!token || token !== env.ADMIN_SETUP_TOKEN) {
    return new Response('Not found.', { status: 404, headers: { 'content-type': 'text/plain' } });
  }

  const existing = await env.DB.prepare('SELECT email FROM users LIMIT 1').first();
  if (existing) {
    return new Response('Setup already completed. This link is now disabled.', { status: 403, headers: { 'content-type': 'text/plain' } });
  }

  if (request.method === 'GET') {
    return new Response(setupFormHtml(token), { headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }

  if (request.method === 'POST') {
    const form = await request.formData();
    const email = (form.get('email') || '').toString().trim().toLowerCase();
    const password = (form.get('password') || '').toString();
    if (!email || password.length < 10) {
      return new Response(setupFormHtml(token, 'Email required; password must be at least 10 characters.'), { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    const { hash, salt } = await hashPassword(password);
    await env.DB.prepare('INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)')
      .bind(email, hash, salt, new Date().toISOString()).run();
    return new Response('Admin account created. This setup link is now permanently disabled. You can log in at /admin/', { headers: { 'content-type': 'text/plain' } });
  }

  return new Response('Method not allowed', { status: 405 });
}

function setupFormHtml(token, error) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Caskworth Admin Setup</title>
  <style>body{font-family:system-ui,sans-serif;background:#1c1c1e;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  form{background:#2a2a2c;padding:32px;border-radius:14px;width:100%;max-width:360px}
  input{width:100%;padding:10px;margin:6px 0 16px;border-radius:8px;border:1px solid #444;background:#1c1c1e;color:#fff;box-sizing:border-box}
  button{width:100%;padding:12px;border-radius:8px;border:none;background:#c9941a;color:#1c1c1e;font-weight:700;cursor:pointer}
  label{font-size:13px;color:#ccc}.err{color:#f87171;font-size:13px;margin-bottom:12px}</style></head>
  <body><form method="POST">
    <h2 style="font-family:Georgia,serif;color:#e0ac3d">Create Admin Account</h2>
    ${error ? `<div class="err">${error}</div>` : ''}
    <label>Email</label><input type="email" name="email" required>
    <label>Password (min 10 characters)</label><input type="password" name="password" required minlength="10">
    <button type="submit">Create Account</button>
  </form></body></html>`;
}

export async function handleAdminLogin(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const email = (data.email || '').toString().trim().toLowerCase();
  const password = (data.password || '').toString();

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await verifyPassword(password, user.salt, user.password_hash);
  if (!valid) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const cookie = await createSessionCookie(email, env.SESSION_SECRET);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'content-type': 'application/json', 'set-cookie': cookie },
  });
}

export async function handleAdminLogout() {
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'content-type': 'application/json', 'set-cookie': clearSessionCookie() },
  });
}

export async function handleAdminOrders(request, env) {
  const session = await requireSession(request, env);
  if (!session) return unauthorized();

  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all();
  return Response.json({ orders: results }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function handleAdminOrderAction(request, env, orderId, action) {
  const session = await requireSession(request, env);
  if (!session) return unauthorized();

  if (action === 'invoice') {
    const result = await dispatchInvoiceForOrder(orderId, env);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ success: true });
  }
  if (action === 'paid') {
    await env.DB.prepare(`UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), orderId).run();
    return Response.json({ success: true });
  }
  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
