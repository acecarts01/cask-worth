// Caskworth Worker entry point.
//
// This project is a native Cloudflare "Workers" service (static assets +
// a Worker script), NOT a classic Cloudflare Pages project -- confirmed via
// its dashboard URL (/workers/services/view/caskworth/...) and via a failed
// `wrangler pages deploy` build (Authentication error: no Pages project
// named "caskworth" exists on this account). The Pages-only `/functions`
// directory convention is never read by `wrangler deploy` and was silently
// ignored in production the whole time it existed.
//
// wrangler.toml sets `run_worker_first = true` so every request -- not just
// ones that miss a static asset -- passes through fetch() below. That lets
// this script both serve /api/send-order and inspect the Accept header on
// ordinary HTML pages for the markdown-negotiation feature, falling back to
// env.ASSETS.fetch() for normal static serving.

/* ---------- shared helpers ---------- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ---------- POST /api/send-order (Resend email notification) ---------- */

const REQUIRED_FIELDS = ['ref', 'name', 'email', 'phone', 'address', 'items', 'subtotal', 'discount', 'total', 'payment'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleSendOrder(request, env) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

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
        from: 'Caskworth Orders <orders@send.caskworth.com>',
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

/* ---------- Markdown negotiation for AI agents ---------- */

function prefersMarkdownOverHtml(accept) {
  if (!accept) return false;
  let mdQ = -1, htmlQ = -1;
  for (const part of accept.split(',')) {
    const bits = part.trim().split(';');
    const type = (bits.shift() || '').trim().toLowerCase();
    let q = 1;
    for (const p of bits) {
      const m = /^\s*q\s*=\s*([\d.]+)\s*$/.exec(p);
      if (m) q = parseFloat(m[1]);
    }
    if (type === 'text/markdown') mdQ = Math.max(mdQ, q);
    if (type === 'text/html') htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > -1 && mdQ > htmlQ;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&rarr;/g, '→')
    .replace(/&trade;/g, '™')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 10)); } catch { return ''; }
    })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function stripRemainingTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function htmlToMarkdown(html, pageUrl) {
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleM ? decodeEntities(titleM[1]).replace(/\s*\|\s*Caskworth.*$/i, '').trim() : 'Caskworth';

  const descM = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const desc = descM ? decodeEntities(descM[1]) : '';

  let body = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [])[1]
    || (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [])[1]
    || '';

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  body = body.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n# ${stripTags(t)}\n`);
  body = body.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${stripTags(t)}\n`);
  body = body.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${stripTags(t)}\n`);

  body = body.replace(/<a\s+[^>]*?href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
    const text = stripTags(t);
    if (!text) return '';
    let abs = href;
    if (abs.startsWith('/')) abs = `https://caskworth.com${abs}`;
    else if (!/^https?:\/\//i.test(abs)) return text;
    return `[${text}](${abs})`;
  });

  body = body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${stripTags(t)}`);
  body = body.replace(/<\/(p|div|section|article|tr)>/gi, '\n\n');
  body = stripRemainingTags(body);
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  let md = `# ${title}\n\n`;
  if (desc) md += `> ${desc}\n\n`;
  md += `Source: ${pageUrl}\n\n`;
  md += body;
  return md;
}

const SKIP_PREFIXES = ['/assets/', '/api/', '/.well-known/', '/checkout'];
const SKIP_EXT = /\.(css|js|mjs|json|xml|txt|png|jpe?g|webp|svg|ico|avif|gif|woff2?|ttf|manifest|md)$/i;

async function maybeNegotiateMarkdown(request, env, url) {
  const accept = request.headers.get('accept') || '';

  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p)) || SKIP_EXT.test(url.pathname)) {
    return env.ASSETS.fetch(request);
  }
  if (!prefersMarkdownOverHtml(accept)) {
    return env.ASSETS.fetch(request);
  }

  const response = await env.ASSETS.fetch(request);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  const md = htmlToMarkdown(html, url.href);

  return new Response(md, {
    status: response.status,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
      'access-control-allow-origin': '*',
    },
  });
}

/* ---------- entry point ---------- */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/send-order') {
      return handleSendOrder(request, env);
    }

    try {
      return await maybeNegotiateMarkdown(request, env, url);
    } catch (e) {
      // Never let markdown conversion break a real page load.
      return env.ASSETS.fetch(request);
    }
  },
};
