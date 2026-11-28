import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Pi app validation token is served as an exact static file body', async () => {
  const contents = await readFile(new URL('../public/pi-app-validation.txt', import.meta.url), 'utf8');
  assert.equal(contents, 'piappstudio-Ou9AnUs298C_kMPSWNAKFpw4-vdeaF0r');
});
