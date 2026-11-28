import { NextResponse } from 'next/server';
import { getPiGatewayReadiness } from '@/lib/pi-readiness.mjs';
import { getGeminiModel } from '@/lib/gemini-config.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  const piReadiness = getPiGatewayReadiness();
  const piServerKeyConfigured = piReadiness.piApiKeyConfigured;
  const supabaseLedgerConfigured = piReadiness.ledgerConfigured;
  const piSandboxMode = piReadiness.sandboxMode;
  const piPaymentExecutionFlag = piReadiness.paymentFlagEnabled;
  const piIntentLedgerReady = piReadiness.paymentIntentLedgerReady;
  const piEntitlementLedgerEnabled = process.env.PI_ENTITLEMENT_LEDGER_ENABLED === 'true';
  const piMainnetReleaseFlag = process.env.PI_MAINNET_PAYMENTS_APPROVED === 'true';
  const piPaymentReleaseFlagsEnabled = piReadiness.releaseFlagsEnabled;
  const piPaymentExecutionEnabled = piReadiness.paymentEnabled;

  const checks = {
    application: 'ok',
    globalSense: 'available_with_partial_source_coverage',
    geminiAnalysis: geminiConfigured ? 'api_key_present_not_live_tested' : 'not_configured',
    geminiModel: getGeminiModel(),
    piIdentity: 'requires_pi_browser_session',
    paymentIntentLedger: piIntentLedgerReady ? 'ready_flag_set' : 'disabled',
    paidEntitlements: piEntitlementLedgerEnabled ? 'enabled_flag_set_but_not_implemented' : 'disabled',
    supabaseLedger: supabaseLedgerConfigured
      ? 'server_key_format_valid'
      : piReadiness.supabaseServerKeyKind === 'missing'
        ? 'read_only_data_only_private_ledger_key_missing'
        : 'read_only_data_only_invalid_server_key',
    supabaseServerKeyKind: piReadiness.supabaseServerKeyKind,
    piPayments: piReadiness.status,
    piPaymentMissingRequirements: piReadiness.missingRequirements,
    piPaymentExecutionEnabled,
    piPaymentReleaseFlags: {
      paymentExecution: piPaymentExecutionFlag,
      paymentIntentLedgerReady: piIntentLedgerReady,
      entitlementDelivery: piEntitlementLedgerEnabled,
      mainnetApproval: piMainnetReleaseFlag,
    },
    piSandboxMode,
    x402: 'read_only_discovery_only',
    cloudAgent: 'disabled_until_security_gates_pass',
    rewardedAds: 'disabled_until_provider_verification',
  };

  const ready = geminiConfigured && piServerKeyConfigured;

  return NextResponse.json(
    {
      status: ready ? 'operational_with_restricted_features' : 'operational_setup_incomplete',
      checkedAt: new Date().toISOString(),
      checks,
      note: 'This endpoint reports configuration only. It does not verify third-party credentials or guarantee upstream availability.',
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
