import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('loads official Pi SDK in the document head before application hydration', async () => {
  const layout = await read('../app/layout.tsx');
  assert.match(layout, /https:\/\/sdk\.minepi\.com\/pi-sdk\.js/);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /<head>/);
  assert.match(layout, /nonce=\{nonce\}/);
});

test('awaits Pi SDK v2 initialization without passing sandbox', async () => {
  const sdk = await read('../lib/pi-sdk-client.ts');
  assert.match(sdk, /await initialization/);
  assert.match(sdk, /init\\(\\{ version: '2\\.0' \\}\\)/);
  assert.doesNotMatch(sdk, /init\\(\\{[^}]*sandbox/);
});

test('server Pi verification trusts App Studio session and never calls /v2/me', async () => {
  const route = await read('../app/api/pi/verify/route.ts');
  assert.match(route, /openPiAppStudioSession/);
  assert.match(route, /getAuthenticatedPiUser/);
  assert.doesNotMatch(route, /api\.minepi\.com\/v2\/me|verifyUser\(|getBearer\(/);
});

test('browser Pi sign-in requests username only and ignores SDK identity fields', async () => {
  const login = await read('../components/PiAppStudioSignIn.tsx');
  const protocol = await read('../components/ProtocolGatewayView.tsx');
  assert.match(login, /authenticate\(\s*\[\s*'username'\s*\]/);
  assert.match(login, /body: JSON\.stringify\(\{ accessToken: auth\.accessToken \}\)/);
  assert.doesNotMatch(login, /auth\.user\??\.(uid|username)/);
  assert.match(protocol, /authenticate\(\s*\[\s*'username'\s*\]/);
  assert.match(protocol, /body: JSON\.stringify\(\{ accessToken: auth\.accessToken \}\)/);
  assert.doesNotMatch(protocol, /auth\.user\??\.(uid|username)/);
});

test('App Studio exchange ignores browser-supplied uid and username', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  assert.match(route, /exchangePiAccessToken\(body\.accessToken\)/);
  assert.match(route, /user: verified\.user/);
  assert.doesNotMatch(route, /body\.uid|body\.username/);
});

test('PiNet session cookies are encrypted, HttpOnly, Secure and SameSite=None', async () => {
  const route = await read('../app/api/pi/auth/route.ts');
  const session = await read('../lib/pi-appstudio-session.mjs');
  assert.match(route, /httpOnly:\s*true/);
  assert.match(route, /secure:\s*true/);
  assert.match(route, /sameSite:\s*'none'/);
  assert.match(session, /aes-256-gcm/);
});

test('legacy payment panel no longer initializes Pi in Sandbox mode', async () => {
  const panel = await read('../components/PiSandboxPaymentPanel.tsx');
  assert.match(panel, /PiAppStudioSignInPanel/);
  assert.doesNotMatch(panel, /sandbox:\s*true|authenticate\(/);
});
