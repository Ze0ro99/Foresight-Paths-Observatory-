export function getPiAuthScopes(paymentsEnabled = process.env.NEXT_PUBLIC_PI_PAYMENTS_ENABLED === 'true') {
  return paymentsEnabled ? ['username', 'payments'] : ['username'];
}
