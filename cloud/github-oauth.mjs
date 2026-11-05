import { issueSession, sessionCookie } from './admin-session.mjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const FLOW_SECONDS = 600;
const FLOW_COOKIE = '__Host-camellia-oauth';
function b64(bytes) { let raw = ''; for (const byte of bytes) raw += String.fromCharCode(byte); return btoa(raw).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, ''); }
function unb64(s) { if (!/^[\w-]+$/.test(s)) throw new Error('invalid encoding'); const n = s.replaceAll('-','+').replaceAll('_','/'); return Uint8Array.from(atob(n + '='.repeat((4 - n.length % 4) % 4)), c => c.charCodeAt(0)); }
function randomString() { return b64(crypto.getRandomValues(new Uint8Array(32))); }
async function hmacKey(secret) {
  if (typeof secret !== 'string' || encoder.encode(secret).length < 32) throw new Error('missing authentication configuration');
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
}
async function signFlow(flow, secret) {
  const body = b64(encoder.encode(JSON.stringify(flow)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(`oauth:${body}`));
  return `${body}.${b64(new Uint8Array(signature))}`;
}
async function verifyFlow(token, secret, now) {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || !(await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64(parts[1]), encoder.encode(`oauth:${parts[0]}`)))) return null;
    const data = JSON.parse(decoder.decode(unb64(parts[0])));
    if (!Number.isInteger(data.exp) || data.exp <= now || data.exp > now + FLOW_SECONDS || !/^[\w-]{43}$/.test(data.state) || !/^[\w-]{43}$/.test(data.verifier)) return null;
    return data;
  } catch { return null; }
}
function getCookie(request, name) {
  const found = (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(`${name}=`));
  return found.length === 1 ? found[0].slice(name.length + 1) : '';
}
function originFor(env) {
  const url = new URL(env.PUBLIC_ORIGIN);
  if (url.protocol !== 'https:' || url.origin !== env.PUBLIC_ORIGIN) throw new Error('invalid public origin');
  return url.origin;
}

export async function beginGithubLogin(env, now = Math.floor(Date.now()/1000)) {
  const origin = originFor(env);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !/^\d+$/.test(String(env.ADMIN_GITHUB_ID || ''))) throw new Error('missing authentication configuration');
  const state = randomString(), verifier = randomString();
  const challenge = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
  const flow = await signFlow({state, verifier, exp:now + FLOW_SECONDS}, env.SESSION_SECRET);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({client_id:env.GITHUB_CLIENT_ID, redirect_uri:`${origin}/auth/callback`, state, code_challenge:challenge, code_challenge_method:'S256', allow_signup:'false'}).toString();
  return new Response(null, {status:302, headers:{Location:url.href, 'Set-Cookie':`${FLOW_COOKIE}=${flow}; Path=/; Max-Age=${FLOW_SECONDS}; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control':'no-store'}});
}

export async function finishGithubLogin(request, env, fetcher = fetch, now = Math.floor(Date.now()/1000)) {
  const clear = `${FLOW_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
  const fail = () => new Response('登录未完成，请重新尝试。', {status:403, headers:{'Set-Cookie':clear, 'Cache-Control':'no-store'}});
  try {
    const origin = originFor(env), url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== origin || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !/^\d+$/.test(String(env.ADMIN_GITHUB_ID || ''))) return fail();
    const flow = await verifyFlow(getCookie(request, FLOW_COOKIE), env.SESSION_SECRET, now);
    const state = url.searchParams.get('state'), code = url.searchParams.get('code');
    if (!flow || state !== flow.state || !code || code.length > 512) return fail();
    const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID, client_secret:env.GITHUB_CLIENT_SECRET, code, redirect_uri:`${origin}/auth/callback`, code_verifier:flow.verifier})});
    if (!tokenResponse.ok) return fail();
    const token = (await tokenResponse.json()).access_token;
    if (typeof token !== 'string' || !token) return fail();
    const identityResponse = await fetcher('https://api.github.com/user', {headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'User-Agent':'camellia-blog'}});
    if (!identityResponse.ok) return fail();
    const identity = await identityResponse.json();
    if (!Number.isSafeInteger(identity.id) || String(identity.id) !== String(env.ADMIN_GITHUB_ID)) return fail();
    const session = await issueSession(env.SESSION_SECRET, String(identity.id), now);
    const headers = new Headers({Location:`${origin}/#home`, 'Cache-Control':'no-store'});
    headers.append('Set-Cookie', clear);
    headers.append('Set-Cookie', sessionCookie(session));
    return new Response(null, {status:302, headers});
  } catch { return fail(); }
}
