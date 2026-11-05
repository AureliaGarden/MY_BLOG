// Server-side signed sessions. This module deliberately fails closed when the
// secret, administrator identity, token, or Web Crypto support is missing.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_SECONDS = 8 * 60 * 60;

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid token encoding');
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  return Uint8Array.from(atob(normalized + '='.repeat((4 - normalized.length % 4) % 4)), c => c.charCodeAt(0));
}
async function keyFor(secret) {
  if (typeof secret !== 'string' || encoder.encode(secret).length < 32) throw new Error('Missing session secret');
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign', 'verify']);
}
export async function issueSession(secret, githubId, now = Math.floor(Date.now() / 1000)) {
  if (!/^\d+$/.test(String(githubId))) throw new Error('Invalid administrator ID');
  const payload = toBase64Url(encoder.encode(JSON.stringify({sub:String(githubId), iat:now, exp:now + SESSION_SECONDS})));
  const signature = await crypto.subtle.sign('HMAC', await keyFor(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}
export async function verifySession(token, secret, adminId, now = Math.floor(Date.now() / 1000)) {
  try {
    if (typeof token !== 'string' || token.length > 4096 || !/^\d+$/.test(String(adminId))) return false;
    const pieces = token.split('.');
    if (pieces.length !== 2) return false;
    const valid = await crypto.subtle.verify('HMAC', await keyFor(secret), fromBase64Url(pieces[1]), encoder.encode(pieces[0]));
    if (!valid) return false;
    const payload = JSON.parse(decoder.decode(fromBase64Url(pieces[0])));
    return payload.sub === String(adminId) && Number.isInteger(payload.iat) && Number.isInteger(payload.exp)
      && payload.iat <= now && payload.exp > now && payload.exp - payload.iat === SESSION_SECONDS;
  } catch { return false; }
}
export function sessionCookie(token) {
  return `__Host-camellia-session=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}
