import test from 'node:test';
import assert from 'node:assert/strict';
import {
  openPiAppStudioSession,
  sealPiAppStudioSession,
  PI_APP_SESSION_TTL_SECONDS,
} from '../lib/pi-appstudio-session.mjs';

const secret = 'test-only-session-secret-long-enough-for-aes-gcm';

test('encrypts the App Studio session and restores App Studio identity', () => {
  const identity = {
    sessionToken: 'appstudio-sensitive-session-token',
    user: { uid: 'appstudio-uid', username: 'appstudio-user' },
  };
  const now = 1_800_000_000_000;
  const cookie = sealPiAppStudioSession(identity, secret, now);
  assert.equal(cookie.includes(identity.sessionToken), false);
  assert.equal(cookie.includes(identity.user.uid), false);

  const restored = openPiAppStudioSession(cookie, secret, now + 100_000);
  assert.deepEqual(
    { uid: restored.uid, username: restored.username, sessionToken: restored.sessionToken },
    { uid: 'appstudio-uid', username: 'appstudio-user', sessionToken: 'appstudio-sensitive-session-token' },
  );
});

test('rejects tampered, expired, and wrongly keyed session cookies', () => {
  const now = 1_800_000_000_000;
  const cookie = sealPiAppStudioSession({
    sessionToken: 'appstudio-token',
    user: { uid: 'uid', username: 'username' },
  }, secret, now);

  assert.equal(openPiAppStudioSession(cookie + 'x', secret, now + 100_000), null);
  assert.equal(openPiAppStudioSession(cookie, 'another-long-session-secret-value-0000', now + 100_000), null);
  assert.equal(openPiAppStudioSession(cookie, secret, now + (PI_APP_SESSION_TTL_SECONDS + 1) * 1000), null);
});

test('rejects weak secrets and incomplete App Studio identity', () => {
  assert.throws(() => sealPiAppStudioSession({
    sessionToken: 'token',
    user: { uid: 'uid', username: 'name' },
  }, 'short'));
  assert.throws(() => sealPiAppStudioSession({
    sessionToken: 'token',
    user: { uid: '', username: 'name' },
  }, secret));
});

test('supports a one-hour OAuth session lifetime', () => {
  const now = 1_800_000_000_000;
  const cookie = sealPiAppStudioSession({
    sessionToken: 'oauth-access-token',
    user: { uid: 'oauth-uid', username: 'oauth-user' },
  }, secret, now, 3600);

  assert.ok(openPiAppStudioSession(cookie, secret, now + 3599_000));
  assert.equal(openPiAppStudioSession(cookie, secret, now + 3600_000), null);
});
