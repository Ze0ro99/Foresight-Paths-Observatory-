import { NextRequest, NextResponse } from 'next/server';
import { getPiGatewayReadiness } from '@/lib/pi-readiness.mjs';
import { openPiAppStudioSession, PI_APP_SESSION_COOKIE } from '@/lib/pi-appstudio-session.mjs';
import { AUTHORITATIVE_PLAN_PRICES_PI, getRecoverableTestnetPayment } from '@/lib/pi-payment.mjs';

export const dynamic = 'force-dynamic';

const PI_API_BASE = 'https://api.minepi.com/v2';
type PiUser = { uid: string; username: string };
type PiPayment = {
  identifier?: string;
  user_uid?: string;
  network?: 'Pi Network' | 'Pi Testnet';
  direction?: 'user_to_app' | 'app_to_user';
  amount?: number;
  metadata?: Record<string, unknown>;
  status?: {
    developer_approved?: boolean;
    transaction_verified?: boolean;
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
  transaction?: { txid?: string; verified?: boolean } | null;
};

type PaymentIntent = {
  id: string;
  pi_payment_id: string;
  pi_user_uid: string;
  amount_pi: string;
  plan_id: string;
  network: 'testnet';
  status: 'created' | 'approved' | 'completed' | 'cancelled' | 'failed' | 'reconciliation_required';
  pi_txid: string | null;
  transaction_verified: boolean;
};

function unavailable(message: string, status = 503) {
  return NextResponse.json(
    { verified: false, status: 'not_ready', error: message },
    { status }
  );
}

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  };
}

function hasDurableLedger() {
  return getPiGatewayReadiness().ledgerConfigured;
}

function getAuthenticatedPiUser(req: NextRequest): PiUser | null {
  const secret = process.env.PI_APP_SESSION_SECRET;
  const cookie = req.cookies.get(PI_APP_SESSION_COOKIE)?.value;
  if (!secret || !cookie) return null;
  const session = openPiAppStudioSession(cookie, secret);
  return session ? { uid: session.uid, username: session.username } : null;
}

function hasSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return Boolean(origin && origin === req.nextUrl.origin);
}

