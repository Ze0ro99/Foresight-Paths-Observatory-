import { NextResponse } from 'next/server';
import { getSupabaseServerHeaders, getSupabaseServerKeyKind } from '@/lib/supabase-server-headers.mjs';
import { enrichGlobalSignal } from '@/lib/world-monitor-engine';
import { GlobalSensedSignal } from '@/lib/types';

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number | null;
    url: string | null;
    title: string | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface EonetEvent {
  id: string;
  title: string;
  link?: string;
  categories?: { id: string; title: string }[];
  geometry?: { date: string; coordinates: [number, number] | number[][] }[];
}


async function persistHazards(
  sourceKey: 'usgs-earthquakes' | 'nasa-eonet',
  rows: Array<Record<string, unknown>>,
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || key === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') return 'not_configured';
  const keyKind = getSupabaseServerKeyKind(key);
  if (keyKind !== 'secret_key' && keyKind !== 'legacy_service_role_jwt') return 'server_key_misconfigured';
  if (rows.length === 0) return 'no_new_rows';

  const headers = {
    ...getSupabaseServerHeaders(key),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  try {
    const claim = await fetch(`${base}/rest/v1/rpc/claim_source_refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_source_key: sourceKey, p_min_interval_seconds: 90 }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!claim.ok) return 'unavailable';
    if (!(await claim.json())) return 'rate_limited';

    const response = await fetch(`${base}/rest/v1/rpc/ingest_hazard_batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_source_key: sourceKey, p_rows: rows }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return 'write_failed';
    return `persisted:${await response.json() as number}`;
  } catch {
    return 'unavailable';
  }
}

function classifyEonetHazard(title: string): string {
  const value = title.toLowerCase();
  if (/wildfire|fire/.test(value)) return 'wildfire';
  if (/flood/.test(value)) return 'flood';
  if (/storm|hurricane|cyclone|typhoon/.test(value)) return 'storm';
  if (/volcano|volcanic/.test(value)) return 'volcano';
  if (/tsunami/.test(value)) return 'tsunami';
  if (/drought/.test(value)) return 'drought';
  return 'other';
}

export async function GET() {
  const signals: GlobalSensedSignal[] = [];
  let usgsCount = 0;
  let eonetCount = 0;

  // USGS authoritative earthquake feed (M4.5+, past 24 hours).
  try {
    const usgsRes = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      {
        signal: AbortSignal.timeout(4500),
        next: { revalidate: 60 },
      }
    );
    if (usgsRes.ok) {
      const geo = (await usgsRes.json()) as { features?: UsgsFeature[] };
      const features = Array.isArray(geo.features) ? geo.features.slice(0, 8) : [];
      for (const f of features) {
        const lng = f.geometry?.coordinates?.[0];
        const lat = f.geometry?.coordinates?.[1];
        const sourceTime = f.properties?.time;
        // Missing source timestamps must not be replaced with the current time.
        if (
          typeof lat !== 'number' ||
          typeof lng !== 'number' ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180 ||
          typeof sourceTime !== 'number' ||
          !Number.isFinite(sourceTime) ||
          sourceTime > Date.now() + 5 * 60 * 1000 ||
          typeof f.properties?.mag !== 'number' ||
          !Number.isFinite(f.properties.mag)
        ) {
          continue;
        }
        const mag = Number(f.properties.mag.toFixed(1));
        const ts = new Date(sourceTime).toISOString();
        signals.push(
          enrichGlobalSignal({
            id: `usgs-${f.id}`,
            source: 'USGS_Seismic',
            category: 'seismic',
            title: f.properties?.title || `M ${mag} Earthquake`,
            locationName: f.properties?.place || 'Global Seismic Zone',
            lat,
            lng,
            magnitudeOrSeverity: mag,
            severityLabel: `M${mag}`,
            publishedAtIso: ts,
            url: f.properties?.url ?? undefined,
          })
        );
        usgsCount++;
      }
    }
  } catch {
    // Keep the endpoint available when USGS is temporarily unreachable.
  }

  // NASA EONET open natural-hazard events.
  try {
    const eonetRes = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?limit=6&status=open',
      {
        signal: AbortSignal.timeout(4500),
        next: { revalidate: 120 },
      }
    );
    if (eonetRes.ok) {
      const data = (await eonetRes.json()) as { events?: EonetEvent[] };
      const events = Array.isArray(data.events) ? data.events : [];
      for (const ev of events) {
        const latestGeom = ev.geometry?.[ev.geometry.length - 1];
        const coords = latestGeom?.coordinates;
        const sourceTime = latestGeom?.date;
        if (
          !Array.isArray(coords) ||
          typeof coords[0] !== 'number' ||
          typeof coords[1] !== 'number' ||
          !Number.isFinite(coords[0]) ||
          !Number.isFinite(coords[1]) ||
          coords[0] < -180 ||
          coords[0] > 180 ||
          coords[1] < -90 ||
          coords[1] > 90 ||
          typeof sourceTime !== 'string' ||
          !Number.isFinite(Date.parse(sourceTime)) ||
          Date.parse(sourceTime) > Date.now() + 5 * 60 * 1000
        ) {
          continue;
        }
        const [lng, lat] = coords;
        const catTitle = ev.categories?.[0]?.title ?? 'Natural Hazard';
        signals.push(
          enrichGlobalSignal({
            id: `eonet-${ev.id}`,
            source: 'NASA_EONET',
            category: 'natural_hazard',
            title: ev.title,
            // EONET geometry is not necessarily a named city or exact incident location.
            locationName: `${catTitle} event geometry`,
            lat,
            lng,
            // EONET does not provide a comparable severity score here; do not invent one.
            magnitudeOrSeverity: 0,
            severityLabel: 'Unrated (NASA EONET)',
            publishedAtIso: new Date(sourceTime).toISOString(),
            url: ev.link,
          })
        );
        eonetCount++;
      }
    }
  } catch {
    // Keep the endpoint available when NASA EONET is temporarily unreachable.
  }

  signals.sort((a, b) => a.ageHours - b.ageHours);

  const observedAt = new Date().toISOString();
  const usgsRows = signals
    .filter((signal) => signal.source === 'USGS_Seismic')
    .map((signal) => ({
      external_id: signal.id.replace(/^usgs-/, ''),
      hazard_type: 'earthquake',
      title: signal.title,
      description: null,
      severity_label: signal.severityLabel,
      magnitude: signal.magnitudeOrSeverity,
      latitude: signal.lat,
      longitude: signal.lng,
      location_label: signal.locationName,
      occurred_at: signal.publishedAtIso,
      observed_at: observedAt,
      source_url: signal.url || 'https://earthquake.usgs.gov/',
      status: 'active',
      properties: { provider: 'USGS', signal_category: signal.category },
    }));
  const eonetRows = signals
    .filter((signal) => signal.source === 'NASA_EONET')
    .map((signal) => ({
      external_id: signal.id.replace(/^eonet-/, ''),
      hazard_type: classifyEonetHazard(signal.title),
      title: signal.title,
      description: null,
      severity_label: signal.severityLabel,
      magnitude: null,
      latitude: signal.lat,
      longitude: signal.lng,
      location_label: signal.locationName,
      occurred_at: signal.publishedAtIso,
      observed_at: observedAt,
      source_url: signal.url || 'https://eonet.gsfc.nasa.gov/',
      status: 'active',
      properties: { provider: 'NASA EONET', geometry_is_event_location: true },
    }));
  const persistence = await Promise.all([
    persistHazards('usgs-earthquakes', usgsRows),
    persistHazards('nasa-eonet', eonetRows),
  ]);

  return NextResponse.json({
    fetchedAtUtc: observedAt,
    persistence: { usgs: persistence[0], nasaEonet: persistence[1] },
    coverage: 'partial',
    coverageNote:
      'Only source-attributed USGS and NASA EONET events are included. This endpoint is not a comprehensive global news feed; unavailable sources are not replaced with synthetic alerts. Records without valid source timestamps are omitted.',
    sources: {
      usgsCount,
      eonetCount,
      osintCount: 0,
    },
    signals,
  });
}
