import { stroopsToPi } from '@/lib/pi-fee.mjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

type LedgerResponse = {
  _embedded?: { records?: Array<{ sequence?: string; base_fee_in_stroops?: string | number; closed_at?: string }> };
};

export async function GET() {
  try {
    const response = await fetch(
      'https://api.testnet.minepi.com/ledgers?order=desc&limit=1',
      { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok) {
      return NextResponse.json(
        { network: 'Pi Testnet', status: 'unavailable', upstreamStatus: response.status },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const payload = (await response.json()) as LedgerResponse;
    const ledger = payload._embedded?.records?.[0];
    const rawFee = ledger?.base_fee_in_stroops;
    const validFee =
      (typeof rawFee === 'string' && /^\\d+$/.test(rawFee)) ||
      (typeof rawFee === 'number' && Number.isSafeInteger(rawFee) && rawFee >= 0);
    if (!ledger?.sequence || !validFee) {
      return NextResponse.json(
        { network: 'Pi Testnet', status: 'unavailable', reason: 'Latest ledger fee data is missing or invalid.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // Normalize Horizon's numeric or string JSON representation for a stable API contract.
    const baseFeeStroops = String(rawFee);
    return NextResponse.json(
      {
        network: 'Pi Testnet',
        status: 'connected',
        ledgerSequence: ledger.sequence,
        baseFeeStroops,
        baseFeePi: stroopsToPi(baseFeeStroops),
        ledgerClosedAt: ledger.closed_at ?? null,
        fetchedAtUtc: new Date().toISOString(),
        source: 'https://api.testnet.minepi.com/ledgers',
        mode: 'read-only; no signing or transfers',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : 'UnknownError';
    const details = error as Error & { cause?: { code?: string; message?: string } };
    const causeCode = details.cause?.code ?? null;
    console.warn('Pi Testnet Horizon fee request failed', { errorCode, causeCode, message: details.message?.slice(0, 160) });
    return NextResponse.json(
      { network: 'Pi Testnet', status: 'unavailable', errorCode, causeCode, reason: 'Testnet Horizon could not be reached.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
