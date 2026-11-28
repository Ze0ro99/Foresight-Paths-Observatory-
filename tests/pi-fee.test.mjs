import test from 'node:test';
import assert from 'node:assert/strict';
import { stroopsToPi } from '../lib/pi-fee.mjs';

test('converts string and numeric stroops to Pi without floating-point rounding', () => {
  assert.equal(stroopsToPi('0'), '0');
  assert.equal(stroopsToPi('1'), '0.0000001');
  assert.equal(stroopsToPi('100000'), '0.01');
  assert.equal(stroopsToPi('1000000'), '0.1');
  assert.equal(stroopsToPi('10000000'), '1');
  assert.equal(stroopsToPi('12345678'), '1.2345678');
  assert.equal(stroopsToPi('900719925474099100000'), '90071992547409.91');
  assert.equal(stroopsToPi(0), '0');
  assert.equal(stroopsToPi(1), '0.0000001');
  assert.equal(stroopsToPi(10000000), '1');
});

test('rejects non-integer and unsafe fee representations', () => {
  for (const value of ['', '-1', '1.5', '1e7', 'NaN', ' 10', -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => stroopsToPi(value), TypeError);
  }
});
