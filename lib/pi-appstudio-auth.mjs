export const PI_APPSTUDIO_LOGIN_URL =
  'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

export class PiAppStudioAuthError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'PiAppStudioAuthError';
    this.status = status;
  }
}

export async function exchangePiAccessToken(accessToken, fetchImpl = fetch) {
  const token = typeof accessToken === 'string' ? accessToken.trim() : '';
  if (!token || token.length > 8192) {
    throw new PiAppStudioAuthError('A valid Pi access token is required.', 400);
  }

  let response;
  try {
    response = await fetchImpl(PI_APPSTUDIO_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accessToken: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new PiAppStudioAuthError('App Studio authentication service is unavailable.', 502);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PiAppStudioAuthError(
      'App Studio rejected or could not validate the Pi access token.',
      response.status === 401 || response.status === 403 ? 401 : 502,
    );
  }

  const sessionToken = payload?.sessionToken;
  const uid = payload?.user?.uid;
  const username = payload?.user?.username;
  if (
    typeof sessionToken !== 'string' || sessionToken.trim().length < 8 || sessionToken.length > 8192 ||
    typeof uid !== 'string' || !uid.trim() || uid.length > 256 ||
    typeof username !== 'string' || !username.trim() || username.length > 64
  ) {
    throw new PiAppStudioAuthError('App Studio returned an invalid authentication response.', 502);
  }

  return {
    sessionToken: sessionToken.trim(),
    user: { uid: uid.trim(), username: username.trim() },
  };
}
