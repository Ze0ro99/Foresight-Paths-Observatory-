/**
 * Resolve a server-side Supabase API key for Edge Function admin operations.
 * Modern secret keys are opaque API keys; legacy keys must be service_role JWTs.
 */
function legacyJwtRole(key) {
  const parts = key.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function getSupabaseAdminCredential(secretKeysRaw, legacyServiceRoleKey) {
  if (typeof secretKeysRaw === "string" && secretKeysRaw.trim()) {
    try {
      const parsed = JSON.parse(secretKeysRaw);
      const secret = parsed && typeof parsed === "object" ? parsed.default : null;
      if (typeof secret === "string" && secret.startsWith("sb_secret_") && secret.length > 20) {
        return { key: secret, legacy: false };
      }
    } catch {
      // Ignore a malformed platform key dictionary and validate the explicit legacy fallback below.
    }
  }

  const legacy = typeof legacyServiceRoleKey === "string" ? legacyServiceRoleKey.trim() : "";
  if (legacy.length <= 20 || legacyJwtRole(legacy) !== "service_role") return null;
  return { key: legacy, legacy: true };
}
