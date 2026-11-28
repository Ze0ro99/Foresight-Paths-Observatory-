/**
 * Server-only Supabase key validation and Data API headers.
 * Secret keys are opaque API keys; legacy service_role keys must carry role=service_role.
 */
function getLegacyJwtRole(key) {
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function getSupabaseServerKeyKind(apiKey) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) return 'missing';
  if (key.startsWith('sb_secret_')) return 'secret_key';
  if (key.startsWith('sb_publishable_')) return 'publishable_key';
  const role = getLegacyJwtRole(key);
  if (role === 'service_role') return 'legacy_service_role_jwt';
  if (role === 'anon') return 'legacy_anon_jwt';
  if (role) return 'legacy_jwt_other_role';
  return 'unrecognized';
}

/** @returns {Record<string, string>} */
export function getSupabaseServerHeaders(apiKey) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) throw new Error('A Supabase server API key is required.');
  const kind = getSupabaseServerKeyKind(key);
  if (kind !== 'secret_key' && kind !== 'legacy_service_role_jwt') {
    throw new Error('An elevated Supabase server key is required for private RPCs.');
  }

  /** @type {Record<string, string>} */
  const headers = { apikey: key };
  if (kind === 'legacy_service_role_jwt') headers.Authorization = 'Bearer ' + key;
  return headers;
}
