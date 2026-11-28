import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseServerHeaders, getSupabaseServerKeyKind } from '../lib/supabase-server-headers.mjs';

test('modern secret keys are sent only in apikey', () => {
  assert.deepEqual(getSupabaseServerHeaders('sb_secret_server_key'), { apikey: 'sb_secret_server_key' });
});

test('legacy service_role JWTs are accepted, but anon JWTs are rejected', () => {
  const serviceRole = 'header.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature';
  const anon = 'header.eyJyb2xlIjoiYW5vbiJ9.signature';
  assert.equal(getSupabaseServerKeyKind(serviceRole), 'legacy_service_role_jwt');
  assert.deepEqual(getSupabaseServerHeaders(serviceRole), { apikey: serviceRole, Authorization: 'Bearer ' + serviceRole });
  assert.equal(getSupabaseServerKeyKind(anon), 'legacy_anon_jwt');
  assert.throws(() => getSupabaseServerHeaders(anon), /elevated Supabase server key/);
});

test('publishable, unknown, malformed and empty keys are rejected', () => {
  for (const key of ['sb_publishable_public_key', 'not-a-key', 'header.payload.signature', '']) {
    assert.throws(() => getSupabaseServerHeaders(key), /Supabase server API key|elevated Supabase server key/);
  }
});
