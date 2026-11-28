import { parsePiToStroops } from './pi-amounts.mjs';

const MAX_INT64 = 9223372036854775807n;
const BASIS_POINT_DENOMINATOR = 10000n;

function parsePercentToBasisPoints(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(0|[1-9][0-9]{0,2})(?:\.([0-9]{1,2}))?$/);
  if (!match) return null;

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] || '').padEnd(2, '0') || '0');
  const basisPoints = whole * 100n + fraction;
  return basisPoints <= BASIS_POINT_DENOMINATOR ? basisPoints : null;
}

function roundHalfUp(numerator, denominator = BASIS_POINT_DENOMINATOR) {
  return (numerator + denominator / 2n) / denominator;
}

function signedRoundHalfUp(numerator, denominator) {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return sign * roundHalfUp(absolute, denominator);
}

function withinSignedInt64(value) {
  return value <= MAX_INT64 && value >= -MAX_INT64;
}

/**
 * Offline project cash-flow calculator. Every amount is parsed from Pi into
 * integer stroops; percentages are supplied explicitly by the user.
 *
 * @param {{
 *   grossRevenuePi?: string,
 *   discountPercent?: string,
 *   taxPercent?: string,
 *   payrollPi?: string,
 *   inventoryCostPi?: string,
 *   operatingExpensesPi?: string,
 *   stressRevenueDropPercent?: string
 * }} input
 * @returns {{ok: true, values: Record<string, string>} | {ok: false, error: string, field?: string}}
 */
export function calculateProjectEconomics(input = {}) {
  const amountFields = [
    'grossRevenuePi',
    'payrollPi',
    'inventoryCostPi',
    'operatingExpensesPi',
  ];
  const amounts = {};

  for (const field of amountFields) {
    const parsed = parsePiToStroops(input[field] ?? '0');
    if (parsed === null) return { ok: false, error: 'invalid_pi_amount', field };
    amounts[field] = BigInt(parsed);
  }

  const percentageFields = ['discountPercent', 'taxPercent', 'stressRevenueDropPercent'];
  const percentages = {};
  for (const field of percentageFields) {
    const parsed = parsePercentToBasisPoints(input[field] ?? '0');
    if (parsed === null) return { ok: false, error: 'invalid_percentage', field };
    percentages[field] = parsed;
  }

  const grossRevenue = amounts.grossRevenuePi;
  const discounts = roundHalfUp(grossRevenue * percentages.discountPercent);
  const netSales = grossRevenue - discounts;
  const estimatedTax = roundHalfUp(netSales * percentages.taxPercent);
  const totalCosts =
    amounts.payrollPi +
    amounts.inventoryCostPi +
    amounts.operatingExpensesPi;
  const netProfit = netSales - estimatedTax - totalCosts;

  const stressedSalesBeforeTax = roundHalfUp(
    netSales * (BASIS_POINT_DENOMINATOR - percentages.stressRevenueDropPercent)
  );
  const stressedTax = roundHalfUp(stressedSalesBeforeTax * percentages.taxPercent);
  const stressedNetProfit = stressedSalesBeforeTax - stressedTax - totalCosts;

  const derivedValues = [
    discounts,
    netSales,
    estimatedTax,
    totalCosts,
    netProfit,
    stressedSalesBeforeTax,
    stressedTax,
    stressedNetProfit,
  ];
  if (derivedValues.some((value) => !withinSignedInt64(value))) {
    return { ok: false, error: 'calculation_overflow' };
  }

  const marginBps =
    netSales === 0n
      ? 0n
      : signedRoundHalfUp(netProfit * BASIS_POINT_DENOMINATOR, netSales);
  const stressedMarginBps =
    stressedSalesBeforeTax === 0n
      ? 0n
      : signedRoundHalfUp(
          stressedNetProfit * BASIS_POINT_DENOMINATOR,
          stressedSalesBeforeTax
        );

  return {
    ok: true,
    values: {
      grossRevenueStroops: grossRevenue.toString(),
      discountsStroops: discounts.toString(),
      netSalesStroops: netSales.toString(),
      estimatedTaxStroops: estimatedTax.toString(),
      totalCostsStroops: totalCosts.toString(),
      netProfitStroops: netProfit.toString(),
      marginBps: marginBps.toString(),
      stressedSalesStroops: stressedSalesBeforeTax.toString(),
      stressedTaxStroops: stressedTax.toString(),
      stressedNetProfitStroops: stressedNetProfit.toString(),
      stressedMarginBps: stressedMarginBps.toString(),
      stressRevenueDropBps: percentages.stressRevenueDropPercent.toString(),
    },
  };
}
