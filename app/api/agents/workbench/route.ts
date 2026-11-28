import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S{20,4096}$/i.test(authorization)) {
    return NextResponse.json({ ok: false, error: "Sign in with Pi Browser to use your private workbench." }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!base || !publishableKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base)) {
    return NextResponse.json({ ok: false, error: "The Testnet workbench is waiting for its public Supabase Preview configuration." }, { status: 503 });
  }

  try {
    const upstream = await fetch(base + "/functions/v1/agent-workbench", {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "The Testnet workbench could not be reached. No external action was taken." }, { status: 502 });
  }
}
