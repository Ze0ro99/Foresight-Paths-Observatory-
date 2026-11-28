import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStroopsAsPi,
  isMarketplaceUuid,
  normalizeMarketplaceCapabilityManifest,
  parsePiToStroops,
  parseStroops,
} from '../supabase/functions/agent-workbench/marketplace.mjs';

const manifest={
  execution_mode:'read_only',
  capabilities:['read_cisa_kev','report_generation'],
  input_types:['topic','region'],
  output_types:['plain_report','recommendations'],
  data_sources:['CISA_KEV'],
};

test('accepts only the bounded read-only capability manifest',()=>{
  assert.deepEqual(normalizeMarketplaceCapabilityManifest(manifest),manifest);
  assert.equal(normalizeMarketplaceCapabilityManifest({...manifest,execution_mode:'write'}),null);
  assert.equal(normalizeMarketplaceCapabilityManifest({...manifest,script:'fetch secrets'}),null);
  assert.equal(normalizeMarketplaceCapabilityManifest({...manifest,capabilities:['execute_shell']}),null);
  assert.equal(normalizeMarketplaceCapabilityManifest({...manifest,data_sources:['http://127.0.0.1']}),null);
  assert.equal(normalizeMarketplaceCapabilityManifest({...manifest,output_types:[]}),null);
});

test('parses Pi decimal prices to exact integer stroops without floating point',()=>{
  assert.equal(parsePiToStroops('0'),'0');
  assert.equal(parsePiToStroops('0.0000001'),'1');
  assert.equal(parsePiToStroops('0.1'),'1000000');
  assert.equal(parsePiToStroops('314.159'),'3141590000');
  assert.equal(parsePiToStroops('1.0000000'),'10000000');
  assert.equal(parsePiToStroops('0.00000001'),null);
  assert.equal(parsePiToStroops('-1'),null);
  assert.equal(parsePiToStroops('1e-7'),null);
  assert.equal(parsePiToStroops('01.0'),null);
  assert.equal(parsePiToStroops('922337203685.4775808'),null);
});

test('validates integer stroops and formats Pi values losslessly',()=>{
  assert.equal(parseStroops('1'),'1');
  assert.equal(parseStroops('9223372036854775807'),'9223372036854775807');
  assert.equal(parseStroops('9223372036854775808'),null);
  assert.equal(parseStroops('1.0'),null);
  assert.equal(formatStroopsAsPi('0'),'0');
  assert.equal(formatStroopsAsPi('1'),'0.0000001');
  assert.equal(formatStroopsAsPi('10000000'),'1');
  assert.equal(formatStroopsAsPi('10010000'),'1.001');
  assert.equal(formatStroopsAsPi('invalid'),null);
});

test('validates UUIDs used for listing identities and idempotency keys',()=>{
  assert.equal(isMarketplaceUuid('11111111-1111-4111-8111-111111111111'),true);
  assert.equal(isMarketplaceUuid('not-a-uuid'),false);
  assert.equal(isMarketplaceUuid('00000000-0000-0000-0000-000000000000'),false);
});