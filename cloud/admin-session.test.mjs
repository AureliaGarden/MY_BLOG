import test from 'node:test';
import assert from 'node:assert/strict';
import { issueSession, verifySession, sessionCookie } from './admin-session.mjs';

const secret = 'test-only-secret-abcdefghijklmnopqrstuvwxyz-0123456789';
test('only a signed, current token for the allowed GitHub user authenticates', async () => {
  const token = await issueSession(secret, '123', 1000);
  assert.equal(await verifySession(token, secret, '123', 1001), true);
  assert.equal(await verifySession(token, secret, '456', 1001), false);
  assert.equal(await verifySession(token, secret, '123', 1000 + 8 * 3600), false);
  assert.equal(await verifySession(token, `${secret}x`, '123', 1001), false);
  assert.equal(await verifySession(`${token}x`, secret, '123', 1001), false);
  assert.equal(await verifySession(token, '', '123', 1001), false);
});
test('session cookie has browser security flags', () => {
  assert.match(sessionCookie('example'), /^__Host-camellia-session=/);
  assert.match(sessionCookie('example'), /; HttpOnly; Secure; SameSite=Lax$/);
});
