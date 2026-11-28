import test from 'node:test';
import assert from 'node:assert/strict';
import { getMapPresentation } from '../lib/presentation-mode.mjs';

test('Simple Mode hides seeded scenarios, forecasts, and scenario arcs', () => {
  const input = {
    events: [{ id: 'demo-event' }],
    forecasts: [{ id: 'demo-forecast' }],
    geodesicArcs: [{ id: 'demo-arc' }],
  };

  assert.deepEqual(getMapPresentation('simple', input), {
    events: [],
    forecasts: [],
    geodesicArcs: [],
  });
});

test('Pro Mode preserves the supplied scenario workspace', () => {
  const input = {
    events: [{ id: 'demo-event' }],
    forecasts: [{ id: 'demo-forecast' }],
    geodesicArcs: [{ id: 'demo-arc' }],
  };
  const actual = getMapPresentation('pro', input);

  assert.equal(actual.events, input.events);
  assert.equal(actual.forecasts, input.forecasts);
  assert.equal(actual.geodesicArcs, input.geodesicArcs);
});

test('Unknown presentation modes fail closed to the Simple Mode data surface', () => {
  assert.deepEqual(getMapPresentation('preview', {
    events: [{ id: 'unexpected' }],
  }), {
    events: [],
    forecasts: [],
    geodesicArcs: [],
  });
});

test('Missing or malformed collections produce safe empty arrays in Pro Mode', () => {
  assert.deepEqual(getMapPresentation('pro', {
    events: null,
    forecasts: 'not-an-array',
  }), {
    events: [],
    forecasts: [],
    geodesicArcs: [],
  });
});
