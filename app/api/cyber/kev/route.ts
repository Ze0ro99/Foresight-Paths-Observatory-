import { NextResponse } from 'next/server';
import { getSupabaseServerHeaders, getSupabaseServerKeyKind } from '@/lib/supabase-server-headers.mjs';
import { normalizeCisaKevCatalog } from '@/lib/cisa-kev.mjs';
import { fromCisaKevCacheRows, toCisaKevCacheRows } from '@/lib/cisa-kev-cache.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;
const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const CISA_CATALOG_PAGE = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
const SOURCE_KEY = 'cisa-kev';
const REFRESH_SECONDS = 900;
const CACHE_SELECT = ['cve_id','vendor_project','product','vulnerability_name','date_added','short_description','required_action','due_date','known_ransomware_campaign_use','forensic_triage','cwes','catalog_version','catalog_date_released','source_url','observed_at'].join(',');

type AdminCredential = { key: string };
type CachedSource = { last_success_at?: string | null; metadata?: Record<string, unknown> };

function jsonError(status: number, sourceError: string, sourceHttpStatus?: number) {
  return NextResponse.json({
    status: 'unavailable', source: 'CISA Known Exploited Vulnerabilities',
    sourceUrl: CISA_CATALOG_PAGE, sourceError, sourceHttpStatus: sourceHttpStatus ?? null,
    vulnerabilities: [],
    note: 'The CISA catalog could not be verified and no synthetic vulnerability records are substituted.',
  }, { status, headers: { 'Cache-Control': 'no-store' } });
}
function adminCredential(): AdminCredential | null {
  const raw = process.env.SUPABASE_SECRET_KEYS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const secret = parsed.default;
      if (getSupabaseServerKeyKind(secret) === 'secret_key') return { key: (secret as string).trim() };
    } catch { /* legacy service-role fallback below */ }
  }
  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return getSupabaseServerKeyKind(legacy) === 'legacy_service_role_jwt' ? { key: legacy! } : null;
}
function supabaseBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}
function adminHeaders(credential: AdminCredential, json = false): Record<string, string> {
  return {
    ...getSupabaseServerHeaders(credential.key),
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}
async function adminFetch(base: string, credential: AdminCredential, path: string, init: RequestInit = {}, timeoutMs = 5000) {
  return fetch(new URL('/rest/v1/' + path.replace(/^\//, ''), base), {
    ...init, headers: { ...adminHeaders(credential, Boolean(init.body)), ...(init.headers || {}) },
    cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
  });
}
async function readCache(base: string, credential: AdminCredential) {
  const [itemsResponse, sourceResponse] = await Promise.all([
    adminFetch(base, credential, 'cisa_kev_items?select=' + encodeURIComponent(CACHE_SELECT) + '&order=date_added.desc&limit=100'),
    adminFetch(base, credential, 'source_registry?select=last_success_at,metadata&source_key=eq.' + encodeURIComponent(SOURCE_KEY) + '&limit=1'),
  ]);
  if (!itemsResponse.ok || !sourceResponse.ok) throw new Error('CISA_CACHE_READ_' + (!itemsResponse.ok ? itemsResponse.status : sourceResponse.status));
  const [items, sources] = await Promise.all([itemsResponse.json(), sourceResponse.json()]);
  if (!Array.isArray(items) || !Array.isArray(sources)) throw new Error('CISA_CACHE_INVALID_RESPONSE');
  return { rows: items as Array<Record<string, unknown>>, source: (sources[0] || {}) as CachedSource };
}
async function markRefreshError(base: string, credential: AdminCredential, code: string) {
  try {
    await adminFetch(base, credential, 'source_registry?source_key=eq.' + encodeURIComponent(SOURCE_KEY), {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ last_error_at: new Date().toISOString(), last_error_code: code.slice(0, 80), updated_at: new Date().toISOString() }),
    }, 3000);
  } catch { /* diagnostics never replace cached results */ }
}
async function refreshCache(base: string, credential: AdminCredential) {
  const claimResponse = await adminFetch(base, credential, 'rpc/claim_source_refresh', {
    method: 'POST', body: JSON.stringify({ p_source_key: SOURCE_KEY, p_min_interval_seconds: REFRESH_SECONDS }),
  }, 4000);
  if (!claimResponse.ok) throw new Error('CISA_REFRESH_GUARD_' + claimResponse.status);
  if (await claimResponse.json() !== true) return { refreshed: false, reason: 'refresh_interval_not_elapsed' };
  const response = await fetch(CISA_KEV_URL, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('CISA_UPSTREAM_HTTP_' + response.status);
  const catalog = normalizeCisaKevCatalog(await response.json() as unknown, 100);
  if (!catalog || catalog.validatedCount < 1) throw new Error('CISA_INVALID_CATALOG');
  const observedAt = new Date().toISOString();
  const rows = toCisaKevCacheRows(catalog, observedAt, CISA_CATALOG_PAGE);
  const write = await adminFetch(base, credential, 'cisa_kev_items?on_conflict=cve_id', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows),
  }, 8000);
  if (!write.ok) throw new Error('CISA_CACHE_WRITE_' + write.status);
  const metadata = {
    refresh_interval_seconds: REFRESH_SECONDS, cache_table: 'cisa_kev_items',
    catalog_version: catalog.catalogVersion, catalog_date_released: catalog.dateReleased,
    catalog_count: catalog.count, validated_count: catalog.validatedCount, cached_records: rows.length,
  };
  const state = await adminFetch(base, credential, 'source_registry?source_key=eq.' + encodeURIComponent(SOURCE_KEY), {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ last_success_at: observedAt, last_error_at: null, last_error_code: null, metadata, updated_at: observedAt }),
  }, 4000);
  if (!state.ok) throw new Error('CISA_SOURCE_STATE_' + state.status);
  return { refreshed: true, catalog };
}
async function fetchLiveWithoutPersistence() {
  const response = await fetch(CISA_KEV_URL, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) return jsonError(502, 'CISA_UPSTREAM_HTTP_' + response.status, response.status);
  const catalog = normalizeCisaKevCatalog(await response.json() as unknown, 50);
  if (!catalog || catalog.validatedCount < 1) return jsonError(502, 'INVALID_CISA_CATALOG');
  return NextResponse.json({
    status: 'ok', source: 'CISA Known Exploited Vulnerabilities',
    sourceUrl: CISA_CATALOG_PAGE, feedUrl: CISA_KEV_URL, fetchedAtUtc: new Date().toISOString(),
    persistence: 'not_persisted', freshness: 'live', ...catalog,
    note: 'The source was fetched live but could not be cached. CISA KEV is global threat intelligence; inclusion does not prove a particular asset is affected. Verify vendor, product, version, and exposure before taking action.',
  }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}
export async function GET() {
  const base = supabaseBaseUrl(), credential = adminCredential();
  if (!base || !credential) {
    try { return await fetchLiveWithoutPersistence(); }
    catch (error) { const reason = error instanceof Error ? error.name : 'UnknownError'; console.warn('CISA KEV live fallback failed', { reason }); return jsonError(503, 'CISA_KEV_' + reason); }
  }
  let refreshError: string | null = null, refreshReason = 'not_attempted';
  try {
    const refresh = await refreshCache(base, credential);
    refreshReason = refresh.reason || (refresh.refreshed ? 'refreshed' : 'unknown');
  } catch (error) {
    refreshError = error instanceof Error ? error.message.slice(0, 80) : 'CISA_REFRESH_FAILED';
    console.warn('CISA KEV cache refresh failed', { code: refreshError });
    await markRefreshError(base, credential, refreshError);
  }
  try {
    const cached = await readCache(base, credential);
    const vulnerabilities = fromCisaKevCacheRows(cached.rows, 50);
    if (vulnerabilities.length > 0) {
      const metadata = cached.source.metadata || {};
      const latestObserved = cached.rows.reduce<string | null>((latest, item) => {
        const value = typeof item.observed_at === 'string' ? item.observed_at : null;
        return value && (!latest || Date.parse(value) > Date.parse(latest)) ? value : latest;
      }, null);
      const lastSuccessAtUtc = cached.source.last_success_at || latestObserved;
      const lastSuccessMillis = lastSuccessAtUtc ? Date.parse(lastSuccessAtUtc) : NaN;
      const cacheAgeMs = Number.isFinite(lastSuccessMillis) ? Date.now() - lastSuccessMillis : Number.POSITIVE_INFINITY;
      const stale = Boolean(refreshError) || cacheAgeMs > REFRESH_SECONDS * 2 * 1000;
      return NextResponse.json({
        status: stale ? 'partial' : 'ok', source: 'CISA Known Exploited Vulnerabilities',
        sourceUrl: CISA_CATALOG_PAGE, feedUrl: CISA_KEV_URL, fetchedAtUtc: new Date().toISOString(),
        lastSuccessAtUtc,
        freshness: stale ? 'cached_or_stale' : 'fresh', persistence: 'supabase_service_role_cache',
        sourceError: refreshError,
        catalogVersion: typeof metadata.catalog_version === 'string' ? metadata.catalog_version : String(cached.rows[0].catalog_version || ''),
        dateReleased: typeof metadata.catalog_date_released === 'string' ? metadata.catalog_date_released : String(cached.rows[0].catalog_date_released || ''),
        count: typeof metadata.catalog_count === 'number' ? metadata.catalog_count : cached.rows.length,
        validatedCount: typeof metadata.validated_count === 'number' ? metadata.validated_count : cached.rows.length,
        vulnerabilities,
        note: 'CISA KEV is global threat intelligence. Inclusion means CISA lists a vulnerability as known exploited; it does not prove a customer asset is affected. Verify vendor, product, version, and exposure before action. Cached records retain original CISA dates and display the source refresh time separately.',
      }, { headers: { 'Cache-Control': stale ? 'public, s-maxage=60, stale-while-revalidate=300' : 'public, s-maxage=900, stale-while-revalidate=1800' } });
    }
    try { return await fetchLiveWithoutPersistence(); }
    catch (error) { const reason = error instanceof Error ? error.name : 'UnknownError'; return jsonError(503, refreshError || 'CISA_KEV_' + reason); }
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'UnknownError';
    console.warn('CISA KEV cache read failed', { reason });
    try { return await fetchLiveWithoutPersistence(); }
    catch (upstreamError) { const upstreamReason = upstreamError instanceof Error ? upstreamError.name : 'UnknownError'; return jsonError(503, 'CISA_CACHE_AND_UPSTREAM_' + upstreamReason); }
  }
}