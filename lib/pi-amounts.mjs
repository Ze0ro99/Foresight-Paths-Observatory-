const STROOPS_PER_PI = 10000000n;
const MAX_INT64 = 9223372036854775807n;

export function parsePiToStroops(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(0|[1-9][0-9]{0,17})(?:\.([0-9]{1,7}))?$/);
  if (!match) return null;
  try {
    const result = BigInt(match[1]) * STROOPS_PER_PI + BigInt((match[2] || '').padEnd(7, '0') || '0');
    return result <= MAX_INT64 ? result.toString() : null;
  } catch {
    return null;
  }
}

export function formatStroopsAsPi(value) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(value)) return null;
  try {
    const amount = BigInt(value);
    if (amount > MAX_INT64) return null;
    const whole = amount / STROOPS_PER_PI;
    const remainder = amount % STROOPS_PER_PI;
    return remainder === 0n
      ? whole.toString()
      : whole.toString() + '.' + remainder.toString().padStart(7, '0').replace(/0+$/, '');
  } catch {
    return null;
  }
}