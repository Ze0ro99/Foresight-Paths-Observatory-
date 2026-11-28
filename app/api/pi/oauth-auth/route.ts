import { NextRequest, NextResponse } from 'next/server';
import { verifyPiOAuthAccessToken, PiOAuthAuthError } from '@/lib/pi-oauth-auth.mjs';
import {
  PI_APP_SESSION_COOKIE,
  sealPiAppStudioSession,
} from '@/lib/pi-appstudio-session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
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
    // OAuth implicit access tokens expire after about one hour; cap this session accordingly.
    const encryptedSession = sealPiAppStudioSession(identity, secret, Date.now(), 3600);
    const response = NextResponse.json({ authenticated: true, user: identity.user });
    response.cookies.set(PI_APP_SESSION_COOKIE, encryptedSession, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 3600,
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
