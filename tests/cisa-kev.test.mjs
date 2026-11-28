import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCisaKevCatalog } from '../lib/cisa-kev.mjs';

const entry = (cveID, dateAdded, overrides = {}) => ({
  cveID,
  vendorProject: 'Example Vendor',
  product: 'Example Product',
  vulnerabilityName: 'Remote Code Execution',
  dateAdded,
  shortDescription: 'A validated description of the vulnerability.',
  requiredAction: 'Apply vendor updates and follow the vendor guidance.',
  dueDate: '2026-12-31',
  knownRansomwareCampaignUse: 'Unknown',
  forensicTriage: 'No',
  cwes: ['CWE-79'],
  ...overrides,
});

test('normalizes and sorts valid CISA KEV records by date added', () => {
  const result = normalizeCisaKevCatalog({
    title: 'CISA Catalog of Known Exploited Vulnerabilities',
    catalogVersion: '2026.11.25',
    dateReleased: '2026-11-25T12:00:00.000Z',
    count: 2,
    vulnerabilities: [
      entry('CVE-2025-1234', '2026-11-20'),
      entry('CVE-2026-12345', '2026-11-24', { knownRansomwareCampaignUse: 'Known' }),
    ],
  });

  assert.equal(result.count, 2);
  assert.equal(result.validatedCount, 2);
  assert.equal(result.vulnerabilities[0].cveID, 'CVE-2026-12345');
  assert.equal(result.vulnerabilities[0].knownRansomwareCampaignUse, 'Known');
  assert.equal(result.vulnerabilities[0].nvdUrl, 'https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
});

test('rejects an invalid catalog envelope', () => {
  assert.equal(normalizeCisaKevCatalog(null), null);
  assert.equal(normalizeCisaKevCatalog({ catalogVersion: 'x', dateReleased: 'bad', count: 2, vulnerabilities: [] }), null);
  assert.equal(normalizeCisaKevCatalog({ catalogVersion: 'x', dateReleased: '2026-11-25T00:00:00Z', count: 2, vulnerabilities: [] }), null);
});

test('drops malformed CVEs and dates without generating replacement records', () => {
  const result = normalizeCisaKevCatalog({
    catalogVersion: '2026.11.25',
    dateReleased: '2026-11-25T12:00:00.000Z',
    count: 3,
    vulnerabilities: [
      entry('NOT-A-CVE', '2026-11-25'),
      entry('CVE-2026-1234', '2026-02-31'),
      entry('CVE-2026-98765', '2026-11-24'),
    ],
  });
  assert.equal(result.count, 3);
  assert.equal(result.validatedCount, 1);
  assert.deepEqual(result.vulnerabilities.map((item) => item.cveID), ['CVE-2026-98765']);
});

test('caps requested result size and filters unknown CWE values', () => {
  const result = normalizeCisaKevCatalog({
    catalogVersion: '2026.11.25',
    dateReleased: '2026-11-25T12:00:00.000Z',
    count: 1,
    vulnerabilities: [
      entry('CVE-2026-1234', '2026-11-24', { cwes: ['CWE-79', '<script>', 'CWE-89'] }),
    ],
  }, 1000);
  assert.deepEqual(result.vulnerabilities[0].cwes, ['CWE-79', 'CWE-89']);
});
