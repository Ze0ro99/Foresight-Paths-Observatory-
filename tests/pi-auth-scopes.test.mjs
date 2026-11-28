import test from 'node:test';
import assert from 'node:assert/strict';
import { getPiAuthScopes } from '../lib/pi-auth-scopes.mjs';

test('requests username only while payments are disabled', () => {
  assert.deepEqual(getPiAuthScopes(false), ['username']);
});

test('requests payments scope only after explicit public payment switch', () => {
  assert.deepEqual(getPiAuthScopes(true), ['username', 'payments']);
});

test('defaults to username-only identity authentication', () => {
  assert.deepEqual(getPiAuthScopes(), ['username']);
});
