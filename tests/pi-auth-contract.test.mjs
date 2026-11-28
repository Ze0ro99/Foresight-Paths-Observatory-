import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('loads official Pi SDK before hydration and keeps the CSP nonce', async () => {
  const layout = await read('../app/layout.tsx');
  assert.match(layout, /https:\/\/sdk\.minepi\.com\/pi-sdk\.js/);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /nonce=\{nonce\}/);
  assert.doesNotMatch(layout, /next\/font\/google/);
});

test('initializes the Pi SDK with the configured and shared SDK mode', async () => {
  const sdk = await read('../lib/pi-sdk-client.ts');
  assert.match(sdk, /init\(\{ version: '2\.0', sandbox \}\)/);
  assert.match(sdk, /__foresightPiSdkSandbox/);
  assert.match(sdk, /NEXT_PUBLIC_PI_SANDBOX_MODE === 'true'/);
});

test('App Studio sign-in requests username only and submits only the access token', async () => {
  const login = await read('../components/PiAppStudioSignIn.tsx');
  assert.match(login, /authenticate\(\s*\[\s*'username'\s*\]/);
  assert.match(login, /body: JSON\.stringify\(\{ accessToken: auth\.accessToken \}\)/);
  assert.doesNotMatch(login, /auth\.user\??\.(uid|username)/);
});

test('App Studio exchange ignores client-supplied identity', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  assert.match(route, /exchangePiAccessToken\(body\.accessToken\)/);
  assert.match(route, /user: verified\.user/);
  assert.doesNotMatch(route, /body\.uid|body\.username/);
});

test('legacy payment panel remains identity-only', async () => {
  const panel = await read('../components/PiSandboxPaymentPanel.tsx');
  assert.match(panel, /PiAppStudioSignInPanel/);
  assert.doesNotMatch(panel, /createPayment|authenticate\(/);
});

test('Pi Testnet private RPC route validates the elevated Supabase key', async () => {
  const route = await read('../app/api/pi/verify/route.ts');
  assert.match(route, /getSupabaseServerKeyKind/);
  assert.match(route, /getSupabaseServerHeaders/);
});

test('App Studio session is encrypted and uses secure HttpOnly cookies', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  const session = await read('../lib/pi-appstudio-session.mjs');
  assert.match(route, /httpOnly:\s*true/);
  assert.match(route, /secure:\s*true/);
  assert.match(session, /aes-256-gcm/);
});
