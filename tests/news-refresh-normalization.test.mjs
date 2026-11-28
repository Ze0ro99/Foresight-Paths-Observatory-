import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGdeltArticle,
  normalizeGdeltArticles,
  toGdeltPersistenceRows,
  classifyGdeltUpstreamError,
} from '../supabase/functions/news-refresh/workbench.mjs';

const now = Date.parse('2026-11-28T20:00:00.000Z');
const recent = '20261128T195500Z';
const older = '20261120T195500Z';

test('normalizes and attributes a valid GDELT article from its validated URL', () => {
  const [article] = normalizeGdeltArticles([{
    title: '  Major earthquake\nreported  ',
    url: 'https://News.Example.org/story?id=1',
    seendate: recent,
    domain: 'spoofed.example',
    language: 'English',
    sourcecountry: 'US',
  }], now);

  assert.equal(article.title, 'Major earthquake reported');
  assert.equal(article.sourceDomain, 'news.example.org');
  assert.equal(article.category, 'disasters');
  assert.equal(article.observedAt, '2026-11-28T19:55:00.000Z');
  assert.equal(article.url, 'https://news.example.org/story?id=1');
});

test('deduplicates canonical URLs and keeps the newest observed copy', () => {
  const result = normalizeGdeltArticles([
    { title: 'Old headline', url: 'https://example.org/a', seendate: '20261128T190000Z' },
    { title: 'New headline', url: 'https://example.org/a', seendate: recent },
  ], now);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'New headline');
  assert.equal(result[0].observedAt, '2026-11-28T19:55:00.000Z');
});

test('rejects unsafe URLs, credentials, invalid dates, future dates, and expired records', () => {
  const result = normalizeGdeltArticles([
    { title: 'javascript', url: 'javascript:alert(1)', seendate: recent },
    { title: 'credentials', url: 'https://user:pass@example.org/a', seendate: recent },
    { title: 'invalid date', url: 'https://example.org/b', seendate: 'not-a-date' },
    { title: 'future', url: 'https://example.org/c', seendate: '20261128T210000Z' },
    { title: 'expired', url: 'https://example.org/d', seendate: older },
    { title: 'missing title', url: 'https://example.org/e', seendate: recent },
  ], now);

  assert.deepEqual(result, []);
});

test('caps output, title length, and sanitizes control characters', () => {
  const input = Array.from({ length: 55 }, (_, index) => ({
    title: `headline\u0000 ${index} ${'x'.repeat(600)}`,
    url: `https://example.org/${index}`,
    seendate: recent,
  }));
  const result = normalizeGdeltArticles(input, now);

  assert.equal(result.length, 50);
  assert.ok(result.every((item) => item.title.length <= 500));
  assert.ok(result.every((item) => !/[\u0000-\u001f\u007f]/.test(item.title)));
});

test('keeps feed observation time distinct from publisher publication time', () => {
  const [article] = normalizeGdeltArticles([{
    title: 'Cyber incident report',
    url: 'https://example.org/cyber',
    seendate: recent,
  }], now);
  const [row] = toGdeltPersistenceRows([article]);

  assert.equal(row.published_at, null);
  assert.equal(row.observed_at, article.observedAt);
  assert.equal(row.evidence_class, 'unverified');
  assert.equal(row.metadata.timestamp_kind, 'feed_observation');
});

test('classifies cyber and economy topics without claiming verification', () => {
  assert.equal(classifyGdeltArticle('Ransomware incident disclosed'), 'cyber');
  assert.equal(classifyGdeltArticle('Gold price and inflation outlook'), 'economy');
  assert.equal(classifyGdeltUpstreamError(429, 'application/json', 'quota'), 'GDELT_RATE_LIMITED');
});
