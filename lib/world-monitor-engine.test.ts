import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENCRYPTED_MAP_NODES,
  SUBSEA_CABLES,
  MARITIME_CHOKEPOINTS,
  computeQClockWorldSweep,
  correlateEncryptedAndGlobalSignals,
  enrichGlobalSignal,
  filterSignalsByTimeRange,
  buildWorldSignalDossier,
} from './world-monitor-engine';
import { computeScenarioProbabilities } from './trajectory-engine';
import { SEED_EVENTS } from './seed-data';

test('ENCRYPTED_MAP_NODES covers Economist 2027, Great Awakening, and Q-Web coordinates cleanly', () => {
  assert.ok(ENCRYPTED_MAP_NODES.length >= 8);
  assert.ok(SUBSEA_CABLES.length >= 4);
  assert.ok(MARITIME_CHOKEPOINTS.length >= 4);
  const london = ENCRYPTED_MAP_NODES.find((n) => n.id === 'enc-economist-london');
  assert.ok(london);
  assert.equal(london.mapSource, 'economist_2027');
  assert.equal(london.epistemicTier, 'symbolic');
});

test('enrichGlobalSignal marks Gematria/Pi overlays as symbolic rather than documented evidence', () => {
  const signal = enrichGlobalSignal({
    id: 'sig-test-1',
    source: 'USGS_Seismic',
    category: 'seismic',
    title: 'M 5.4 - Aegean Sea Seismic Swarm',
    locationName: 'Eastern Mediterranean',
    lat: 35.5,
    lng: 27.1,
    magnitudeOrSeverity: 5.4,
    severityLabel: 'M5.4',
    publishedAtIso: new Date(Date.now() - 2 * 3600000).toISOString(),
  });

  assert.ok(signal.gematriaOrdinal > 0);
  assert.ok(signal.piResonanceIndex > 0);
  assert.equal(signal.epistemicTier, 'symbolic');
  assert.equal(signal.nearestEncryptedId, 'enc-giza-orion');
  assert.ok(signal.distanceToEncryptedKm > 400 && signal.distanceToEncryptedKm < 1000);
});

test('filterSignalsByTimeRange accurately gates signals by 1h / 6h / 24h windows', () => {
  const fresh = enrichGlobalSignal({
    id: 'sig-fresh',
    source: 'OSINT_Relay',
    category: 'cyber_infra',
    title: 'BGP Route Leak',
    locationName: 'London',
    lat: 51.5,
    lng: -0.12,
    magnitudeOrSeverity: 6,
    severityLabel: 'High',
    publishedAtIso: new Date(Date.now() - 20 * 60000).toISOString(),
  });
  const stale = enrichGlobalSignal({
    id: 'sig-old',
    source: 'NASA_EONET',
    category: 'natural_hazard',
    title: 'Wildfire Cluster',
    locationName: 'California',
    lat: 36.7,
    lng: -119.4,
    magnitudeOrSeverity: 4,
    severityLabel: 'Open',
    publishedAtIso: new Date(Date.now() - 36 * 3600000).toISOString(),
  });

  assert.equal(filterSignalsByTimeRange([fresh, stale], '1h').length, 1);
  assert.equal(filterSignalsByTimeRange([fresh, stale], '24h').length, 1);
  assert.equal(filterSignalsByTimeRange([fresh, stale], '48h').length, 2);
});

test('computeQClockWorldSweep & correlateEncryptedAndGlobalSignals rank aligned nodes higher', () => {
  const sweep = computeQClockWorldSweep(17);
  assert.equal(sweep.sector, 17);
  assert.ok(sweep.activeLng >= -180 && sweep.activeLng <= 180);
  assert.ok(sweep.oppositeLng >= -180 && sweep.oppositeLng <= 180);

  const sig = enrichGlobalSignal({
    id: 'sig-lon',
    source: 'OSINT_Relay',
    category: 'cyber_infra',
    title: 'SWIFT Clearing Latency',
    locationName: 'London',
    lat: 51.5,
    lng: -0.12,
    magnitudeOrSeverity: 7,
    severityLabel: 'Elevated',
    publishedAtIso: new Date().toISOString(),
  });
  const corrs = correlateEncryptedAndGlobalSignals([sig], 17);
  assert.equal(corrs.length, 1);
  assert.equal(corrs[0].encryptedNodeId, 'enc-economist-london');
  assert.equal(corrs[0].qClockAligned, true);

  const probs = computeScenarioProbabilities(SEED_EVENTS);
  const dossier = buildWorldSignalDossier(
    { kind: 'encrypted_node', node: ENCRYPTED_MAP_NODES[0] },
    probs
  );
  assert.equal(dossier.kind, 'encrypted_node');
  assert.ok(dossier.stages.length === 3);
});
