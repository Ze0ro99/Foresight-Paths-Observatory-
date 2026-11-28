import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Pi browser CSP uses a request nonce and explicit Pi origins', async () => {
  const middleware = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8');
  const nextConfig = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');
  const scriptSrc = middleware.match(/`script-src[^\`]+`/)?.[0] ?? '';
  const connectSrc = middleware.match(/"connect-src[^"]+"/)?.[0] ?? '';
  const frameAncestors = middleware.match(/"frame-ancestors[^"]+"/)?.[0] ?? '';

  assert.match(middleware, /crypto\.randomUUID\(\)/);
  assert.match(scriptSrc, /'nonce-\$\{nonce\}'/);
  assert.match(scriptSrc, /https:\/\/sdk\.minepi\.com/);
  assert.doesNotMatch(scriptSrc, /unsafe-inline|\*/);
  assert.match(connectSrc, /'self'/);
  assert.match(connectSrc, /https:\/\/socialchain\.app/);
  assert.match(connectSrc, /https:\/\/mlrbbnjoczpfmbgewgrm\.supabase\.co/);
  assert.doesNotMatch(connectSrc, /\*/);
  assert.doesNotMatch(connectSrc, /backend\.appstudio/);
  assert.match(frameAncestors, /https:\/\/\*\.pinet\.com/);
  assert.ok(frameAncestors.includes('https://appstudio-u7cm9zhmha0ruwv8.piappengine.com'));
  assert.match(frameAncestors, /https:\/\/\*\.minepi\.com/);
  assert.doesNotMatch(frameAncestors, /(^|\s)\*(\s|;|$)/);
  assert.match(middleware, /pi-app-validation\.txt/);
  assert.match(middleware, /validation-key\.txt/);
});
