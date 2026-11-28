import test from 'node:test';
import assert from 'node:assert/strict';
import { exchangePiAccessToken, PI_APPSTUDIO_LOGIN_URL } from '../lib/pi-appstudio-auth.mjs';

test('exchanges only Pi accessToken with the exact App Studio login endpoint', async () => {
  let captured;
  const identity = await exchangePiAccessToken('pi-access-token-value', async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({
      sessionToken: 'app-studio-session-secret-value',
      user: { uid: 'trusted-pi-uid', username: 'trusted-pioneer' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  assert.equal(captured.url, PI_APPSTUDIO_LOGIN_URL);
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers['Content-Type'], 'application/json');
  assert.deepEqual(captured.body, { accessToken: 'pi-access-token-value' });
  assert.deepEqual(identity.user, { uid: 'trusted-pi-uid', username: 'trusted-pioneer' });
  assert.equal(identity.sessionToken, 'app-studio-session-secret-value');
});

test('does not send browser uid or username to App Studio', async () => {
  let body;
  await exchangePiAccessToken('pi-access-token', async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({
      sessionToken: 'server-session-token',
      user: { uid: 'appstudio-uid', username: 'appstudio-user' },
    }), { status: 200 });
  });
  assert.deepEqual(Object.keys(body), ['accessToken']);
  assert.equal(body.uid, undefined);
  assert.equal(body.username, undefined);
});

test('rejects invalid access tokens before making a request', async () => {
  let called = false;
  await assert.rejects(
    exchangePiAccessToken(' ', async () => { called = true; }),
    /valid Pi access token/,
  );
  assert.equal(called, false);
});

test('rejects App Studio authentication failures and malformed response identity', async () => {
  await assert.rejects(
    exchangePiAccessToken('token', async () => new Response('{}', { status: 401 })),
    /App Studio rejected/,
  );
  await assert.rejects(
    exchangePiAccessToken('token', async () => new Response(JSON.stringify({
      sessionToken: 'session-token',
      user: { uid: 'some-id', username: '' },
    }), { status: 200 })),
    /invalid authentication response/,
  );
});
