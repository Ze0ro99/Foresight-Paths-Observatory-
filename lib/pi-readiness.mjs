import { getSupabaseServerKeyKind } from './supabase-server-headers.mjs';

const PLACEHOLDER_PI_KEY = 'MY_PI_PLATFORM_SERVER_API_KEY';
const PLACEHOLDER_SUPABASE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

function isConfiguredSecret(value, placeholder) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim() !== placeholder;
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  try {
    return new URL(value.trim()).protocol === 'https:';
  } catch {
    return false;
  }
}

export function getPiGatewayReadiness(env = process.env) {
  const piApiKeyConfigured = isConfiguredSecret(env.PI_API_KEY, PLACEHOLDER_PI_KEY);
  const supabaseUrlConfigured = isHttpsUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServerKeyKind = getSupabaseServerKeyKind(env.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseServiceRoleKeyConfigured =
    isConfiguredSecret(env.SUPABASE_SERVICE_ROLE_KEY, PLACEHOLDER_SUPABASE_KEY) &&
    (supabaseServerKeyKind === 'secret_key' || supabaseServerKeyKind === 'legacy_service_role_jwt');
  const ledgerConfigured = supabaseUrlConfigured && supabaseServiceRoleKeyConfigured;
  const sandboxMode = env.PI_SANDBOX_MODE !== 'false';
  const clientSandboxMode = env.NEXT_PUBLIC_PI_SANDBOX_MODE !== 'false';
  const sandboxSettingsMatch = sandboxMode === clientSandboxMode;
  const network = typeof env.PI_NETWORK === 'string' ? env.PI_NETWORK.trim() : '';
  const testnetNetworkConfigured = network === 'Pi Testnet';
  const directTestnetEnabled = env.PI_DIRECT_TESTNET_ENABLED === 'true';
  const paymentFlagEnabled = env.PI_PAYMENTS_ENABLED === 'true';
  const paymentIntentLedgerReady = env.PI_PAYMENT_INTENT_LEDGER_READY === 'true';
  const sdkModeAllowed = sandboxSettingsMatch && (sandboxMode || (testnetNetworkConfigured && directTestnetEnabled));
  const releaseFlagsEnabled = testnetNetworkConfigured && sdkModeAllowed && paymentFlagEnabled && paymentIntentLedgerReady;

  const missingRequirements = [];
  if (!piApiKeyConfigured) missingRequirements.push('PI_API_KEY');
  if (!supabaseUrlConfigured) missingRequirements.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKeyConfigured) missingRequirements.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!testnetNetworkConfigured) missingRequirements.push('PI_NETWORK=Pi Testnet');
  if (!sandboxSettingsMatch) missingRequirements.push('NEXT_PUBLIC_PI_SANDBOX_MODE must match PI_SANDBOX_MODE');
  if (!sandboxMode && !directTestnetEnabled) missingRequirements.push('PI_DIRECT_TESTNET_ENABLED=true');
  if (!paymentFlagEnabled) missingRequirements.push('PI_PAYMENTS_ENABLED=true');
  if (!paymentIntentLedgerReady) missingRequirements.push('PI_PAYMENT_INTENT_LEDGER_READY=true');

  const paymentEnabled = piApiKeyConfigured && ledgerConfigured && releaseFlagsEnabled;
  let status = 'testnet_payment_release_enabled';
  if (!piApiKeyConfigured && !ledgerConfigured) status = 'awaiting_server_credentials';
  else if (!piApiKeyConfigured) status = 'awaiting_server_key';
  else if (!ledgerConfigured) status = 'awaiting_private_ledger_credentials';
  else if (!testnetNetworkConfigured) status = 'testnet_network_not_explicit';
  else if (!sandboxSettingsMatch) status = 'sandbox_mode_mismatch';
  else if (!sandboxMode && !directTestnetEnabled) status = 'direct_testnet_mode_not_enabled';
  else if (!paymentFlagEnabled || !paymentIntentLedgerReady) status = 'payments_disabled_pending_release_gates';

  return {
    piApiKeyConfigured,
    supabaseUrlConfigured,
    supabaseServiceRoleKeyConfigured,
    supabaseServerKeyKind,
    ledgerConfigured,
    network: testnetNetworkConfigured ? 'Pi Testnet' : 'unconfigured_or_unsupported',
    sandboxMode,
    clientSandboxMode,
    sandboxSettingsMatch,
    directTestnetEnabled,
    paymentFlagEnabled,
    paymentIntentLedgerReady,
    releaseFlagsEnabled,
    paymentEnabled,
    status,
    missingRequirements,
  };
}
