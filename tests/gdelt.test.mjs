import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GDELT_BROAD_QUERY,
  GDELT_REFRESH_INTERVAL_SECONDS,
  classifyGdeltUpstreamError,
  parseGdeltResponse,
} from '../lib/gdelt.mjs';
import {
  GDELT_FALLBACK_QUERY as EDGE_GDELT_FALLBACK_QUERY,
  GDELT_PRIMARY_TIMEOUT_MS as EDGE_GDELT_PRIMARY_TIMEOUT_MS,
  GDELT_FALLBACK_TIMEOUT_MS as EDGE_GDELT_FALLBACK_TIMEOUT_MS,
} from '../supabase/functions/news-refresh/workbench.mjs';

test('uses a five-minute shared refresh interval to avoid upstream request bursts', () => {
  assert.equal(GDELT_REFRESH_INTERVAL_SECONDS, 300);
});

test('groups the broad Boolean query and quotes multi-word terms', () => {
  assert.match(GDELT_BROAD_QUERY, /^\(.*\)$/);
  assert.match(GDELT_BROAD_QUERY, /"data breach"/);
  assert.match(GDELT_BROAD_QUERY, /"artificial intelligence"/);
});

test('Edge Function has a narrower GDELT fallback query and bounded timeouts', () => {
  assert.ok(EDGE_GDELT_FALLBACK_QUERY.startsWith('(') && EDGE_GDELT_FALLBACK_QUERY.endsWith(')'));
  assert.ok(EDGE_GDELT_FALLBACK_QUERY.length < GDELT_BROAD_QUERY.length);
  assert.match(EDGE_GDELT_FALLBACK_QUERY, /cyberattack/);
  assert.equal(EDGE_GDELT_PRIMARY_TIMEOUT_MS, 6000);
  assert.equal(EDGE_GDELT_FALLBACK_TIMEOUT_MS, 4000);
  assert.ok(EDGE_GDELT_PRIMARY_TIMEOUT_MS + EDGE_GDELT_FALLBACK_TIMEOUT_MS <= 10000);
});

test('parses a valid GDELT article-list response', () => {
  const payload = parseGdeltResponse(
    JSON.stringify({ articles: [{ title: 'Example', url: 'https://example.com' }] }),
  );
  assert.equal(payload.articles.length, 1);
  assert.equal(payload.articles[0].title, 'Example');
});

test('rejects HTML error pages even when the upstream status is successful', () => {
  assert.throws(
    () => parseGdeltResponse('<html><body>query rejected</body></html>'),
    TypeError,
  );
  assert.equal(
    classifyGdeltUpstreamError(200, 'text/html', '<html>query rejected</html>'),
    'GDELT_UPSTREAM_HTML',
  );
});

test('classifies rate limits and rejected queries without leaking response bodies', () => {
  assert.equal(
    classifyGdeltUpstreamError(429, 'text/plain', 'Too many requests'),
    'GDELT_RATE_LIMITED',
  );
  assert.equal(
    classifyGdeltUpstreamError(200, 'text/html', 'Invalid query syntax'),
    'GDELT_QUERY_REJECTED',
  );
});

test('rejects malformed JSON and payloads without an articles array', () => {
  assert.throws(() => parseGdeltResponse('{not-json'), TypeError);
  assert.throws(() => parseGdeltResponse(JSON.stringify({ results: [] })), TypeError);
});
