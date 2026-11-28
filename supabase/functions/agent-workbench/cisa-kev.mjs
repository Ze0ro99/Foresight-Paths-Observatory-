const CVE_PATTERN = /^CVE-[0-9]{4}-[0-9]{4,19}$/;
const CWE_PATTERN = /^CWE-[0-9]+$/;
const MAX_TEXT_LENGTH = 1200;

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export function normalizeCisaKevCatalog(raw, limit = 50) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const catalog = raw;
  const catalogVersion = cleanText(catalog.catalogVersion, 40);
  const dateReleased = typeof catalog.dateReleased === 'string' ? catalog.dateReleased : '';
  const releasedMillis = Date.parse(dateReleased);
  const count = catalog.count;
  const rows = catalog.vulnerabilities;
  if (
    !catalogVersion ||
    !Number.isFinite(releasedMillis) ||
    releasedMillis > Date.now() + 5 * 60 * 1000 ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Array.isArray(rows) ||
    count !== rows.length
  ) {
    return null;
  }

  const normalized = [];
  for (const item of rows) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const cveID = cleanText(item.cveID, 32).toUpperCase();
    const vendorProject = cleanText(item.vendorProject, 160);
    const product = cleanText(item.product, 200);
    const vulnerabilityName = cleanText(item.vulnerabilityName, 300);
    const shortDescription = cleanText(item.shortDescription, 1200);
    const requiredAction = cleanText(item.requiredAction, 1200);
    const dateAdded = item.dateAdded;
    const dueDate = item.dueDate;
    if (
      !CVE_PATTERN.test(cveID) ||
      !vendorProject ||
      !product ||
      !vulnerabilityName ||
      !shortDescription ||
      !requiredAction ||
      !isDateOnly(dateAdded) ||
      !isDateOnly(dueDate)
    ) {
      continue;
    }

    const ransomware = item.knownRansomwareCampaignUse === 'Known'
      ? 'Known'
      : item.knownRansomwareCampaignUse === 'Unknown'
        ? 'Unknown'
        : null;
    const cwes = Array.isArray(item.cwes)
      ? item.cwes.filter((value) => typeof value === 'string' && CWE_PATTERN.test(value)).slice(0, 20)
      : [];

    normalized.push({
      cveID,
      vendorProject,
      product,
      vulnerabilityName,
      dateAdded,
      shortDescription,
      requiredAction,
      dueDate,
      knownRansomwareCampaignUse: ransomware,
      forensicTriage: item.forensicTriage === 'Yes' || item.forensicTriage === 'No' ? item.forensicTriage : null,
      cwes,
      nvdUrl: 'https://nvd.nist.gov/vuln/detail/' + cveID,
    });
  }

  normalized.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || a.cveID.localeCompare(b.cveID));
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(100, limit)) : 50;
  return {
    catalogVersion,
    dateReleased: new Date(releasedMillis).toISOString(),
    count,
    validatedCount: normalized.length,
    vulnerabilities: normalized.slice(0, safeLimit),
  };
}
