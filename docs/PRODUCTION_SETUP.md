# Production setup and release checklist

The public deployment can serve the read-only map without credentials. Optional integrations remain unavailable until their credentials and supporting infrastructure are configured.

## 1. Vercel environment variables

Add the following under **Project → Settings → Environment Variables**, for Preview and Production as appropriate:

| Variable | Required for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini event analysis | Server-only secret. Never expose with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL` | Gemini model selection | Defaults to `gemini-3.8-flash`; override only with a model enabled for the key. |
| `PI_API_KEY` | Pi server-side identity/payment operations | Testnet app key for Preview; server-only secret. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public read-only Foresight data | Must point to `foresight-paths-dev`, not the PiRC project. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public read-only Foresight data | Publishable key; RLS limits public access to SELECT. |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Vercel RPCs: Pi payment intents, CISA cache, Global Sense persistence, URL-inspection rate limits | Server-only elevated key. Accepts a modern `sb_secret_...` key or a legacy JWT with `role=service_role`; rejects publishable/anon/user keys. Never use a `NEXT_PUBLIC_` prefix. The GDELT refresh Edge Function uses Supabase's injected `SUPABASE_SECRET_KEYS` internally. |
| `PI_NETWORK` | Pi server environment | Must be exactly `Pi Testnet` for this gateway. Mainnet is rejected. |
| `PI_SANDBOX_MODE` | Pi server environment | `true` by default; `false` only for explicitly enabled direct Testnet mode. |
| `PI_DIRECT_TESTNET_ENABLED` | Direct Testnet SDK mode | Must be `true` when `PI_SANDBOX_MODE=false`; does not change the app's registered network. |
| `NEXT_PUBLIC_PI_SANDBOX_MODE` | Pi browser SDK environment | Must match `PI_SANDBOX_MODE`; client-side setting only. |
| `PI_PAYMENTS_ENABLED` | Pi Testnet approval/completion | `false` by default; Preview-only demo release gate. |
| `PI_PAYMENT_INTENT_LEDGER_READY` | Private payment-intent persistence | `false` by default; set only when the isolated Supabase private RPCs are configured. |
| `PI_ENTITLEMENT_LEDGER_ENABLED` | Paid credit/entitlement delivery | Must remain `false` until balances, refunds, and entitlement delivery are separately implemented and tested. |
| `PI_MAINNET_PAYMENTS_APPROVED` | Mainnet payment release | `false` by default; requires the owner’s explicit approval after Testnet end-to-end validation. |

After changing variables, redeploy the relevant environment. Never commit real credentials. For `/api/news`, Preview needs only the public Supabase URL and publishable key. The fixed-query `news-refresh` Edge Function checks that public key, uses the server-injected Supabase secret inside its own runtime, and applies a five-minute shared database lock; do not copy a Supabase secret/service-role value into Vercel for news ingestion. Other server-side write paths must reject public/anon keys and require the elevated key above.

## 2. Pi integration boundary

Pi identity has two separate paths: the App Studio sign-in path issues an encrypted App Studio session after the server-side exchange; the optional Pi OAuth path verifies OAuth `state` and validates the access token with Pi `GET /v2/me` before issuing its own session. Neither path trusts client-provided UID or username values. Both need real Pi Browser end-to-end validation.


The backend uses the official Pi Platform API v2:
- Verify the user access token with `GET /me`.
- Retrieve the payment record before approval/completion. The SDK's `onIncompletePaymentFound` callback runs before `Pi.authenticate()` resolves, so the client must queue the callback DTO and block new payments. Once authentication resolves, it sends the verified Pioneer Bearer token with the payment ID. The backend verifies the token through `/v2/me`, retrieves the app-scoped payment with the Server API Key, and requires `payment.user_uid` to match the authenticated Pioneer before recovery.
- Check the server-known plan amount, payment owner UID, and plan metadata.
- Approve only a matching payment.
- Complete with the transaction ID supplied by the Pi SDK.
- Read the payment back and require both `transaction_verified` and `developer_completed` before reporting settlement.

**Important:** a private Testnet payment-intent ledger and service-role-only RPCs are now deployed in the isolated Foresight Supabase project. This persists idempotent intent state and verifies the Pi transaction read-back, but it does not yet implement product entitlements, prepaid-credit balances, refunds, or merchant settlement. A verified settlement is not the same as granting a prepaid credit or premium entitlement. Do not sell or advertise redeemable credits until those workflows are implemented and tested.

Testnet payment approval/completion fail closed unless `PI_NETWORK=Pi Testnet`, matching server/browser Sandbox settings, the direct-Testnet guard when Sandbox is false, `PI_API_KEY`, a valid elevated server-only `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_...` or a legacy JWT whose role is `service_role`), the isolated Foresight Supabase URL, `PI_PAYMENTS_ENABLED=true`, and `PI_PAYMENT_INTENT_LEDGER_READY=true` are all configured in Preview. The registered app is Testnet-only. Direct SDK mode is separately opt-in through `PI_SANDBOX_MODE=false` plus `PI_DIRECT_TESTNET_ENABLED=true` and requires `PI_NETWORK=Pi Testnet`; the app network remains fixed at registration. The readiness endpoint checks that `PI_SANDBOX_MODE` and `NEXT_PUBLIC_PI_SANDBOX_MODE` match and reports the exact Supabase key classification without exposing key contents. The latest PR #15 branch has not yet received a current-head Vercel Preview because this Vercel project is returning a build-rate-limit status for that branch. A prior Preview on the same project reported the configured `SUPABASE_SERVICE_ROLE_KEY` as `publishable_key`; therefore Vercel-side private RPCs (Pi intent persistence, CISA cache, Global Sense persistence, and URL-inspection rate limits) must fail closed until that value is replaced by an elevated key from `foresight-paths-dev`. The `agent-workbench` and `news-refresh` Edge Functions instead use Supabase's platform-injected `SUPABASE_SECRET_KEYS` in their own runtime; they do not need the Supabase secret copied into Vercel. `PI_PAYMENTS_ENABLED=false` and `PI_PAYMENT_INTENT_LEDGER_READY=false` remain in Preview. Do not enable either release flag, grant public RPC permissions, or copy secret values into source control or chat. Any future payment release requires explicit owner approval and a separate Pi Browser Testnet end-to-end review. `PI_ENTITLEMENT_LEDGER_ENABLED` remains false: a verified test payment is recorded, but no prepaid balance or paid feature is granted. The Pi route is hard-locked to the registered Pi Testnet network and rejects Mainnet payments; SDK Sandbox is a separate client-development flag. A future Mainnet release requires a separately registered Mainnet Pi app, independent security review, completed entitlements/refunds, and the owner's explicit approval; it is not enabled by this route. The Pi Developer Portal locks an app to the network chosen at registration, so a Testnet app cannot be switched to Mainnet. Rewarded ads remain disabled until a trusted provider callback is integrated and verified server-side.


## 3. Pi Developer Portal: Testnet/Sandbox setup

1. Register or select a **Testnet app** in the Pi Developer Portal from Pi Browser. Pi locks an app to its registered network; Mainnet requires a separate app and is not enabled here.
2. Configure the Testnet app's Development URL and use the Sandbox URL provided by the Portal. Authorize the Sandbox app from Pi Utilities in the Pi app when prompted.
3. The site loads `https://sdk.minepi.com/pi-sdk.js` and initializes SDK v2 with the configured `NEXT_PUBLIC_PI_SANDBOX_MODE`. Direct mode (`sandbox: false`) is permitted only when the server also has `PI_NETWORK=Pi Testnet` and `PI_DIRECT_TESTNET_ENABLED=true`. The core Agent Operations Workbench requests the `username` scope only. The native Pi Subscription simulator requests `username` and `payments` only after the user explicitly starts its simulate-only check. The separate legacy Pi payment demo panel requests `username` and `payments` after its own sign-in button to detect/recover an incomplete payment; new payment creation is guarded by the server readiness flags and remains disabled in the current Preview. Neither panel exposes Mainnet or automatic signing.
4. Copy the Server API Key for that **Testnet app** to Vercel Project → Settings → Environment Variables as a sensitive, server-only `PI_API_KEY` scoped to Preview and branch `feat/v1-testnet-direct-mode`. Never set a `NEXT_PUBLIC_` prefix or put the key into chat/source control.
5. The current Vercel project protects Preview deployments with Vercel Authentication. Pi Browser access to the protected Preview is not verified; do not disable SSO to make the test pass. Use an explicitly approved public HTTPS Testnet URL for the Portal's Development URL before running Pi Browser end-to-end tests.
6. Keep `PI_PAYMENTS_ENABLED=false` until public Pi Browser access and identity verification succeed. Then, with explicit owner approval, test only the labelled 0.1 and 1 Test-Pi demo plans. The backend verifies Pioneer identity, payment owner, plan, amount, Testnet network, approval, transaction completion, read-back, and private intent state. No paid credits or entitlements are delivered.

