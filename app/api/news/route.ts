import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

type Category =
  | 'disasters'
  | 'conflict'
  | 'politics'
  | 'economy'
  | 'health'
  | 'cyber'
  | 'science'
  | 'energy'
  | 'other';

type NewsItem = {
  id: string;
  category: Category;
  categoryLabel: string;
  title: string;
  url: string;
  observedAt: string;
  sourceDomain: string;
  language: string | null;
  sourceCountry: string | null;
  source: string;
};

type RefreshPayload = {
  fetchedAtUtc?: string;
  status?: string;
  persistence?: string;
  sourceError?: string | null;
  sourceCauseCode?: string | null;
  sourceHttpStatus?: number | null;
  staleFallback?: boolean;
  articles?: Array<{
    id?: string;
    category?: string;
    title?: string;
    url?: string;
    observedAt?: string;
    sourceDomain?: string;
    language?: string | null;
    sourceCountry?: string | null;
    source?: string;
  }>;
};

const labels: Record<Category, string> = {
  disasters: 'الكوارث والطوارئ',
  conflict: 'النزاعات والأمن',
  politics: 'السياسة والدبلوماسية',
  economy: 'الاقتصاد والأسواق',
  health: 'الصحة والأوبئة',
  cyber: 'الأمن السيبراني',
  science: 'العلوم والتقنية',
  energy: 'الطاقة والبنية التحتية',
  other: 'أخبار متنوعة',
};

const categoriesRequested = Object.keys(labels).filter((category) => category !== 'other');
const allowedCategories = new Set<Category>(Object.keys(labels) as Category[]);

function getSupabaseFunctionUrl(base: string) {
  const url = new URL(base);
  if (
    url.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    return null;
  }
  return new URL('/functions/v1/news-refresh', url).toString();
}

function normalizeArticles(input: RefreshPayload['articles']): NewsItem[] {
  if (!Array.isArray(input)) return [];
  const unique = new Map<string, NewsItem>();

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const title = typeof item.title === 'string'
      ? item.title.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500)
      : '';
    if (!title || typeof item.url !== 'string' || typeof item.observedAt !== 'string') continue;

    let url: URL;
    try {
      url = new URL(item.url);
    } catch {
      continue;
    }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;

    const observedMillis = Date.parse(item.observedAt);
    if (!Number.isFinite(observedMillis) || observedMillis > Date.now() + 300000) continue;
    const category = typeof item.category === 'string' && allowedCategories.has(item.category as Category)
      ? item.category as Category
      : 'other';

    const normalized: NewsItem = {
      id: url.toString(),
      category,
      categoryLabel: labels[category],
      title,
      url: url.toString(),
      observedAt: new Date(observedMillis).toISOString(),
      sourceDomain: url.hostname.toLowerCase(),
      language: typeof item.language === 'string' ? item.language.slice(0, 16) : null,
      sourceCountry: typeof item.sourceCountry === 'string' ? item.sourceCountry.slice(0, 80) : null,
      source: item.source === 'GDELT DOC 2.0 (cached)' ? item.source : 'GDELT DOC 2.0',
    };
    unique.set(normalized.url, normalized);
  }

  return [...unique.values()]
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
    .slice(0, 50);
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const functionUrl = base ? getSupabaseFunctionUrl(base) : null;

  if (!functionUrl || !publishableKey) {
    return NextResponse.json({
      fetchedAtUtc: new Date().toISOString(),
      source: 'GDELT DOC 2.0',
      coverage: 'unavailable',
      persistence: 'not_configured',
      categoriesRequested,
      categoriesWithoutResults: categoriesRequested,
      categoryCounts: Object.fromEntries(Object.keys(labels).map((key) => [key, 0])),
      categoriesUnavailable: categoriesRequested,
      sourceError: 'SUPABASE_PUBLIC_PREVIEW_CONFIG_MISSING',
      sourceCauseCode: null,
      sourceHttpStatus: null,
      staleFallback: false,
      articles: [],
      note: 'News ingestion is not configured for this Preview environment.',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(16000),
    });
    const payload = await response.json().catch(() => null) as RefreshPayload | null;

    if (!response.ok || !payload || typeof payload !== 'object') {
      const errorCode = typeof payload?.sourceError === 'string'
        ? payload.sourceError
        : response.status === 401
          ? 'GDELT_REFRESH_AUTH_FAILED'
          : 'GDELT_REFRESH_SERVICE_UNAVAILABLE';
      return NextResponse.json({
        fetchedAtUtc: new Date().toISOString(),
        source: 'GDELT DOC 2.0',
        coverage: 'unavailable',
        persistence: 'skipped_source_unavailable',
        categoriesRequested,
        categoriesWithoutResults: categoriesRequested,
        categoryCounts: Object.fromEntries(Object.keys(labels).map((key) => [key, 0])),
        categoriesUnavailable: categoriesRequested,
        sourceError: errorCode,
        sourceCauseCode: null,
        sourceHttpStatus: response.status,
        staleFallback: false,
        articles: [],
        note: 'The global news source is unavailable. No synthetic articles are substituted.',
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }

    const articles = normalizeArticles(payload.articles);
    const categoryCounts = Object.fromEntries(
      (Object.keys(labels) as Category[]).map((category) => [
        category,
        articles.filter((article) => article.category === category).length,
      ]),
    );
    const sourceError = typeof payload.sourceError === 'string' ? payload.sourceError : null;

    return NextResponse.json({
      fetchedAtUtc: typeof payload.fetchedAtUtc === 'string' ? payload.fetchedAtUtc : new Date().toISOString(),
      source: 'GDELT DOC 2.0',
      coverage: articles.length > 0 && !sourceError ? 'partial' : 'unavailable',
      persistence: typeof payload.persistence === 'string' ? payload.persistence : 'unknown',
      classificationMethod: 'title_keyword_rules',
      categoriesRequested,
      categoriesWithoutResults: categoriesRequested.filter((category) => categoryCounts[category as Category] === 0),
      categoryCounts,
      categoriesUnavailable: sourceError ? categoriesRequested : [],
      sourceError,
      sourceCauseCode: typeof payload.sourceCauseCode === 'string' ? payload.sourceCauseCode : null,
      sourceHttpStatus: typeof payload.sourceHttpStatus === 'number' ? payload.sourceHttpStatus : null,
      staleFallback: payload.staleFallback === true,
      articles,
      note: 'GDELT is a discovery index, not an exhaustive or guaranteed real-time wire service. Times are feed-observation times, not publisher publication times. Categories are preliminary title-keyword labels; verify claims with the original publisher and independent sources.',
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'UnknownError';
    console.warn('GDELT Edge refresh request failed', { reason });
    return NextResponse.json({
      fetchedAtUtc: new Date().toISOString(),
      source: 'GDELT DOC 2.0',
      coverage: 'unavailable',
      persistence: 'skipped_source_unavailable',
      categoriesRequested,
      categoriesWithoutResults: categoriesRequested,
      categoryCounts: Object.fromEntries(Object.keys(labels).map((key) => [key, 0])),
      categoriesUnavailable: categoriesRequested,
      sourceError: 'GDELT_REFRESH_' + reason,
      sourceCauseCode: null,
      sourceHttpStatus: null,
      staleFallback: false,
      articles: [],
      note: 'The global news source is unavailable. No synthetic articles are substituted.',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
