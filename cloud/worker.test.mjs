import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import { issueSession } from './admin-session.mjs';
import { initializeState } from './d1-state.mjs';
import { createTestDatabase } from './test-db.mjs';

const origin = 'https://camellia.example';
const secret = 'test-only-secret-abcdefghijklmnopqrstuvwxyz-0123456789';
async function context() {
  const images = new Map();
  const env = {PUBLIC_ORIGIN:origin, ADMIN_GITHUB_ID:'123', SESSION_SECRET:secret, DB:createTestDatabase(), ASSETS:{fetch:async r => new Response(new URL(r.url).pathname)}, IMAGES:{
    async put(key, bytes, options) { images.set(key, {bytes, options}); },
    async get(key) { const o = images.get(key); return o && {body:o.bytes, writeHttpMetadata(h) { h.set('Content-Type',o.options.httpMetadata.contentType); }}; },
  }};
  await initializeState(env.DB, {profile:{}, posts:[], moments:[], albums:[], projects:[], settings:{}, activity:{}, activityLog:[]});
  const token = await issueSession(secret, '123');
  const cookie = `__Host-camellia-session=${token}`;
  return {env, cookie, images};
}
function request(path, options) { return new Request(`${origin}${path}`, options); }
test('unauthenticated and cross-origin requests cannot modify data or upload', async () => {
  const {env, cookie, images} = await context();
  assert.equal((await worker.fetch(request('/editor'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/data'), env)).status, 401);
  const payload = JSON.stringify({kind:'home',title:'changed',description:''});
  const unauth = request('/api/save',{method:'POST',headers:{Origin:origin,'X-Blog-Editor':'1','Content-Type':'application/json'},body:payload});
  assert.equal((await worker.fetch(unauth, env)).status, 401);
  const cross = request('/api/save',{method:'POST',headers:{Origin:'https://attacker.example',Cookie:cookie,'X-Blog-Editor':'1','Content-Type':'application/json'},body:payload});
  assert.equal((await worker.fetch(cross, env)).status, 403);
  const badUpload = request('/api/image',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-Blog-Editor':'1','Content-Type':'image/png'},body:'not an image'});
  assert.equal((await worker.fetch(badUpload, env)).status, 400);
  assert.equal(images.size, 0);
});
test('only signed-in administrator can save and stale editor versions are rejected', async () => {
  const {env, cookie} = await context();
  const read = await worker.fetch(request('/api/data',{headers:{Cookie:cookie}}), env);
  assert.equal(read.status, 200);
  const version = read.headers.get('ETag');
  const headers = {Origin:origin,Cookie:cookie,'X-Blog-Editor':'1','Content-Type':'application/json','If-Match':version};
  const payload = JSON.stringify({kind:'home',title:'changed',description:'description'});
  assert.equal((await worker.fetch(request('/api/save',{method:'POST',headers,body:payload}), env)).status, 200);
  assert.equal((await worker.fetch(request('/api/save',{method:'POST',headers,body:payload}), env)).status, 409);
  const result = await worker.fetch(request('/blog-data.js'), env);
  assert.match(await result.text(), /changed/);
});
test('validated image can be stored and accessed at its generated path', async () => {
  const {env, cookie} = await context();
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0]);
  const upload = await worker.fetch(request('/api/image',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-Blog-Editor':'1','Content-Type':'image/png'},body:png}), env);
  assert.equal(upload.status, 200);
  const {url} = await upload.json();
  const read = await worker.fetch(request(url), env);
  assert.equal(read.headers.get('Content-Type'), 'image/png');
  assert.deepEqual(new Uint8Array(await read.arrayBuffer()), png);
});

test('public time endpoint returns fresh server time without caching', async () => {
  const {env} = await context(); const before = Date.now();
  const response = await worker.fetch(request('/api/time'), env); const {now} = await response.json();
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.ok(Number.isFinite(now) && now >= before && now <= Date.now());
});
