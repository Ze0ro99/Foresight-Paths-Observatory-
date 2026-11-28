export const PI_OAUTH_ME_URL = 'https://api.minepi.com/v2/me';

export class PiOAuthAuthError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'PiOAuthAuthError';
    this.status = status;
  }
}

export async function verifyPiOAuthAccessToken(accessToken, fetchImpl = fetch) {
  const token = typeof accessToken === 'string' ? accessToken.trim() : '';
  if (!token || token.length > 8192) {
    throw new PiOAuthAuthError('A valid Pi OAuth access token is required.', 400);
  }

  let response;
  try {
    response = await fetchImpl(PI_OAUTH_ME_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new PiOAuthAuthError('Pi identity verification service is unavailable.', 502);
  }

  if (!response.ok) {
    throw new PiOAuthAuthError('Pi rejected the OAuth access token.', response.status === 401 || response.status === 403 ? 401 : 502);
  }

  const payload = await response.json().catch(() => null);
  const uid = payload?.uid;
  const username = payload?.username;
  if (
    typeof uid !== 'string' || !uid.trim() || uid.length > 256 ||
    typeof username !== 'string' || !username.trim() || username.length > 64
  ) {
    throw new PiOAuthAuthError('Pi returned an invalid identity response.', 502);
  }

  return { sessionToken: token, user: { uid: uid.trim(), username: username.trim() } };
}