async function ledgerRpc<T>(name: string, body: Record<string, unknown>): Promise<T | null> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || key === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') return null;
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Private ledger RPC failed: ${response.status}`);
  return (await response.json()) as T;
}

async function getPaymentIntent(paymentId: string): Promise<PaymentIntent | null> {
  return ledgerRpc<PaymentIntent | null>('get_pi_payment_intent', {
    p_payment_id: paymentId,
  });
}

async function syncPaymentIntent(input: {
  paymentId: string;
  userUid: string;
  amountPi: string;
  planId: string;
  status: 'created' | 'approved' | 'completed';
  txid?: string;
  transactionVerified?: boolean;
}): Promise<PaymentIntent | null> {
  return ledgerRpc<PaymentIntent>('sync_pi_payment_intent', {
    p_payment_id: input.paymentId,
    p_user_uid: input.userUid,
    p_amount_pi: input.amountPi,
    p_plan_id: input.planId,
    p_status: input.status,
    p_txid: input.txid ?? null,
    p_transaction_verified: input.transactionVerified ?? false,
  });
}

async function piRequest<T>(
  path: string,
  apiKey: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const response = await fetch(PI_API_BASE + path, {
    ...init,
    headers: {
      Authorization: 'Key ' + apiKey,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function validatePayment(
  payment: PiPayment | null,
  user: PiUser,
  planId: string
): payment is PiPayment {
  if (!payment || !user.uid || !(planId in AUTHORITATIVE_PLAN_PRICES_PI)) return false;
  const expectedAmount = Number(AUTHORITATIVE_PLAN_PRICES_PI[planId]);
  return (
    payment.user_uid === user.uid &&
    payment.network === 'Pi Testnet' &&
    payment.direction === 'user_to_app' &&
    typeof payment.amount === 'number' &&
    Number.isFinite(payment.amount) &&
    Number(payment.amount.toFixed(7)) === expectedAmount &&
    payment.metadata?.planId === planId &&
    payment.metadata?.app === 'foresight-paths' &&
    payment.metadata?.network === 'Pi Testnet' &&
    payment.status?.cancelled !== true &&
    payment.status?.user_cancelled !== true
  );
}

function isPaymentReleaseEnabled() {
  return getPiGatewayReadiness().paymentEnabled;
}

async function recoverIncompletePayment(paymentId: string, expectedUserUid: string) {
  if (!isPaymentReleaseEnabled()) {
    return unavailable('Pi Testnet payment recovery is disabled until the server key, private ledger credentials, and Preview release gates are configured.');
  }
  const apiKey = process.env.PI_API_KEY?.trim();
  if (!apiKey) return unavailable('Testnet Server API Key is not configured.');

  const paymentPath = '/payments/' + encodeURIComponent(paymentId);
  const before = await piRequest<PiPayment>(paymentPath, apiKey);
  if (!before.ok || !before.data) {
    return unavailable('Pi could not retrieve the incomplete payment from this app account.', 502);
  }
  const recovered = getRecoverableTestnetPayment(before.data, paymentId, expectedUserUid);
  if (!recovered) {
    return unavailable('The Pi payment does not match this app, a server-priced Testnet plan, or a submitted Testnet U2A transaction.', 409);
  }

  const created = await syncPaymentIntent({
    paymentId: recovered.paymentId,
    userUid: recovered.userUid,
    amountPi: recovered.amountPi,
    planId: recovered.planId,
    status: 'created',
  });
  if (!created) return unavailable('The private payment ledger is not configured.', 503);

  if (created.status === 'completed') {
    if (created.transaction_verified && created.pi_txid === recovered.txid) {
      return NextResponse.json({
        completed: true,
        verified: true,
        recovered: true,
        idempotent: true,
        paymentId,
        txid: recovered.txid,
        planId: recovered.planId,
        entitlementGranted: false,
      });
    }
    return unavailable('The ledger already contains a conflicting completed transaction for this payment.', 409);
  }

  let intent = created;
  let paymentBeforeCompletion = before;
  if (intent.status === 'created') {
    if (!recovered.developerApproved) {
      const approval = await piRequest<unknown>(paymentPath + '/approve', apiKey, {
        method: 'POST',
      });
      if (!approval.ok) {
        return unavailable('Pi did not accept server-side approval for the incomplete Testnet payment.', 502);
      }
      paymentBeforeCompletion = await piRequest<PiPayment>(paymentPath, apiKey);
      if (!paymentBeforeCompletion.ok || paymentBeforeCompletion.data?.status?.developer_approved !== true) {
        return unavailable('Pi approval was submitted but its authoritative read-back is not yet confirmed.', 502);
      }
    }
    const approved = await syncPaymentIntent({
      paymentId,
      userUid: recovered.userUid,
      amountPi: recovered.amountPi,
      planId: recovered.planId,
      status: 'approved',
    });
    if (!approved || (approved.status !== 'approved' && approved.status !== 'completed')) {
      return unavailable('The incomplete payment could not be reconciled to an approved ledger intent.', 503);
    }
    intent = approved;
  }
  if (intent.status !== 'approved') {
    return unavailable('The incomplete payment is not in an approved state and requires manual review.', 409);
  }

  let readBack = paymentBeforeCompletion;
  const alreadyVerified =
    paymentBeforeCompletion.data?.status?.developer_completed === true &&
    paymentBeforeCompletion.data?.status?.transaction_verified === true &&
    paymentBeforeCompletion.data?.transaction?.verified === true &&
    paymentBeforeCompletion.data?.transaction?.txid === recovered.txid;
  if (!alreadyVerified) {
    const completion = await piRequest<PiPayment>(paymentPath + '/complete', apiKey, {
      method: 'POST',
      body: JSON.stringify({ txid: recovered.txid }),
    });
    if (!completion.ok) {
      return unavailable('Pi did not confirm server-side completion for the incomplete Testnet payment.', 502);
    }
    readBack = await piRequest<PiPayment>(paymentPath, apiKey);
  }

  const verified =
    readBack.ok &&
    readBack.data?.user_uid === recovered.userUid &&
    readBack.data?.network === 'Pi Testnet' &&
    readBack.data?.direction === 'user_to_app' &&
    readBack.data?.status?.transaction_verified === true &&
    readBack.data?.status?.developer_completed === true &&
    readBack.data?.transaction?.txid === recovered.txid &&
    readBack.data?.transaction?.verified === true;
  if (!verified) {
    return unavailable('Pi completion has not passed authoritative read-back verification. The payment remains blocked from reuse.', 502);
  }

  const completed = await syncPaymentIntent({
    paymentId,
    userUid: recovered.userUid,
    amountPi: recovered.amountPi,
    planId: recovered.planId,
    status: 'completed',
    txid: recovered.txid,
    transactionVerified: true,
  });
  if (!completed || completed.status !== 'completed' || completed.pi_txid !== recovered.txid || !completed.transaction_verified) {
    return unavailable('Pi verified the payment, but the private ledger could not confirm the final state. Manual reconciliation is required.', 503);
  }

  return NextResponse.json({
    completed: true,
    verified: true,
    recovered: true,
    idempotent: alreadyVerified,
    paymentId,
    txid: recovered.txid,
    planId: recovered.planId,
    authoritativePricePi: recovered.amountPi,
    ledgerStatus: completed.status,
    entitlementGranted: false,
    note: 'Incomplete Testnet payment recovered from the app-scoped Pi payment record. No paid entitlement was granted.',
  });
}

export async function GET() {
  const readiness = getPiGatewayReadiness();
  return NextResponse.json({
    service: 'Pi verification gateway',
    status: readiness.status,
    network: readiness.network,
    sandboxMode: readiness.sandboxMode,
    clientSandboxMode: readiness.clientSandboxMode,
    sandboxSettingsMatch: readiness.sandboxSettingsMatch,
    directTestnetEnabled: readiness.directTestnetEnabled,
    serverKeyConfigured: readiness.piApiKeyConfigured,
    ledgerConfigured: readiness.ledgerConfigured,
    paymentIntentLedgerReady: readiness.paymentIntentLedgerReady,
    missingRequirements: readiness.missingRequirements,
    entitlementDeliveryEnabled: false,
    paymentFlow: readiness.paymentEnabled
      ? 'testnet_server_verified_approval_and_completion_with_durable_intent_only'
      : 'disabled_until_testnet_credentials_and_release_gates_pass',
    paymentEnabled: readiness.paymentEnabled,
    plans: AUTHORITATIVE_PLAN_PRICES_PI,
    note: 'Only the registered Pi Testnet app is accepted. SDK Sandbox is a separate development setting and must match the server setting. Mainnet is rejected and no paid entitlement is granted by this route.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!hasSameOrigin(req)) {
    return NextResponse.json({ error: 'Same-origin Pi session required.' }, { status: 403 });
  }

  let body: {
    action?: 'auth_me' | 'payment_approve' | 'payment_complete' | 'payment_recover_incomplete' | 'rewarded_ad_verify';
    planId?: string;
    paymentId?: string;
    txid?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const action = body.action ?? 'auth_me';
  const user = getAuthenticatedPiUser(req);

  if (action === 'auth_me') {
    if (!user) return unavailable('A valid App Studio Pi session is required.', 401);
    return NextResponse.json({ verified: true, mode: 'appstudio_session', user });
  }

  if (action === 'payment_recover_incomplete') {
    if (!body.paymentId || !/^[A-Za-z0-9_-]{6,160}$/.test(body.paymentId)) {
      return NextResponse.json({ error: 'A valid paymentId is required.' }, { status: 400 });
    }
    if (!user?.uid) return unavailable('A verified App Studio Pi session is required for payment recovery.', 401);
    try {
      return await recoverIncompletePayment(body.paymentId, user.uid);
    } catch {
      return unavailable('Incomplete-payment recovery or private ledger service is temporarily unavailable.', 502);
    }
  }

  if (action === 'payment_approve' || action === 'payment_complete') {
    if (!isPaymentReleaseEnabled()) {
      return unavailable(
        'Pi Testnet payment processing is disabled until PI_API_KEY, the private Supabase ledger, and explicit Preview release flags are configured.'
      );
    }
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey || apiKey === 'MY_PI_PLATFORM_SERVER_API_KEY') {
      return unavailable('Testnet Server API Key is not configured.');
    }
    if (!user?.uid) return unavailable('A verified App Studio Pi session is required.', 401);
    if (!body.paymentId || !/^[A-Za-z0-9_-]{6,160}$/.test(body.paymentId)) {
      return NextResponse.json({ error: 'A valid paymentId is required.' }, { status: 400 });
    }
    if (!body.planId || !(body.planId in AUTHORITATIVE_PLAN_PRICES_PI)) {
      return NextResponse.json({ error: 'A valid server-priced planId is required.' }, { status: 400 });
    }
    if (action === 'payment_complete' && (!body.txid || body.txid.length > 200)) {
      return NextResponse.json({ error: 'A valid transaction txid is required.' }, { status: 400 });
    }

    try {
      const paymentPath = '/payments/' + encodeURIComponent(body.paymentId);
      const before = await piRequest<PiPayment>(paymentPath, apiKey);
      if (!before.ok || !validatePayment(before.data, user, body.planId)) {
        return unavailable(
          'Pi payment ownership, plan metadata, amount, or status did not match the server-side order.',
          409
        );
      }

      const expectedAmount = AUTHORITATIVE_PLAN_PRICES_PI[body.planId];

      if (action === 'payment_approve') {
        const created = await syncPaymentIntent({
          paymentId: body.paymentId,
          userUid: user.uid,
          amountPi: expectedAmount,
          planId: body.planId,
          status: 'created',
        });
        if (!created) return unavailable('The private payment ledger is not configured.', 503);
        if (created.status === 'completed') {
          return NextResponse.json({
            approved: true,
            completed: true,
            idempotent: true,
            paymentId: body.paymentId,
            planId: body.planId,
          });
        }
        if (!before.data.status?.developer_approved) {
          const approval = await piRequest<PiPayment>(paymentPath + '/approve', apiKey, {
            method: 'POST',
          });
          if (!approval.ok || !approval.data) {
            return unavailable('Pi did not confirm server-side payment approval.', 502);
          }
        }
        const approved = await syncPaymentIntent({
          paymentId: body.paymentId,
          userUid: user.uid,
          amountPi: expectedAmount,
          planId: body.planId,
          status: 'approved',
        });
        if (!approved || (approved.status !== 'approved' && approved.status !== 'completed')) {
          return unavailable('Pi approved the payment but durable ledger confirmation failed; retry for reconciliation.', 503);
        }
        return NextResponse.json({
          approved: true,
          idempotent: Boolean(before.data.status?.developer_approved),
          paymentId: body.paymentId,
          planId: body.planId,
          authoritativePricePi: expectedAmount,
          ledgerStatus: approved.status,
          mode: 'pi_testnet',
        });
      }

      const intent = await getPaymentIntent(body.paymentId);
      if (
        !intent ||
        intent.pi_user_uid !== user.uid ||
        intent.plan_id !== body.planId ||
        Number(intent.amount_pi) !== Number(expectedAmount) ||
        intent.network !== 'testnet'
      ) {
        return unavailable('No matching durable Testnet payment intent exists.', 409);
      }

      const txid = body.txid as string;
      if (intent.status === 'completed' && intent.transaction_verified && intent.pi_txid === txid) {
        return NextResponse.json({
          completed: true,
          verified: true,
          idempotent: true,
          paymentId: body.paymentId,
          txid,
          planId: body.planId,
          entitlementGranted: false,
        });
      }
      if (intent.status !== 'approved') {
        return unavailable('Payment intent must be approved before completion.', 409);
      }
      if (before.data.transaction?.txid && before.data.transaction.txid !== txid) {
        return unavailable('The supplied txid does not match the Pi payment record.', 409);
      }

      if (!before.data.status?.developer_completed || !before.data.status?.transaction_verified) {
        const completion = await piRequest<PiPayment>(paymentPath + '/complete', apiKey, {
          method: 'POST',
          body: JSON.stringify({ txid }),
        });
        if (!completion.ok) {
          return unavailable('Pi did not confirm server-side payment completion.', 502);
        }
      }

      const readBack = await piRequest<PiPayment>(paymentPath, apiKey);
      const verified =
        readBack.ok &&
        validatePayment(readBack.data, user, body.planId) &&
        readBack.data.status?.transaction_verified === true &&
        readBack.data.status?.developer_completed === true &&
        readBack.data.transaction?.txid === txid &&
        readBack.data.transaction?.verified === true;

      if (!verified) {
        return unavailable(
          'Pi completion was submitted, but authoritative read-back is not yet verified. No entitlement was granted.',
          502
        );
      }

      const completed = await syncPaymentIntent({
        paymentId: body.paymentId,
        userUid: user.uid,
        amountPi: expectedAmount,
        planId: body.planId,
        status: 'completed',
        txid,
        transactionVerified: true,
      });
      if (!completed || completed.status !== 'completed' || completed.pi_txid !== txid) {
        return unavailable('Pi settlement is verified, but durable ledger read-back failed. Retry for reconciliation.', 503);
      }

      return NextResponse.json({
        completed: true,
        verified: true,
        paymentId: body.paymentId,
        txid,
        planId: body.planId,
        authoritativePricePi: expectedAmount,
        ledgerStatus: completed.status,
        entitlementGranted: false,
        note: 'Testnet payment settlement and durable intent are verified. Product entitlements remain disabled pending a separately tested entitlement-delivery workflow.',
      });
    } catch {
      return unavailable('Pi Testnet payment or private ledger service is temporarily unavailable.', 502);
    }
  }

  if (action === 'rewarded_ad_verify') {
    return unavailable(
      'Rewarded-ad verification is disabled until a trusted ad callback is implemented and verified server-side.'
    );
  }

  return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
}
