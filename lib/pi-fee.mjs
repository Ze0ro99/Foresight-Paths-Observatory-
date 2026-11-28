/** @param {string | number} value @returns {string} */
export function stroopsToPi(value) {
  let normalized;
  if (typeof value === 'string' && /^\\d+$/.test(value)) {
    normalized = value;
  } else if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    // Some Horizon-compatible gateways serialize integer fields as JSON numbers.
    // Accept only safe integers so conversion to BigInt cannot inherit float rounding.
    normalized = String(value);
  } else {
    throw new TypeError('Stroops must be a non-negative integer string or safe integer number');
  }

  const amount = BigInt(normalized);
  const whole = amount / 10_000_000n;
  const fraction = (amount % 10_000_000n).toString().padStart(7, '0').replace(/0+$/, '');
  return fraction ? whole.toString() + '.' + fraction : whole.toString();
}
