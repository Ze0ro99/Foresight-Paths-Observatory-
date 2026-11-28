import assert from 'node:assert/strict';
import test from 'node:test';
import { getPiGatewayReadiness } from '../lib/pi-readiness.mjs';

const configured = {
  PI_API_KEY: 'testnet-server-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  PI_NETWORK: 'Pi Testnet',
  PI_SANDBOX_MODE: 'true',
  NEXT_PUBLIC_PI_SANDBOX_MODE: 'true',
  PI_DIRECT_TESTNET_ENABLED: 'false',
  PI_PAYMENTS_ENABLED: 'true',
  PI_PAYMENT_INTENT_LEDGER_READY: 'true',
};

test('blank or whitespace server secrets are treated as missing', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_API_KEY: '   ',
    SUPABASE_SERVICE_ROLE_KEY: '',
  });
  assert.equal(result.paymentEnabled, false);
  assert.equal(result.status, 'awaiting_server_credentials');
  assert.deepEqual(result.missingRequirements.slice(0, 2), ['PI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);
});

test('placeholder server keys never enable Testnet payment execution', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_API_KEY: 'MY_PI_PLATFORM_SERVER_API_KEY',
    SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  });
  assert.equal(result.paymentEnabled, false);
  assert.equal(result.status, 'awaiting_server_credentials');
});

test('Sandbox Testnet payment requires credentials, explicit network, matching SDK settings, and release flags', () => {
  const result = getPiGatewayReadiness(configured);
  assert.equal(result.paymentEnabled, true);
  assert.equal(result.network, 'Pi Testnet');
  assert.equal(result.sandboxMode, true);
  assert.equal(result.clientSandboxMode, true);
  assert.equal(result.sandboxSettingsMatch, true);
  assert.equal(result.status, 'testnet_payment_release_enabled');
  assert.deepEqual(result.missingRequirements, []);
});

test('direct SDK mode is permitted only with explicit Testnet network, matching browser setting, and direct-mode flag', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_SANDBOX_MODE: 'false',
    NEXT_PUBLIC_PI_SANDBOX_MODE: 'false',
    PI_DIRECT_TESTNET_ENABLED: 'true',
  });
  assert.equal(result.paymentEnabled, true);
  assert.equal(result.sandboxMode, false);
  assert.equal(result.clientSandboxMode, false);
  assert.equal(result.directTestnetEnabled, true);
  assert.equal(result.network, 'Pi Testnet');
});

test('sandbox false without the direct Testnet flag fails closed', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_SANDBOX_MODE: 'false',
    NEXT_PUBLIC_PI_SANDBOX_MODE: 'false',
    PI_DIRECT_TESTNET_ENABLED: 'false',
  });
  assert.equal(result.paymentEnabled, false);
  assert.equal(result.status, 'direct_testnet_mode_not_enabled');
  assert.ok(result.missingRequirements.includes('PI_DIRECT_TESTNET_ENABLED=true'));
});

test('mismatched server and browser sandbox settings fail closed', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_SANDBOX_MODE: 'false',
    NEXT_PUBLIC_PI_SANDBOX_MODE: 'true',
    PI_DIRECT_TESTNET_ENABLED: 'true',
  });
  assert.equal(result.paymentEnabled, false);
  assert.equal(result.status, 'sandbox_mode_mismatch');
  assert.ok(result.missingRequirements.includes('NEXT_PUBLIC_PI_SANDBOX_MODE must match PI_SANDBOX_MODE'));
});

test('Mainnet or any unsupported network cannot pass the Testnet release gate', () => {
  for (const network of ['Pi Network', 'mainnet', '']) {
    const result = getPiGatewayReadiness({ ...configured, PI_NETWORK: network });
    assert.equal(result.paymentEnabled, false);
    assert.equal(result.status, 'testnet_network_not_explicit');
    assert.ok(result.missingRequirements.includes('PI_NETWORK=Pi Testnet'));
  }
});

test('a missing payment-intent ledger flag keeps payments disabled', () => {
  const result = getPiGatewayReadiness({
    ...configured,
    PI_PAYMENT_INTENT_LEDGER_READY: 'false',
  });
  assert.equal(result.paymentEnabled, false);
  assert.equal(result.status, 'payments_disabled_pending_release_gates');
  assert.ok(result.missingRequirements.includes('PI_PAYMENT_INTENT_LEDGER_READY=true'));
});
