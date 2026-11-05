import { readState, writeState } from './d1-state.mjs';
import { applyMutation } from './mutate-blog.mjs';
import { verifySession } from './admin-session.mjs';
import { beginGithubLogin, finishGithubLogin } from './github-oauth.mjs';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SESSION_NAME = '__Host-camellia-session';
const IMAGE_TYPES = {'image/png':'png', 'image/jpeg':'jpg', 'image/gif':'gif', 'image/webp':'webp'};
function json(body, status = 200, extra = {}) { return new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...extra}}); }
function cookie(request, name) {
  const found = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).filter(x => x.startsWith(`${name}=`));
  return found.length === 1 ? found[0].slice(name.length + 1) : '';
}
async function isAdmin(request, env) { return verifySession(cookie(request, SESSION_NAME), env.SESSION_SECRET, env.ADMIN_GITHUB_ID); }
function trustedOrigin(request, env) { return request.headers.get('Origin') === env.PUBLIC_ORIGIN && request.headers.get('X-Blog-Editor') === '1'; }
function publicImagePath(path) {
  return /^\/personal\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(path)
    || /^\/personal\/wallpapers\/wallpaper-[0-9]{2}\.png$/.test(path)
    || /^\/personal\/character(?:-mask)?\.png$/.test(path);
}
function imageValid(bytes, type) {
  if (!bytes.length) return false;
  if (type === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/gif') return bytes.length >= 6 && ['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.slice(0,6)));
  if (type === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  return false;
}
async function readLimited(request, limit) {
  const declared = request.headers.get('Content-Length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new RangeError('请求数据过大');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader(), chunks = [];
  let total = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new RangeError('请求数据过大'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
async function imageUpload(request, env) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!IMAGE_TYPES[type]) return json({error:'请选择 PNG、JPG、WebP 或 GIF 图片'}, 400);
  let bytes;
  try { bytes = await readLimited(request, MAX_IMAGE_BYTES); } catch (error) { if (error instanceof RangeError) return json({error:'图片不能超过 10 MB'}, 413); throw error; }
  if (!imageValid(bytes, type)) return json({error:'图片文件内容与格式不符'}, 400);
  const path = `/personal/uploads/${crypto.randomUUID()}.${IMAGE_TYPES[type]}`;
  await env.IMAGES.put(path.slice(1), bytes, {httpMetadata:{contentType:type}});
  return json({url:path});
}
async function imageRead(path, env) {
  const object = await env.IMAGES.get(path.slice(1));
  if (!object) return new Response('Not found', {status:404});
  const headers = new Headers({'Cache-Control':'public, max-age=3600', 'X-Content-Type-Options':'nosniff'});
  object.writeHttpMetadata(headers);
  return new Response(object.body, {headers});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    try {
      if (url.origin !== env.PUBLIC_ORIGIN) return new Response('Not found', {status:404});
      if (path === '/auth/login' && request.method === 'GET') return await beginGithubLogin(env);
      if (path === '/auth/callback') return await finishGithubLogin(request, env);
      if (path === '/api/session' && request.method === 'GET') return json({authenticated:await isAdmin(request, env)});
      if (path === '/api/time' && request.method === 'GET') return json({now:Date.now()});
      if (path === '/api/capabilities' && request.method === 'GET') return json({momentMood:true});
      if (path === '/blog-data.js' && request.method === 'GET') {
        const state = await readState(env.DB);
        if (!state) return new Response('/* 博客数据尚未初始化 */', {status:503, headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
        return new Response(`window.BLOG_DATA = ${JSON.stringify(state.data)};`, {headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }
      if (publicImagePath(path) && request.method === 'GET') return await imageRead(path, env);
      if (path === '/editor' || path === '/editor.html') {
        if (request.method !== 'GET') return json({error:'方法不支持'}, 405);
        if (!(await isAdmin(request, env))) return new Response('请先登录管理员账号', {status:401, headers:{'Cache-Control':'no-store'}});
        // The static asset server canonically redirects /editor.html to /editor.
        // Fetch the canonical path internally to avoid a redirect loop.
        return env.ASSETS.fetch(new Request(new URL('/editor', url), request));
      }
      if (path === '/api/data' && request.method === 'GET') {
        if (!(await isAdmin(request, env))) return json({error:'请先登录'}, 401);
        const state = await readState(env.DB);
        return state ? json(state.data, 200, {'ETag':`"${state.revision}"`}) : json({error:'博客数据尚未初始化'}, 503);
      }
      if ((path === '/api/save' || path === '/api/image') && request.method === 'POST') {
        if (!trustedOrigin(request, env)) return json({error:'请求来源无效'}, 403);
        if (!(await isAdmin(request, env))) return json({error:'请先登录'}, 401);
        if (path === '/api/image') return await imageUpload(request, env);
        if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json({error:'格式不正确'}, 415);
        let raw;
        try { raw = new TextDecoder().decode(await readLimited(request, 8_000_000)); }
        catch (error) { if (error instanceof RangeError) return json({error:'数据过大'}, 413); throw error; }
        let payload;
        try { payload = JSON.parse(raw); } catch { return json({error:'数据格式不正确'}, 400); }
        const state = await readState(env.DB);
        if (!state) return json({error:'博客数据尚未初始化'}, 503);
        if (request.headers.get('If-Match') !== `"${state.revision}"`) return json({error:'内容已在其他设备更新，请刷新后重试'}, 409);
        try {
          const updated = applyMutation(state.data, payload);
          await writeState(env.DB, state.revision, updated);
          return json({ok:true});
        } catch (error) { return json({error:error.message || '保存失败'}, 400); }
      }
      if (path === '/auth/logout' && request.method === 'POST') {
        if (!trustedOrigin(request, env)) return json({error:'请求来源无效'}, 403);
        return json({ok:true}, 200, {'Set-Cookie':`${SESSION_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`});
      }
      if (path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/personal/')) return new Response('Not found', {status:404});
      return env.ASSETS.fetch(request);
    } catch { return json({error:'服务暂时不可用，请稍后重试'}, 500); }
  },
};