## 4. Current capability status

| Capability | Status |
| --- | --- |
| Public Arabic/RTL application | Available |
| Global sensing | Partial coverage: USGS + NASA EONET polling; GDELT may be unavailable independently |
| Known exploited vulnerabilities | Official CISA KEV catalog, 15-minute cached read-only feed; global entries do not establish that a user's assets are affected |
| Gemini analysis | Requires `GEMINI_API_KEY` |
| Pi identity | Requires Pi Browser SDK session and server verification |
| Pi payment approval/completion | Disabled by default; requires `PI_API_KEY`, a durable ledger, and explicit release flags |
| Private Testnet payment-intent persistence | Schema and RPCs deployed; Vercel Preview private writes fail closed because its configured key format is publishable, and release flags remain false |
| Durable prepaid/premium entitlements | Not implemented; requires separate credit/entitlement and refund workflows |
| x402 paid execution | Disabled; no trusted facilitator/settlement integration |
| Rewarded-ad grants | Disabled; no verified provider callback |
| Agent Operations Workbench | Pi-authenticated saved agent profiles, bounded read-only analyses, CISA KEV-backed cyber findings, off-chain proposals/votes, recurring-plan previews, and native Pi Testnet subscription simulation. No submit mode, external actions, or chain writes. |

## 5. Smoke checks

