import { getSupabaseAdminCredential } from "../_shared/supabase-admin-key.mjs";
import {
  GDELT_BROAD_QUERY,
  GDELT_FALLBACK_QUERY,
  GDELT_PRIMARY_TIMEOUT_MS,
  GDELT_FALLBACK_TIMEOUT_MS,
  GDELT_REFRESH_INTERVAL_SECONDS,
  classifyGdeltUpstreamError,
  normalizeGdeltArticles,
  toGdeltPersistenceRows,
} from "./workbench.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const SOURCE_KEY = "gdelt-doc";
const MAX_BODY_BYTES = 1024;
const CACHE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CATEGORIES = new Set([
  "disasters", "conflict", "politics", "economy", "health", "cyber", "science", "energy", "other",
]);
type NewsArticle = ReturnType<typeof normalizeGdeltArticles>[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function parseNamedKeys(raw: string | undefined) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? Object.values(value).filter((item): item is string => typeof item === "string" && item.length > 12)
      : [];
  } catch {
    return [];
  }
}

function getPublishableKeys() {
  return new Set([
    ...parseNamedKeys(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")),
    Deno.env.get("SUPABASE_ANON_KEY") || "",
  ].filter(Boolean));
}

function getAdminCredential() {
  return getSupabaseAdminCredential(
    Deno.env.get("SUPABASE_SECRET_KEYS") ?? undefined,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined,
  );
}

function getAdminHeaders(credential: { key: string; legacy: boolean }) {
  const headers: Record<string, string> = {
    apikey: credential.key,
    Accept: "application/json",
  };
  // Legacy service_role keys are JWTs. New sb_secret keys are not JWTs and
  // must be sent only in apikey, never as Authorization: Bearer.
  if (credential.legacy) headers.Authorization = "Bearer " + credential.key;
  return headers;
}

function apiUrl(base: string, path: string) {
  return new URL(path, base.endsWith("/") ? base : base + "/");
}

async function adminRpc<T>(
  base: string,
  credential: { key: string; legacy: boolean },
  name: string,
  body: Record<string, unknown>,
  timeoutMs = 8000,
): Promise<T> {
  const response = await fetch(apiUrl(base, "rest/v1/rpc/" + name), {
    method: "POST",
    headers: {
      ...getAdminHeaders(credential),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error("RPC_" + name.toUpperCase() + "_" + response.status);
  return await response.json() as T;
}

function safeStoredUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function loadCachedNews(
  base: string,
  credential: { key: string; legacy: boolean },
) {
  const params = new URLSearchParams({
    select: "category,title,canonical_url,language_code,source_country,observed_at",
    observed_at: "gte." + new Date(Date.now() - CACHE_WINDOW_MS).toISOString(),
    order: "observed_at.desc",
    limit: "50",
  });
  const response = await fetch(apiUrl(base, "rest/v1/news_items?" + params.toString()), {
    headers: getAdminHeaders(credential),
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error("NEWS_CACHE_READ_" + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: Record<string, unknown>) => {
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 500) : "";
    const url = safeStoredUrl(row.canonical_url);
    const date = typeof row.observed_at === "string" ? Date.parse(row.observed_at) : NaN;
    if (!title || !url || !Number.isFinite(date) || date > Date.now() + 300000) return [];
    const category = typeof row.category === "string" && CATEGORIES.has(row.category) ? row.category : "other";
    return [{
      id: url,
      category,
      title,
      url,
      observedAt: new Date(date).toISOString(),
      sourceDomain: new URL(url).hostname.toLowerCase(),
      language: typeof row.language_code === "string" ? row.language_code : null,
      sourceCountry: typeof row.source_country === "string" ? row.source_country : null,
      source: "GDELT DOC 2.0 (cached)",
    }];
  });
}

type GdeltFetchResult = {
  articles: ReturnType<typeof normalizeGdeltArticles>;
  error: string | null;
  causeCode: string | null;
  httpStatus: number | null;
};

async function fetchGdeltArticles(
  query: string,
  maxRecords: string,
  timeoutMs: number,
): Promise<GdeltFetchResult> {
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    maxrecords: maxRecords,
    sort: "DateDesc",
    timespan: "7d",
  });

  try {
    const response = await fetch("https://api.gdeltproject.org/api/v2/doc/doc?" + params.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    if (!response.ok) {
      return {
        articles: [],
        error: classifyGdeltUpstreamError(response.status, contentType, raw),
        causeCode: null,
        httpStatus: response.status,
      };
    }

    try {
      const payload = JSON.parse(raw) as { articles?: unknown[] };
      if (!payload || !Array.isArray(payload.articles)) throw new TypeError("missing articles");
      return {
        articles: normalizeGdeltArticles(payload.articles),
        error: null,
        causeCode: null,
        httpStatus: response.status,
      };
    } catch {
      return {
        articles: [],
        error: classifyGdeltUpstreamError(response.status, contentType, raw),
        causeCode: null,
        httpStatus: response.status,
      };
    }
  } catch (error) {
    const details = error as Error & { cause?: { code?: string } };
    return {
      articles: [],
      error: "GDELT_" + (error instanceof Error ? error.name : "UPSTREAM_ERROR"),
      causeCode: typeof details.cause?.code === "string" ? details.cause.code.slice(0, 80) : null,
      httpStatus: null,
    };
  }
}

async function markSourceError(
  base: string,
  credential: { key: string; legacy: boolean },
  code: string,
) {
  try {
    const params = new URLSearchParams({ source_key: "eq." + SOURCE_KEY });
    await fetch(apiUrl(base, "rest/v1/source_registry?" + params.toString()), {
      method: "PATCH",
      headers: {
        ...getAdminHeaders(credential),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        last_error_at: new Date().toISOString(),
        last_error_code: code.slice(0, 80),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Source diagnostics must never replace the primary request result.
  }
}

async function fallback(
  base: string,
  credential: { key: string; legacy: boolean },
  sourceError: string,
  sourceCauseCode: string | null = null,
  sourceHttpStatus: number | null = null,
) {
  let articles: NewsArticle[] = [];
  try {
    articles = await loadCachedNews(base, credential);
  } catch {
    // Return an explicit unavailable state; never synthesize records.
  }
  return json({
    fetchedAtUtc: new Date().toISOString(),
    status: articles.length > 0 ? "partial" : "unavailable",
    persistence: articles.length > 0 ? "served_stale_cache" : "skipped_source_unavailable",
    sourceError,
    sourceCauseCode,
    sourceHttpStatus,
    staleFallback: articles.length > 0,
    articles,
  }, articles.length > 0 ? 200 : 503);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const providedKey = request.headers.get("apikey") || "";
  if (!providedKey || !getPublishableKeys().has(providedKey)) {
    return json({ ok: false, error: "A valid project publishable API key is required." }, 401);
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) return json({ ok: false, error: "Request is too large." }, 413);
  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) return json({ ok: false, error: "Request is too large." }, 413);
  if (body.trim() && body.trim() !== "{}") return json({ ok: false, error: "This endpoint accepts no source, URL, or query overrides." }, 400);

  const base = Deno.env.get("SUPABASE_URL")?.trim();
  const credential = getAdminCredential();
  if (!base || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) || !credential) {
    return json({ ok: false, error: "The source-ingestion service is not configured." }, 503);
  }

  try {
    const claimed = await adminRpc<boolean>(base, credential, "claim_source_refresh", {
      p_source_key: SOURCE_KEY,
      p_min_interval_seconds: GDELT_REFRESH_INTERVAL_SECONDS,
    }, 3000);
    if (claimed !== true) {
      let articles = [];
      try {
        articles = await loadCachedNews(base, credential);
      } catch {
        return fallback(base, credential, "GDELT_CACHE_READ_UNAVAILABLE");
      }
      return json({
        fetchedAtUtc: new Date().toISOString(),
        status: articles.length > 0 ? "ok" : "unavailable",
        persistence: articles.length > 0 ? "served_cache" : "cache_empty",
        sourceError: articles.length > 0 ? null : "GDELT_CACHE_EMPTY",
        sourceCauseCode: null,
        sourceHttpStatus: null,
        staleFallback: false,
        articles,
      });
    }
  } catch {
    return fallback(base, credential, "GDELT_REFRESH_GUARD_UNAVAILABLE");
  }

  const primary = await fetchGdeltArticles(GDELT_BROAD_QUERY, "30", GDELT_PRIMARY_TIMEOUT_MS);
  let selected = primary;

  if (primary.error || primary.articles.length === 0) {
    const secondary = await fetchGdeltArticles(GDELT_FALLBACK_QUERY, "20", GDELT_FALLBACK_TIMEOUT_MS);
    if (!secondary.error && secondary.articles.length > 0) {
      selected = secondary;
    } else if (primary.error && secondary.error) {
      const code = secondary.error || primary.error;
      await markSourceError(base, credential, code);
      return await fallback(
        base,
        credential,
        code,
        secondary.causeCode || primary.causeCode,
        secondary.httpStatus ?? primary.httpStatus,
      );
    } else if (primary.error && !secondary.error) {
      // The narrower query succeeded but returned no current articles.
      selected = secondary;
    }
  }

  const responseStatus = selected.httpStatus ?? primary.httpStatus ?? 0;
  const articles = selected.articles;

  try {
    const rows = toGdeltPersistenceRows(articles);
    const persisted = await adminRpc<number>(base, credential, "ingest_news_batch", {
      p_source_key: SOURCE_KEY,
      p_rows: rows,
    }, 5000);
    if (articles.length === 0) {
      let cached: NewsArticle[] = [];
      try {
        cached = await loadCachedNews(base, credential);
      } catch {
        // An empty fresh result remains explicit; no placeholder data is added.
      }
      return json({
        fetchedAtUtc: new Date().toISOString(),
        status: cached.length > 0 ? "partial" : "unavailable",
        persistence: cached.length > 0 ? "served_stale_cache" : "no_new_articles",
        sourceError: null,
        sourceCauseCode: null,
        sourceHttpStatus: responseStatus,
        staleFallback: cached.length > 0,
        articles: cached,
      });
    }
    return json({
      fetchedAtUtc: new Date().toISOString(),
      status: "ok",
      persistence: "persisted:" + String(persisted),
      sourceError: null,
      sourceCauseCode: null,
      sourceHttpStatus: responseStatus,
      staleFallback: false,
      articles,
    });
  } catch {
    await markSourceError(base, credential, "GDELT_PERSIST_FAILED");
    return json({
      fetchedAtUtc: new Date().toISOString(),
      status: articles.length > 0 ? "partial" : "unavailable",
      persistence: "write_failed",
      sourceError: "GDELT_PERSIST_FAILED",
      sourceCauseCode: null,
      sourceHttpStatus: responseStatus,
      staleFallback: false,
      articles,
    });
  }
});
