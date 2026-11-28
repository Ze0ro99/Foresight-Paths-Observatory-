import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

export const PI_APP_SESSION_COOKIE = 'foresight_pi_session';
export const PI_APP_SESSION_TTL_SECONDS = 60 * 60 * 24;

function deriveKey(secret) {
  if (typeof secret !== 'string' || secret.trim().length < 32) {
    throw new Error('PI_APP_SESSION_SECRET must contain at least 32 characters.');
  }
  return createHash('sha256').update(secret, 'utf8').digest();
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function sealPiAppStudioSession(
  identity,
  secret,
  now = Date.now(),
  ttlSeconds = PI_APP_SESSION_TTL_SECONDS,
) {
  if (
    !validText(identity?.sessionToken, 8192) ||
    !validText(identity?.user?.uid, 256) ||
    !validText(identity?.user?.username, 64) ||
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < 1 ||
    ttlSeconds > PI_APP_SESSION_TTL_SECONDS
  ) {
    throw new Error('A complete and valid Pi identity is required.');
  }

  const issuedAt = Math.floor(now / 1000);
  const payload = {
    version: 1,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
    sessionToken: identity.sessionToken,
    uid: identity.user.uid,
    username: identity.user.username,
  };

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);

  return [
    'v1',
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
  ].join('.');
}

export function openPiAppStudioSession(cookieValue, secret, now = Date.now()) {
  if (typeof cookieValue !== 'string' || cookieValue.length > 12000) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;

  try {
    const iv = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');
    const tag = Buffer.from(parts[3], 'base64url');
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) return null;

    const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const payload = JSON.parse(Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8'));
    const nowSeconds = Math.floor(now / 1000);

    if (
      payload?.version !== 1 ||
      !Number.isInteger(payload.issuedAt) ||
      !Number.isInteger(payload.expiresAt) ||
      payload.issuedAt > nowSeconds + 60 ||
      payload.expiresAt <= nowSeconds ||
      payload.expiresAt - payload.issuedAt > PI_APP_SESSION_TTL_SECONDS ||
      !validText(payload.sessionToken, 8192) ||
      !validText(payload.uid, 256) ||
      !validText(payload.username, 64)
    ) return null;

    return {
      sessionToken: payload.sessionToken,
      uid: payload.uid,
      username: payload.username,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}
