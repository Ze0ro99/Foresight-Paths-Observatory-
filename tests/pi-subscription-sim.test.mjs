import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStroopsAsPi,
  isValidPiWalletAddress,
  isValidSubscriptionServiceId,
  maxSubscriptionPeriods,
} from '../lib/pi-subscription-sim.mjs';

test('accepts only canonical Pi/Stellar public wallet addresses', () => {
  assert.equal(isValidPiWalletAddress('G' + 'A'.repeat(55)), true);
  assert.equal(isValidPiWalletAddress('C' + 'A'.repeat(55)), false);
  assert.equal(isValidPiWalletAddress('G' + 'A'.repeat(54)), false);
  assert.equal(isValidPiWalletAddress('G' + 'a'.repeat(55)), false);
  assert.equal(isValidPiWalletAddress('https://example.com'), false);
});

test('accepts numeric non-negative Developer Portal service IDs only', () => {
  assert.equal(isValidSubscriptionServiceId('0'), true);
  assert.equal(isValidSubscriptionServiceId('42'), true);
  assert.equal(isValidSubscriptionServiceId('01'), false);
  assert.equal(isValidSubscriptionServiceId('-1'), false);
  assert.equal(isValidSubscriptionServiceId('1.2'), false);
  assert.equal(isValidSubscriptionServiceId('https://example.com'), false);
});

test('calculates Testnet v1 approval windows, including free-trial time', () => {
  assert.equal(maxSubscriptionPeriods('2629746'), 5);
  assert.equal(maxSubscriptionPeriods('604800'), 25);
  assert.equal(maxSubscriptionPeriods('2629746', '2629746'), 4);
  assert.equal(maxSubscriptionPeriods('604800', '604800'), 24);
  assert.equal(maxSubscriptionPeriods('604800', '999999999999999999'), 0);
  assert.equal(maxSubscriptionPeriods('604800', '-1'), 0);
  assert.equal(maxSubscriptionPeriods('20000000'), 0);
  assert.equal(maxSubscriptionPeriods('0'), 0);
  assert.equal(maxSubscriptionPeriods('not-a-number'), 0);
});

test('formats stroops without floating-point rounding', () => {
  assert.equal(formatStroopsAsPi('1'), '0.0000001');
  assert.equal(formatStroopsAsPi('10000000'), '1');
  assert.equal(formatStroopsAsPi('12500000'), '1.25');
  assert.equal(formatStroopsAsPi('50000000'), '5');
  assert.throws(() => formatStroopsAsPi('-1'), TypeError);
  assert.throws(() => formatStroopsAsPi('1.5'), TypeError);
});
