import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GDELT_BROAD_QUERY,
  GDELT_REFRESH_INTERVAL_SECONDS,
  classifyGdeltArticle,
  classifyGdeltUpstreamError,
  normalizeGdeltArticles,
  toGdeltPersistenceRows,
} from '../supabase/functions/news-refresh/workbench.mjs';

const now = '2026-11-25T18:00:00.000Z';

test('GDELT refresh is globally rate-limited to five minutes', () => {
  assert.equal(GDELT_REFRESH_INTERVAL_SECONDS, 300);
  assert.ok(GDELT_BROAD_QUERY.startsWith('('));
  assert.match(GDELT_BROAD_QUERY, /"data breach"/);
});

test('classifies cyber, conflict, health, energy, economy, disaster, and science reports', () => {
  assert.equal(classifyGdeltArticle('New ransomware attack exploits CVE-2026-1234'), 'cyber');
  assert.equal(classifyGdeltArticle('Ceasefire announced after military conflict'), 'conflict');
  assert.equal(classifyGdeltArticle('Public health outbreak investigation begins'), 'health');
  assert.equal(classifyGdeltArticle('Oil and gas pipeline supply disruption'), 'energy');
  assert.equal(classifyGdeltArticle('Gold prices fall as inflation data shifts'), 'economy');
  assert.equal(classifyGdeltArticle('Strong earthquake reported near the coast'), 'disasters');
  assert.equal(classifyGdeltArticle('Astronomers publish asteroid observation'), 'science');
});

test('normalizes only attributed, timestamped HTTP(S) reports and removes duplicates', () => {
  const rows = normalizeGdeltArticles([
    {
      title: 'Bank cybersecurity breach report',
      url: 'https://news.example.org/security?id=1',
      seendate: '20261125T170000Z',
      domain: 'ignored.example',
      language: 'English',
      sourcecountry: 'US',
    },
    {
      title: 'Duplicate URL with another title',
      url: 'https://news.example.org/security?id=1',
      seendate: '20261125T160000Z',
    },
    {
      title: 'Unsafe protocol',
      url: 'javascript:alert(1)',
      seendate: '20261125T170000Z',
    },
    {
      title: 'Credential URL',
      url: 'https://reader:password@news.example.org/story',
      seendate: '20261125T170000Z',
    },
    {
      title: 'Future-dated report',
      url: 'https://news.example.org/future',
      seendate: '20261125T190000Z',
    },
    {
      title: 'Stale report',
      url: 'https://news.example.org/stale',
      seendate: '20261101T170000Z',
    },
    {
      title: 'Missing timestamp',
      url: 'https://news.example.org/no-time',
    },
  ], now);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].category, 'cyber');
  assert.equal(rows[0].sourceDomain, 'news.example.org');
  assert.equal(rows[0].observedAt, '2026-11-25T17:00:00.000Z');
  assert.equal(rows[0].source, 'GDELT DOC 2.0');
});

test('persistence rows keep GDELT feed-observation time distinct from publisher time', () => {
  const [row] = toGdeltPersistenceRows(normalizeGdeltArticles([{
    title: 'Wildfire incident update',
    url: 'https://news.example.org/fire',
    seendate: '20261125T170000Z',
  }], now));

  assert.equal(row.category, 'disasters');
  assert.equal(row.published_at, null);
  assert.equal(row.observed_at, '2026-11-25T17:00:00.000Z');
  assert.equal(row.evidence_class, 'unverified');
  assert.equal(row.metadata.timestamp_kind, 'feed_observation');
  assert.equal(row.external_id, row.canonical_url);
});

test('upstream failures are reduced to stable non-sensitive codes', () => {
  assert.equal(classifyGdeltUpstreamError(429, 'text/plain', 'Too many requests'), 'GDELT_RATE_LIMITED');
  assert.equal(classifyGdeltUpstreamError(400, 'text/plain', 'Invalid query syntax'), 'GDELT_QUERY_REJECTED');
  assert.equal(classifyGdeltUpstreamError(200, 'text/html', '<html>blocked</html>'), 'GDELT_UPSTREAM_HTML');
  assert.equal(classifyGdeltUpstreamError(503, 'application/json', '{}'), 'GDELT_UPSTREAM_HTTP_ERROR');
});