After deployment:
- `GET /` should return HTTP 200 and render Arabic RTL.
- `GET /api/health` should return HTTP 200 and accurately report configuration state.
- `GET /api/global-sense` should return source-attributed signals or an empty partial-coverage result when upstream sources are unavailable.
- `GET /api/news` should return GDELT source-attributed articles, a cached fallback, or an explicit unavailable state; never synthetic reports.
- The private `/api/agents/workbench` accepts authenticated POST requests only. A 405 response to GET is expected; test the authenticated flow from Pi Browser, not with an anonymous GET.
- The native subscription panel must run inside Pi Browser on the registered Testnet app. Register a service in Pi Developer Portal first, enter its Service ID and a public Testnet wallet address, then run the panel's simulate-only check. Never test with a wallet seed or passphrase.
- `GET /api/pi/verify` should report sandbox mode and whether the server key is configured, without exposing secrets.
- `GET /api/x402/mcp` should expose discovery only; paid execution remains disabled.

## 6. Security and release gates

- Keep Preview protected; only Production is public.
- Keep API keys server-side.
- Do not accept client-supplied prices or identity claims.
- Do not grant entitlements from a browser callback alone.
- Do not describe symbolic correlations as factual evidence or calibrated threat scores.
- Keep cloud-agent execution, paid x402 execution, and rewarded-ad grants disabled until their respective evidence and security gates are met.
- Run build, typecheck, unit tests, and a security review before enabling any paid feature.


### Pi native subscription simulation

The Cloud Agent workbench includes an optional Pi Testnet v1 subscription simulation. It requests the Pi `payments` scope only after the user explicitly presses the simulation control. The panel invokes the documented `Pi.SmartContract.Subscription.getService` and `subscribe` methods with `mode: 'simulate'`; this performs an RPC simulation without signing a transaction or charging Pi. A service must already be registered in the Pi Developer Portal and its Service ID entered in the app. The panel does not call `registerService`, `process`, or any `submit` mode. Pi Testnet v1 supports approval windows just under 180 days (typically 5 monthly or 25 weekly periods); merchant renewals require an explicit `process` call and are not automatic. See the [official Pi subscription implementation docs](https://developers.minepi.com/docs/subscriptions/Implementation) and [additional methods](https://developers.minepi.com/docs/subscriptions/AdditionalMethods).
