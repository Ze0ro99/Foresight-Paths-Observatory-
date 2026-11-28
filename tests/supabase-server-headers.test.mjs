import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseServerHeaders, getSupabaseServerKeyKind } from '../lib/supabase-server-headers.mjs';

test('sends a modern Supabase secret key through apikey only', () => {
  const headers = getSupabaseServerHeaders('sb_secret_example_key');
  assert.deepEqual(headers, { apikey: 'sb_secret_example_key' });
  assert.equal('Authorization' in headers, false);
});

test('keeps the legacy service-role JWT compatibility header', () => {
  const key = 'header.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature';
  assert.deepEqual(getSupabaseServerHeaders(key), {
    apikey: key,
    Authorization: 'Bearer ' + key,
  });
});

test('trims API keys and rejects empty values', () => {
  assert.deepEqual(getSupabaseServerHeaders('  sb_secret_example_key  '), {
    apikey: 'sb_secret_example_key',
  });
  assert.throws(() => getSupabaseServerHeaders('part.one.two.three'), /elevated Supabase server key/);
  assert.throws(() => getSupabaseServerHeaders('sb_publishable_example_key'), /elevated Supabase server key/);
  assert.throws(() => getSupabaseServerHeaders('header.eyJyb2xlIjoiYW5vbiJ9.signature'), /elevated Supabase server key/);
  assert.throws(() => getSupabaseServerHeaders('not-a-key'), /elevated Supabase server key/);
  assert.throws(() => getSupabaseServerHeaders('  '), /required/);
});

test('classifies supported Supabase server key formats without exposing key values', () => {
  assert.equal(getSupabaseServerKeyKind('sb_secret_example_key'), 'secret_key');
  assert.equal(getSupabaseServerKeyKind('sb_publishable_example_key'), 'publishable_key');
  assert.equal(getSupabaseServerKeyKind('header.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature'), 'legacy_service_role_jwt');
  assert.equal(getSupabaseServerKeyKind('header.eyJyb2xlIjoiYW5vbiJ9.signature'), 'legacy_anon_jwt');
  assert.equal(getSupabaseServerKeyKind('part.one.two.three'), 'unrecognized');
  assert.equal(getSupabaseServerKeyKind(''), 'missing');
});
