import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('loads official Pi SDK before application hydration with a request nonce', async () => {
  const layout = await read('../app/layout.tsx');
  assert.match(layout, /https:\/\/sdk\.minepi\.com\/pi-sdk\.js/);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /nonce=\{nonce\}/);
});

test('shares one Pi SDK initialization promise and enforces one Sandbox mode', async () => {
  const sdk = await read('../lib/pi-sdk-client.ts');
  assert.match(sdk, /await initialization/);
  assert.match(sdk, /init\(\{ version: '2\.0', sandbox \}\)/);
  assert.match(sdk, /NEXT_PUBLIC_PI_SANDBOX_MODE === 'true'/);
  assert.match(sdk, /__foresightPiSdkSandbox/);
});

test('App Studio sign-in requests username only and submits only the access token', async () => {
  const login = await read('../components/PiAppStudioSignIn.tsx');
  assert.match(login, /authenticate\(\s*\[\s*'username'\s*\]/);
  assert.match(login, /body: JSON\.stringify\(\{ accessToken: auth\.accessToken \}\)/);
  assert.doesNotMatch(login, /auth\.user\??\.(uid|username)/);
});

test('App Studio route verifies the access token server-side and does not trust client identity', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  assert.match(route, /exchangePiAccessToken\(body\.accessToken\)/);
  assert.match(route, /user: verified\.user/);
  assert.doesNotMatch(route, /body\.uid|body\.username/);
});

test('the legacy payment panel is now identity-only until explicit payment release', async () => {
  const panel = await read('../components/PiSandboxPaymentPanel.tsx');
  assert.match(panel, /PiAppStudioSignInPanel/);
  assert.doesNotMatch(panel, /createPayment|authenticate\(/);
});

test('protocol gateway initializes Pi SDK before requesting username-only authentication', async () => {
  const protocol = await read('../components/ProtocolGatewayView.tsx');
  assert.match(protocol, /initializePiSdk\(/);
  assert.match(protocol, /await initializePiSdk\(\)/);
  assert.match(protocol, /authenticate\(\s*\[\s*'username'\s*\]/);
});

test('Pi App Studio sessions use encrypted HttpOnly cookies', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  const session = await read('../lib/pi-appstudio-session.mjs');
  assert.match(route, /httpOnly:\s*true/);
  assert.match(route, /secure:\s*true/);
  assert.match(route, /sameSite:\s*'none'/);
  assert.match(session, /aes-256-gcm/);
});
