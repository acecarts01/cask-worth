-- Caskworth order intake + invoicing — D1 schema.
-- Excluded from the deployed static assets via .assetsignore.

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,                    -- 'CW-' + id, zero-padded, set right after insert
  invoice_token TEXT UNIQUE NOT NULL, -- random token for the public /invoice/{token} page
  status TEXT NOT NULL DEFAULT 'new', -- new | invoiced | paid
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  items TEXT NOT NULL,                -- pipe-delimited display string, matches checkout's format
  subtotal TEXT NOT NULL,
  discount TEXT NOT NULL,
  total TEXT NOT NULL,
  payment TEXT NOT NULL,              -- CRYPTO | PAYPAL | APPLEPAY | CHIME
  wallet_key TEXT,                    -- which coin, when payment = CRYPTO (e.g. 'usdt-eth')
  payment_details TEXT,               -- merchant-typed, order-specific payment info, set at invoice dispatch
  created_at TEXT NOT NULL,
  invoiced_at TEXT,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,        -- base64, PBKDF2-SHA256
  salt TEXT NOT NULL,                 -- base64
  created_at TEXT NOT NULL
);
