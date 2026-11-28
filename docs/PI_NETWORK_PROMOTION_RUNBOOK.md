# Pi Network Promotion Runbook — V1

## Scope

Foresight Paths V1 is registered on **Pi Testnet**. The app's registered network is fixed in Pi Developer Portal; changing the SDK Sandbox flag does not change the registered network or enable Mainnet. Any future Mainnet release requires a separate Mainnet app, separate credentials and deployment, an independent security review, and explicit owner approval.

## Testnet operating modes

| Mode | Pi SDK initialization | Server settings | Use |
| --- | --- | --- | --- |
| Sandbox Testnet | `Pi.init({ version: "2.0", sandbox: true })` | `PI_NETWORK=Pi Testnet`, `PI_SANDBOX_MODE=true`, `NEXT_PUBLIC_PI_SANDBOX_MODE=true` | Development Sandbox only |
| Direct Testnet | `Pi.init({ version: "2.0", sandbox: false })` | `PI_NETWORK=Pi Testnet`, `PI_SANDBOX_MODE=false`, `NEXT_PUBLIC_PI_SANDBOX_MODE=false`, `PI_DIRECT_TESTNET_ENABLED=true` | Direct Pi Browser testing against the registered Testnet app |
| Mainnet | Separate app and deployment | Not supported by V1 | Future release only |

The server refuses payment execution when the registered network is missing/unsupported, browser/server Sandbox settings differ, or direct mode is not explicitly enabled. The normal V1 sign-in requests the `username` scope only.

## Vercel environment variables

Configure values directly in Vercel. Never paste secret values into chat, source files, browser forms, or logs.

- `PI_NETWORK`: exact value `Pi Testnet`.
- `PI_SANDBOX_MODE`: `false` for direct Testnet; `true` only for Sandbox.
- `NEXT_PUBLIC_PI_SANDBOX_MODE`: same boolean string as `PI_SANDBOX_MODE`.
- `PI_DIRECT_TESTNET_ENABLED`: `true` only when intentionally testing direct Pi Testnet mode.
- `PI_APP_SESSION_SECRET`: server-only session-encryption secret, at least 32 characters.
- `PI_API_KEY`: Testnet Server API Key; server-only and only needed for Platform API/payment operations.
- `SUPABASE_SERVICE_ROLE_KEY`: elevated server-only key for private ledger RPCs; never use a publishable/anon key and never expose it in a browser variable.
- `PI_PAYMENTS_ENABLED`: keep `false` until a separate, explicitly approved Test-Pi payment test.
- `PI_PAYMENT_INTENT_LEDGER_READY`: keep `false` until the private RPCs and service-role credential are verified at runtime.
- `PI_ENTITLEMENT_LEDGER_ENABLED`: keep `false`; V1 does not issue paid credits or entitlements.
- `PI_MAINNET_PAYMENTS_APPROVED`: keep `false`.

## Pi sign-in and public URL

1. Select the existing Pi Testnet app in Developer Portal and confirm its exact Production/Development URL settings.
2. The App Studio sign-in path requests `username` only and sends the returned access token to the server-side App Studio exchange endpoint. The server validates the returned Pioneer identity and session token before issuing its encrypted HttpOnly cookie. This external endpoint still requires an actual Pi Browser login test.
3. The separate Pi Sign-In OAuth option uses the registered HTTPS redirect URI and a random `state`; the browser checks state and clears the URL fragment, then the server validates the access token with Pi `GET /v2/me` before issuing a separate encrypted HttpOnly cookie.
4. A Vercel Preview marked `READY` is not necessarily public. Keep SSO enabled; use an owner-approved public HTTPS app URL for Pi Browser testing.
5. Confirm `GET /api/pi/verify` reports `network: Pi Testnet`, matching SDK/server Sandbox configuration, direct-Testnet status, and no secrets.
6. Test login, logout, session persistence after refresh, and rejection of invalid/expired tokens. Do not run payments in this phase.

## Payment and Mainnet boundaries

Payment approval/completion/recovery remain disabled. The backend's plan prices and Pi Testnet payment ownership/network checks do not make a payment test safe by themselves. Before a Test-Pi transaction, separately approve the exact demo amount and ensure the private ledger uses a valid service-role key. Every test response must keep `entitlementGranted: false`.

Mainnet is not an environment toggle on this Testnet app. A future Mainnet release requires a separate application registration, URL, Server API Key, isolated ledger namespace, entitlement/refund design, independent security review, and explicit owner approval. Do not enable A2U, auto-signing, x402 settlement, or paid entitlement delivery as a side effect.

## V1 release gates

- Exact-head GitHub Actions lint, unit tests, TypeScript, and production build pass.
- Vercel Preview is `READY` on that exact commit; stale deploys do not count.
- Pi Browser can open the approved public HTTPS URL and complete identity verification.
- The App Studio exchange or optional OAuth path is tested end-to-end; invalid/cross-user sessions fail closed.
- Supabase private RPCs are verified as service-role-only and the migration history matches the tracked migration files.
- Health/data endpoints report partial or unavailable upstream data honestly.
- Human review and explicit release approval are complete before merge or production release.

## Known external prerequisites

The owner must verify the Pi Developer Portal redirect/development URL and perform the real Pi Browser authentication test. The correct elevated `SUPABASE_SERVICE_ROLE_KEY` and Pi Testnet Server API Key, if payment/ledger functionality is needed, must be entered directly into Vercel. Do not send either secret to chat. Do not mark the app fully released until these gates are evidenced.
