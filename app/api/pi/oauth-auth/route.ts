import { NextRequest, NextResponse } from 'next/server';
import { verifyPiOAuthAccessToken, PiOAuthAuthError } from '@/lib/pi-oauth-auth.mjs';
import {
  openPiAppStudioSession,
  sealPiAppStudioSession,
} from '@/lib/pi-appstudio-session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const PI_OAUTH_SESSION_COOKIE = 'foresight_pi_oauth_session';
const PI_OAUTH_SESSION_TTL_SECONDS = 3600;

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

function readOAuthSession(req: NextRequest) {
  const secret = process.env.PI_APP_SESSION_SECRET;
  const value = req.cookies.get(PI_OAUTH_SESSION_COOKIE)?.value;
  if (!secret || !value) return null;
  return openPiAppStudioSession(value, secret);
}

export async function GET(req: NextRequest) {
  const session = readOAuthSession(req);
  if (!session) return noStore(NextResponse.json({ authenticated: false }, { status: 401 }));
  return noStore(NextResponse.json({
    authenticated: true,
    user: { uid: session.uid, username: session.username },
    expiresAt: session.expiresAt,
  }));
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) {
    return noStore(NextResponse.json({ error: 'Same-origin authentication is required.' }, { status: 403 }));
  }

  const secret = process.env.PI_APP_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return noStore(NextResponse.json({ error: 'App session encryption is not configured.' }, { status: 503 }));
  }

  let body: { accessToken?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 12000) {
      return noStore(NextResponse.json({ error: 'Authentication request is too large.' }, { status: 413 }));
    }
    body = JSON.parse(raw);
  } catch {
    return noStore(NextResponse.json({ error: 'A valid JSON body is required.' }, { status: 400 }));
  }

  try {
    const identity = await verifyPiOAuthAccessToken(body.accessToken);
    const encryptedSession = sealPiAppStudioSession(
      identity,
      secret,
      Date.now(),
      PI_OAUTH_SESSION_TTL_SECONDS,
    );
    const response = NextResponse.json({ authenticated: true, user: identity.user });
    response.cookies.set(PI_OAUTH_SESSION_COOKIE, encryptedSession, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: PI_OAUTH_SESSION_TTL_SECONDS,
    });
    return noStore(response);
  } catch (error) {
    const status = error instanceof PiOAuthAuthError ? error.status : 502;
    return noStore(NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Pi OAuth sign-in failed.',
    }, { status }));
  }
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) {
    return noStore(NextResponse.json({ error: 'Same-origin logout is required.' }, { status: 403 }));
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PI_OAUTH_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
  return noStore(response);
}
