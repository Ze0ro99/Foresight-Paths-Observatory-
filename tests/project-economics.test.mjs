import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProjectEconomics } from '../lib/project-economics.mjs';

const baseInput = {
  grossRevenuePi: '10',
  discountPercent: '5',
  taxPercent: '10',
  payrollPi: '2',
  inventoryCostPi: '1',
  operatingExpensesPi: '0.5',
  stressRevenueDropPercent: '20',
};

test('calculates Pi revenue, discounts, tax estimate, costs, and stress case in stroops', () => {
  const result = calculateProjectEconomics(baseInput);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.values.grossRevenueStroops, '100000000');
  assert.equal(result.values.discountsStroops, '5000000');
  assert.equal(result.values.netSalesStroops, '95000000');
  assert.equal(result.values.estimatedTaxStroops, '9500000');
  assert.equal(result.values.totalCostsStroops, '35000000');
  assert.equal(result.values.netProfitStroops, '50500000');
  assert.equal(result.values.marginBps, '5316');
  assert.equal(result.values.stressedSalesStroops, '76000000');
  assert.equal(result.values.stressedTaxStroops, '7600000');
  assert.equal(result.values.stressedNetProfitStroops, '33400000');
  assert.equal(result.values.stressedMarginBps, '4395');
});

test('keeps negative profit visible rather than clamping losses to zero', () => {
  const result = calculateProjectEconomics({
    ...baseInput,
    grossRevenuePi: '1',
    payrollPi: '2',
    inventoryCostPi: '1',
    operatingExpensesPi: '1',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.values.netProfitStroops, '-31450000');
  assert.equal(result.values.marginBps, '-33105');
});

test('rejects negative, exponent, malformed, and sub-stroop monetary input', () => {
  for (const grossRevenuePi of ['-1', '1e-7', '0.00000001', '01', 'NaN']) {
    const result = calculateProjectEconomics({ ...baseInput, grossRevenuePi });
    assert.equal(result.ok, false, grossRevenuePi);
    assert.equal(result.error, 'invalid_pi_amount');
  }
});

test('rejects percentages outside 0 to 100 and excess decimal precision', () => {
  for (const taxPercent of ['-1', '100.01', '101', '1.234', '1e2']) {
    const result = calculateProjectEconomics({ ...baseInput, taxPercent });
    assert.equal(result.ok, false, taxPercent);
    assert.equal(result.error, 'invalid_percentage');
  }
});

test('handles a 100 percent stress shock and a zero revenue denominator', () => {
  const result = calculateProjectEconomics({
    grossRevenuePi: '0',
    discountPercent: '0',
    taxPercent: '15',
    payrollPi: '0.1',
    inventoryCostPi: '0',
    operatingExpensesPi: '0',
    stressRevenueDropPercent: '100',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.values.marginBps, '0');
  assert.equal(result.values.stressedSalesStroops, '0');
  assert.equal(result.values.stressedTaxStroops, '0');
  assert.equal(result.values.stressedNetProfitStroops, '-1000000');
  assert.equal(result.values.stressedMarginBps, '0');
});

test('rounds percentage products to the nearest whole stroop using half-up rounding', () => {
  const result = calculateProjectEconomics({
    grossRevenuePi: '0.0000001',
    discountPercent: '50',
    taxPercent: '0',
    payrollPi: '0',
    inventoryCostPi: '0',
    operatingExpensesPi: '0',
    stressRevenueDropPercent: '0',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.values.discountsStroops, '1');
  assert.equal(result.values.netSalesStroops, '0');
});

test('rejects invalid arithmetic beyond the signed stroop range', () => {
  const result = calculateProjectEconomics({
    grossRevenuePi: '922337203685.4775807',
    discountPercent: '0',
    taxPercent: '0',
    payrollPi: '922337203685.4775807',
    inventoryCostPi: '1',
    operatingExpensesPi: '0',
    stressRevenueDropPercent: '0',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'calculation_overflow');
});
