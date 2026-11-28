/**
 * GDELT DOC 2.0 query and response handling.
 *
 * The DOC API's Boolean OR expression must be grouped. Keep multi-word
 * concepts quoted so the server does not parse them as separate terms.
 */
export const GDELT_REFRESH_INTERVAL_SECONDS = 300;
export const GDELT_PRIMARY_TIMEOUT_MS = 7000;
export const GDELT_FALLBACK_TIMEOUT_MS = 5000;

export const GDELT_BROAD_QUERY =
  '(earthquake OR flood OR wildfire OR hurricane OR volcano OR tsunami OR disaster OR war OR conflict OR ceasefire OR election OR government OR diplomacy OR sanctions OR inflation OR markets OR trade OR recession OR outbreak OR epidemic OR pandemic OR cyberattack OR ransomware OR "data breach" OR science OR space OR technology OR "artificial intelligence" OR oil OR gas OR electricity OR "renewable energy")';

// Smaller second-pass query used only when GDELT rejects or returns a non-JSON
// page for the broad query. This reduces query complexity without inventing data.
export const GDELT_FALLBACK_QUERY =
  '(earthquake OR flood OR wildfire OR war OR conflict OR election OR cyberattack OR inflation OR outbreak OR energy)';

/**
 * @param {string} raw
 * @returns {{ articles: Array<Record<string, unknown>> }}
 */
export function parseGdeltResponse(raw) {
  if (typeof raw !== 'string') {
    throw new TypeError('GDELT response body must be text');
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new TypeError('GDELT returned a non-JSON response');
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    !Array.isArray(payload.articles)
  ) {
    throw new TypeError('GDELT response is missing an articles array');
  }

  return payload;
}

/**
 * Return a stable, non-sensitive diagnostic code for an upstream response.
 * @param {number} status
 * @param {string} contentType
 * @param {string} body
 * @returns {string}
 */
export function classifyGdeltUpstreamError(status, contentType, body) {
  const text = typeof body === 'string' ? body.toLowerCase() : '';
  const type = typeof contentType === 'string' ? contentType.toLowerCase() : '';

  if (
    status === 429 ||
    /rate limit|too many requests|request quota|quota exceeded/.test(text)
  ) {
    return 'GDELT_RATE_LIMITED';
  }

  if (
    status === 400 ||
    /invalid query|query syntax|query is too broad|unsupported operator/.test(text)
  ) {
    return 'GDELT_QUERY_REJECTED';
  }

  if (type.includes('text/html') || /^\s*</.test(text)) {
    return 'GDELT_UPSTREAM_HTML';
  }

  return 'GDELT_INVALID_RESPONSE';
}
