import { NextRequest, NextResponse } from 'next/server';
import { exchangePiAccessToken, PiAppStudioAuthError } from '@/lib/pi-appstudio-auth.mjs';
import {
  openPiAppStudioSession,
  PI_APP_SESSION_COOKIE,
  PI_APP_SESSION_TTL_SECONDS,
  sealPiAppStudioSession,
} from '@/lib/pi-appstudio-session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return Boolean(origin && origin === req.nextUrl.origin);
}

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

function getSession(req: NextRequest) {
  const secret = process.env.PI_APP_SESSION_SECRET;
  const encrypted = req.cookies.get(PI_APP_SESSION_COOKIE)?.value;
  if (!secret || !encrypted) return null;
  return openPiAppStudioSession(encrypted, secret);
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return noStore(NextResponse.json({ authenticated: false }, { status: 401 }));
  }

  return noStore(NextResponse.json({
    authenticated: true,
    user: { uid: session.uid, username: session.username },
    expiresAt: session.expiresAt,
  }));
}

export async function POST(req: NextRequest) {
  if (!hasSameOrigin(req)) {
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

  // Browser-supplied uid and username are ignored. Only App Studio establishes identity.
  try {
    const verified = await exchangePiAccessToken(body.accessToken);
    const encryptedSession = sealPiAppStudioSession(verified, secret);
    if (encryptedSession.length > 3800) {
      return noStore(NextResponse.json({ error: 'App Studio session is too large for a secure browser cookie.' }, { status: 502 }));
    }

    const response = NextResponse.json({
      authenticated: true,
      user: verified.user,
    });
    response.cookies.set(PI_APP_SESSION_COOKIE, encryptedSession, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: PI_APP_SESSION_TTL_SECONDS,
    });
    return noStore(response);
  } catch (error) {
    const status = error instanceof PiAppStudioAuthError ? error.status : 502;
    return noStore(NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Pi authentication failed.',
    }, { status }));
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasSameOrigin(req)) {
    return noStore(NextResponse.json({ error: 'Same-origin logout is required.' }, { status: 403 }));
  }

  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PI_APP_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
  return noStore(response);
}
