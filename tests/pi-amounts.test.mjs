import test from 'node:test';
import assert from 'node:assert/strict';
import {formatStroopsAsPi,parsePiToStroops} from '../lib/pi-amounts.mjs';

test('converts decimal Pi prices exactly to seven-decimal stroops',()=>{
  assert.equal(parsePiToStroops('0.0000001'),'1');
  assert.equal(parsePiToStroops('0.0000002'),'2');
  assert.equal(parsePiToStroops('0.01'),'100000');
  assert.equal(parsePiToStroops('1'),'10000000');
  assert.equal(parsePiToStroops('1.0000001'),'10000001');
});
test('rejects sub-stroop precision, negatives, exponent notation and overflow',()=>{
  for(const value of ['0.00000001','-1','1e-7','01','NaN','Infinity','922337203685.4775808'])assert.equal(parsePiToStroops(value),null,value);
});
test('formats integer stroops without floating-point rounding',()=>{
  assert.equal(formatStroopsAsPi('1'),'0.0000001');
  assert.equal(formatStroopsAsPi('100000'),'0.01');
  assert.equal(formatStroopsAsPi('10000000'),'1');
  assert.equal(formatStroopsAsPi('10010000'),'1.001');
  assert.equal(formatStroopsAsPi('0'),'0');
});