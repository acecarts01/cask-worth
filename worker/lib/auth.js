// Password hashing (PBKDF2-SHA256 via Web Crypto) and signed session cookies.
// No external deps, no Node crypto -- everything here runs on the Workers runtime.

const PBKDF2_ITERATIONS = 100000;
const SESSION_COOKIE = 'cw_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function bufToBase64(buf) {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBuf(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return { hash: bufToBase64(bits), salt: bufToBase64(salt.buffer) };
}

export async function verifyPassword(password, saltB64, hashB64) {
  const salt = new Uint8Array(base64ToBuf(saltB64));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return timingSafeEqual(bufToBase64(bits), hashB64);
}

async function hmacSign(message, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bufToBase64(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createSessionCookie(email, secret) {
  const payload = JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = base64urlEncode(payload);
  const sig = await hmacSign(payloadB64, secret);
  const token = `${payloadB64}.${sig}`;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function verifySessionFromRequest(request, secret) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const [payloadB64, sig] = match[1].split('.');
  if (!payloadB64 || !sig) return null;
  const expectedSig = await hmacSign(payloadB64, secret);
  if (!timingSafeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function randomToken(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength || 24));
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
