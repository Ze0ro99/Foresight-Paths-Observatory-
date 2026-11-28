export const PI_STROOPS_PER_PI = 10_000_000n;
export const PI_TESTNET_SUBSCRIPTION_APPROVAL_SECONDS = 180n * 24n * 60n * 60n - 1n;

export function isValidPiWalletAddress(value) {
  return typeof value === 'string' && /^G[A-Z2-7]{55}$/.test(value.trim());
}

export function isValidSubscriptionServiceId(value) {
  return typeof value === 'string' && /^(0|[1-9]\d{0,19})$/.test(value.trim());
}

export function maxSubscriptionPeriods(periodSeconds, trialSeconds = '0') {
  let seconds;
  let trial;
  try {
    seconds = BigInt(String(periodSeconds));
    trial = BigInt(String(trialSeconds));
  } catch {
    return 0;
  }
  if (seconds <= 0n || trial < 0n) return 0;
  const remainingApprovalSeconds = PI_TESTNET_SUBSCRIPTION_APPROVAL_SECONDS - trial;
  if (remainingApprovalSeconds <= 0n) return 0;
  const maximum = remainingApprovalSeconds / seconds;
  return maximum > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(maximum);
}

export function formatStroopsAsPi(value) {
  let stroops;
  try {
    stroops = BigInt(String(value));
  } catch {
    throw new TypeError('Pi amount must be a non-negative integer in stroops');
  }
  if (stroops < 0n) throw new TypeError('Pi amount must be a non-negative integer in stroops');

  const whole = stroops / PI_STROOPS_PER_PI;
  const fractional = String(stroops % PI_STROOPS_PER_PI).padStart(7, '0').replace(/0+$/, '');
  return fractional ? String(whole) + '.' + fractional : String(whole);
}
