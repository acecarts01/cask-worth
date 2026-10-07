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
// this script both serve the /api/* and /admin/setup routes below and
// inspect the Accept header on ordinary HTML pages for the markdown-
// negotiation feature, falling back to env.ASSETS.fetch() for normal
// static serving.

import { handleCreateOrder, handleInvoicePage } from './orders.js';
import { handleAdminSetup, handleAdminLogin, handleAdminLogout, handleAdminOrders, handleAdminOrderAction } from './admin.js';

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

const SKIP_PREFIXES = ['/assets/', '/api/', '/.well-known/', '/checkout', '/admin', '/invoice/'];
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

function matchOrderAction(pathname) {
  // /api/admin/orders/{id}/invoice  or  /api/admin/orders/{id}/paid
  const m = /^\/api\/admin\/orders\/(\d+)\/(invoice|paid)$/.exec(pathname);
  return m ? { id: Number(m[1]), action: m[2] } : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/orders') {
      return handleCreateOrder(request, env);
    }
    if (path.startsWith('/invoice/')) {
      return handleInvoicePage(path.slice('/invoice/'.length), env);
    }
    if (path === '/admin/setup') {
      return handleAdminSetup(request, env, url);
    }
    if (path === '/api/admin/login') {
      return handleAdminLogin(request, env);
    }
    if (path === '/api/admin/logout') {
      return handleAdminLogout();
    }
    if (path === '/api/admin/orders') {
      return handleAdminOrders(request, env);
    }
    const orderAction = matchOrderAction(path);
    if (orderAction) {
      return handleAdminOrderAction(request, env, orderAction.id, orderAction.action);
    }

    try {
      return await maybeNegotiateMarkdown(request, env, url);
    } catch (e) {
      // Never let markdown conversion break a real page load.
      return env.ASSETS.fetch(request);
    }
  },
};
