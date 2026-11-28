export const GDELT_REFRESH_INTERVAL_SECONDS = 300;
export const GDELT_PRIMARY_TIMEOUT_MS = 6000;
export const GDELT_FALLBACK_TIMEOUT_MS = 4000;


export const GDELT_BROAD_QUERY =
  '(earthquake OR flood OR wildfire OR hurricane OR volcano OR tsunami OR disaster OR war OR conflict OR ceasefire OR election OR government OR diplomacy OR sanctions OR inflation OR markets OR trade OR recession OR outbreak OR epidemic OR pandemic OR cyberattack OR ransomware OR "data breach" OR science OR space OR technology OR "artificial intelligence" OR oil OR gas OR electricity OR "renewable energy")';

export const GDELT_FALLBACK_QUERY =
  '(earthquake OR flood OR wildfire OR war OR conflict OR election OR cyberattack OR inflation OR outbreak OR energy)';

const CATEGORIES = new Set([
  'disasters', 'conflict', 'politics', 'economy', 'health', 'cyber', 'science', 'energy', 'other',
]);

function cleanText(value, maxLength) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

export function classifyGdeltArticle(title) {
  const value = title.toLowerCase();
  if (/earthquake|flood|wildfire|hurricane|cyclone|volcano|tsunami|disaster|tornado|landslide/.test(value)) return 'disasters';
  if (/\bwar\b|conflict|ceasefire|missile|invasion|armed forces|military strike/.test(value)) return 'conflict';
  if (/cyber|ransomware|data breach|hacked|hackers|vulnerability|malware|cve-\d{4}-\d+/.test(value)) return 'cyber';
  if (/outbreak|epidemic|pandemic|public health|virus|vaccine|hospital|disease/.test(value)) return 'health';
  if (/election|parliament|government|diplomacy|sanction|president|minister|policy/.test(value)) return 'politics';
  if (/\boil\b|\bgas\b|electricity|power grid|renewable|solar|wind energy|energy/.test(value)) return 'energy';
  if (/inflation|central bank|market|trade|recession|economy|economic|stocks|finance|gold price/.test(value)) return 'economy';
  if (/science|space|research|technology|artificial intelligence|robot|quantum|asteroid|satellite/.test(value)) return 'science';
  return 'other';
}

function parseGdeltTimestamp(value, nowMs) {
  if (typeof value !== 'string' || !/^\d{8}T\d{6}Z$/.test(value)) return null;
  const iso = value.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    '$1-$2-$3T$4:$5:$6Z',
  );
  const millis = Date.parse(iso);
  if (!Number.isFinite(millis) || millis > nowMs + 300000 || millis < nowMs - 8 * 86400000) return null;
  return new Date(millis).toISOString();
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.hostname.length > 253 || url.toString().length > 2048) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeGdeltArticles(rawArticles, now = Date.now()) {
  if (!Array.isArray(rawArticles)) return [];
  const nowMs = now instanceof Date ? now.getTime() : typeof now === 'string' ? Date.parse(now) : Number(now);
  if (!Number.isFinite(nowMs)) throw new TypeError('A valid observation clock is required');

  const unique = new Map();
  for (const raw of rawArticles) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const title = cleanText(raw.title, 500);
    const url = safeHttpUrl(raw.url);
    const observedAt = parseGdeltTimestamp(raw.seendate, nowMs);
    if (!title || !url || !observedAt) continue;

    const article = {
      id: url,
      category: classifyGdeltArticle(title),
      title,
      url,
      observedAt,
      sourceDomain: new URL(url).hostname.toLowerCase(),
      language: cleanText(raw.language, 16) || null,
      sourceCountry: cleanText(raw.sourcecountry, 80) || null,
      source: 'GDELT DOC 2.0',
    };
    const previous = unique.get(url);
    if (!previous || Date.parse(article.observedAt) > Date.parse(previous.observedAt)) {
      unique.set(url, article);
    }
  }

  return [...unique.values()]
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
    .slice(0, 50);
}

export function toGdeltPersistenceRows(articles) {
  return articles.map((article) => ({
    external_id: article.url,
    category: CATEGORIES.has(article.category) ? article.category : 'other',
    title: article.title,
    summary: null,
    canonical_url: article.url,
    source_domain: article.sourceDomain,
    language_code: article.language,
    source_country: article.sourceCountry,
    // GDELT seendate is a feed-observation time, not the publisher's publication time.
    published_at: null,
    observed_at: article.observedAt,
    content_hash: null,
    evidence_class: 'unverified',
    metadata: {
      provider: 'GDELT DOC 2.0',
      timestamp_kind: 'feed_observation',
      classification: 'title_keyword_rules',
    },
  }));
}

export function classifyGdeltUpstreamError(status, contentType, body) {
  const text = typeof body === 'string' ? body.toLowerCase() : '';
  const type = typeof contentType === 'string' ? contentType.toLowerCase() : '';

  if (status === 429 || /rate limit|too many requests|request quota|quota exceeded/.test(text)) {
    return 'GDELT_RATE_LIMITED';
  }
  if (status === 400 || /invalid query|query syntax|query is too broad|unsupported operator/.test(text)) {
    return 'GDELT_QUERY_REJECTED';
  }
  if (type.includes('text/html') || /^\s*</.test(text)) return 'GDELT_UPSTREAM_HTML';
  return status >= 400 ? 'GDELT_UPSTREAM_HTTP_ERROR' : 'GDELT_INVALID_RESPONSE';
}
