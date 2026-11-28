import test from 'node:test';
import assert from 'node:assert/strict';
import { getPiAuthScopes } from '../lib/pi-auth-scopes.mjs';

test('requests username only when Pi payments are disabled', () => {
  assert.deepEqual(getPiAuthScopes(false), ['username']);
});

test('adds payments scope only after explicit feature enablement', () => {
  assert.deepEqual(getPiAuthScopes(true), ['username', 'payments']);
});

test('defaults to identity-only authentication', () => {
  assert.deepEqual(getPiAuthScopes(), ['username']);
});
