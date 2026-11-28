const ALLOWED_KEYS = new Set(['execution_mode','capabilities','input_types','output_types','data_sources']);
const ALLOWED_CAPABILITIES = new Set(['read_news','read_hazards','read_cisa_kev','read_pi_horizon','local_analysis','report_generation']);
const ALLOWED_INPUTS = new Set(['topic','region','time_window','public_url','project_context']);
const ALLOWED_OUTPUTS = new Set(['plain_report','risk_summary','map_signals','source_list','recommendations']);
const ALLOWED_SOURCES = new Set(['GDELT_DOC','USGS','NASA_EONET','CISA_KEV','PI_TESTNET_HORIZON']);
const MAX_INT64 = 9223372036854775807n;

function normalizeEnumArray(value, allowed, required = false) {
  if (!Array.isArray(value) || value.length > 8 || (required && value.length === 0)) return null;
  const values = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item) || values.includes(item)) return null;
    values.push(item);
  }
  return values;
}

export function normalizeMarketplaceCapabilityManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== ALLOWED_KEYS.size || keys.some((key) => !ALLOWED_KEYS.has(key))) return null;
  if (value.execution_mode !== 'read_only') return null;

  const capabilities = normalizeEnumArray(value.capabilities, ALLOWED_CAPABILITIES, true);
  const inputTypes = normalizeEnumArray(value.input_types, ALLOWED_INPUTS);
  const outputTypes = normalizeEnumArray(value.output_types, ALLOWED_OUTPUTS, true);
  const dataSources = normalizeEnumArray(value.data_sources, ALLOWED_SOURCES);
  if (!capabilities || !inputTypes || !outputTypes || !dataSources) return null;

  return {
    execution_mode: 'read_only',
    capabilities,
    input_types: inputTypes,
    output_types: outputTypes,
    data_sources: dataSources,
  };
}

export function parseStroops(value) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(value)) return null;
  try {
    const amount = BigInt(value);
    return amount <= MAX_INT64 ? amount.toString() : null;
  } catch {
    return null;
  }
}

export function parsePiToStroops(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  const match = normalized.match(/^(0|[1-9][0-9]{0,17})(?:\.([0-9]{1,7}))?$/);
  if (!match) return null;
  try {
    const whole = BigInt(match[1]);
    const fraction = BigInt((match[2] || '').padEnd(7, '0') || '0');
    const amount = whole * 10000000n + fraction;
    return amount <= MAX_INT64 ? amount.toString() : null;
  } catch {
    return null;
  }
}

export function formatStroopsAsPi(value) {
  const amountText = parseStroops(value);
  if (amountText === null) return null;
  const amount = BigInt(amountText);
  const whole = amount / 10000000n;
  const remainder = amount % 10000000n;
  if (remainder === 0n) return whole.toString();
  return whole.toString() + '.' + remainder.toString().padStart(7, '0').replace(/0+$/, '');
}

export function isMarketplaceUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const MARKETPLACE_CATEGORIES = Object.freeze([
  'cybersecurity','global_intelligence','market_research','pi_network','research','other',
]);
export const MARKETPLACE_BILLING_PERIODS = Object.freeze(['per_run','weekly','monthly']);
export const MARKETPLACE_LICENSES = Object.freeze([
  'rental_access_only','personal_use_rental','commercial_use_rental',
]);