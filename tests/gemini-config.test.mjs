import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_GEMINI_MODEL, getGeminiModel } from '../lib/gemini-config.mjs';

test('uses the documented stable Flash model by default', () => {
  assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash');
  assert.equal(getGeminiModel({}), 'gemini-3.8-flash');
});

test('allows a valid server-side model override', () => {
  assert.equal(getGeminiModel({ GEMINI_MODEL: 'gemini-3.1-pro-preview' }), 'gemini-3.1-pro-preview');
  assert.equal(getGeminiModel({ GEMINI_MODEL: '  gemini-3.8-flash  ' }), 'gemini-3.8-flash');
});

test('rejects malformed or blank model overrides and uses the safe default', () => {
  assert.equal(getGeminiModel({ GEMINI_MODEL: '' }), DEFAULT_GEMINI_MODEL);
  assert.equal(getGeminiModel({ GEMINI_MODEL: 'not-a-model' }), DEFAULT_GEMINI_MODEL);
  assert.equal(getGeminiModel({ GEMINI_MODEL: 'gemini; drop table' }), DEFAULT_GEMINI_MODEL);
});
