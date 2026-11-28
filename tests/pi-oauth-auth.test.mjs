import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPiOAuthAccessToken, PI_OAUTH_ME_URL } from '../lib/pi-oauth-auth.mjs';

test('verifies OAuth access tokens against Pi /v2/me and trusts only the response identity', async () => {
  let captured;
  const identity = await verifyPiOAuthAccessToken('oauth-access-token', async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ uid: 'verified-uid', username: 'verified-user' }), { status: 200 });
  });
  assert.equal(captured.url, PI_OAUTH_ME_URL);
  assert.equal(captured.init.method, 'GET');
  assert.equal(captured.init.headers.Authorization, 'Bearer oauth-access-token');
  assert.deepEqual(identity.user, { uid: 'verified-uid', username: 'verified-user' });
  assert.equal(identity.sessionToken, 'oauth-access-token');
});

test('rejects empty tokens before making a request', async () => {
  let called = false;
  await assert.rejects(verifyPiOAuthAccessToken(' ', async () => { called = true; }), /valid Pi OAuth access token/);
  assert.equal(called, false);
});

test('rejects invalid token and malformed identity responses', async () => {
  await assert.rejects(verifyPiOAuthAccessToken('token', async () => new Response('{}', { status: 401 })), /rejected/);
  await assert.rejects(verifyPiOAuthAccessToken('token', async () => new Response(JSON.stringify({ uid: 'uid', username: '' }), { status: 200 })), /invalid identity/);
});
