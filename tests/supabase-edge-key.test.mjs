import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseAdminCredential } from '../supabase/functions/_shared/supabase-admin-key.mjs';

test('accepts the platform-injected modern Supabase secret key', () => {
  const credential = getSupabaseAdminCredential(JSON.stringify({ default: 'sb_secret_edge_key_value' }), undefined);
  assert.deepEqual(credential, { key: 'sb_secret_edge_key_value', legacy: false });
});

test('accepts only a legacy service_role JWT fallback', () => {
  const serviceRole = 'header.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature';
  const anon = 'header.eyJyb2xlIjoiYW5vbiJ9.signature';
  assert.deepEqual(getSupabaseAdminCredential(undefined, serviceRole), { key: serviceRole, legacy: true });
  assert.equal(getSupabaseAdminCredential(undefined, anon), null);
});

test('rejects public, malformed, and invalid secret-key values', () => {
  assert.equal(getSupabaseAdminCredential(JSON.stringify({ default: 'sb_publishable_public' }), undefined), null);
  assert.equal(getSupabaseAdminCredential(JSON.stringify({ default: 'not-a-secret' }), undefined), null);
  assert.equal(getSupabaseAdminCredential('{bad-json', 'not-a-jwt-service-key'), null);
  assert.equal(getSupabaseAdminCredential(undefined, ''), null);
});
