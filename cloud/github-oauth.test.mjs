import test from 'node:test';
import assert from 'node:assert/strict';
import { beginGithubLogin, finishGithubLogin } from './github-oauth.mjs';
import { verifySession } from './admin-session.mjs';

const env = {PUBLIC_ORIGIN:'https://camellia.example', GITHUB_CLIENT_ID:'id', GITHUB_CLIENT_SECRET:'secret', ADMIN_GITHUB_ID:'123', SESSION_SECRET:'test-only-secret-abcdefghijklmnopqrstuvwxyz-0123456789'};
function prepare() { return beginGithubLogin(env, 1000); }
function flowCookie(response) { return response.headers.get('set-cookie').split(';')[0]; }
function state(response) { return new URL(response.headers.get('location')).searchParams.get('state'); }
function callback(s, cookie) { return new Request(`https://camellia.example/auth/callback?state=${s}&code=temporary`, {headers:{Cookie:cookie}}); }
function mockGithub(id) {
  return async (url, options) => {
    if (url.includes('access_token')) {
      const data = JSON.parse(options.body);
      assert.equal(data.redirect_uri, 'https://camellia.example/auth/callback');
      assert.match(data.code_verifier, /^[\w-]{43}$/);
      return Response.json({access_token:'test-token'});
    }
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return Response.json({id});
  };
}
test('GitHub OAuth uses PKCE and accepts only the configured immutable user ID', async () => {
  const login = await prepare();
  const authorize = new URL(login.headers.get('location'));
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.match(authorize.searchParams.get('code_challenge'), /^[\w-]{43}$/);
  const result = await finishGithubLogin(callback(state(login), flowCookie(login)), env, mockGithub(123), 1001);
  assert.equal(result.status, 302);
  const cookies = result.headers.getSetCookie();
  const session = cookies.find(c => c.startsWith('__Host-camellia-session='));
  assert.ok(session);
  assert.equal(await verifySession(session.split(';')[0].split('=')[1], env.SESSION_SECRET, '123', 1001), true);
  const denied = await finishGithubLogin(callback(state(login), flowCookie(login)), env, mockGithub(456), 1001);
  assert.equal(denied.status, 403);
});
test('expired or mismatched login state cannot contact GitHub', async () => {
  const login = await prepare();
  const noFetch = () => { throw new Error('must not reach GitHub'); };
  assert.equal((await finishGithubLogin(callback('wrong', flowCookie(login)), env, noFetch, 1001)).status, 403);
  assert.equal((await finishGithubLogin(callback(state(login), flowCookie(login)), env, noFetch, 1600)).status, 403);
  assert.equal((await finishGithubLogin(callback(state(login), ''), env, noFetch, 1001)).status, 403);
});
