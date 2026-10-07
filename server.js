import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Content Negotiation Middleware for Markdown (ported from functions/_middleware.js)
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

app.use(async (req, res, next) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const accept = req.headers['accept'] || '';

  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p)) || SKIP_EXT.test(url.pathname)) {
    return next();
  }

  if (prefersMarkdownOverHtml(accept)) {
    // Try to find the corresponding HTML file
    let filePath = path.join(__dirname, url.pathname);
    if (url.pathname.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(url.pathname)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile() && filePath.endsWith('.html')) {
      try {
        const html = fs.readFileSync(filePath, 'utf-8');
        const md = htmlToMarkdown(html, `https://caskworth.com${url.pathname}`);
        res.setHeader('content-type', 'text/markdown; charset=utf-8');
        res.setHeader('access-control-allow-origin', '*');
        return res.send(md);
      } catch (err) {
        return next();
      }
    }
  }
  next();
});

// API Routes
const handleOrder = async (req, res) => {
  const data = req.body;
  const REQUIRED_FIELDS = ['ref', 'name', 'email', 'phone', 'address', 'items', 'subtotal', 'discount', 'total', 'payment'];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field] && field !== 'ref') { // ref might be generated on server in some versions
       // but here it seems client sends it. However, if client doesn't send ref, we can generate it.
    }
  }
  
  if (!data.email || !EMAIL_RE.test(data.email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Mocking success.');
    return res.json({ success: true, mocked: true, ref: data.ref || 'CW-MOCK-' + Math.random().toString(36).substring(7).toUpperCase() });
  }

  const itemsHtml = esc(data.items).split(' | ').filter(Boolean).map((line) => `<li>${line}</li>`).join('');
  const orderDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

  const html = `
    <h2 style="font-family:Georgia,serif;margin-bottom:4px;">New Order ${esc(data.ref || 'NEW')}</h2>
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
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Caskworth Orders <orders@send.caskworth.com>',
        to: ['info@caskworth.com'],
        reply_to: data.email,
        subject: `New Order ${data.ref || ''} - Caskworth Premium Whisky`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return res.status(502).json({ success: false, error: `Resend error: ${errBody}` });
    }

    return res.json({ success: true, ref: data.ref });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

app.post('/api/send-order', handleOrder);
app.post('/api/orders', handleOrder);


// Static files
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

// Fallback to 404.html
app.use((req, res) => {
  const fourOhFour = path.join(__dirname, '404.html');
  if (fs.existsSync(fourOhFour)) {
    res.status(404).sendFile(fourOhFour);
  } else {
    res.status(404).send('404 Not Found');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
