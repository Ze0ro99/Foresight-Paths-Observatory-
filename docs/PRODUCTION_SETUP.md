# Production setup and release checklist

The public deployment can serve the read-only map without credentials. Optional integrations remain unavailable until their credentials and supporting infrastructure are configured.

## 1. Vercel environment variables

Add the following under **Project → Settings → Environment Variables**, for Preview and Production as appropriate:

| Variable | Required for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini event analysis | Server-only secret. |
| `PI_API_KEY` | Pi server-side identity/payment operations | Testnet app key for Preview; server-only secret. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public read-only Foresight data | Must point to `foresight-paths-dev`, not the PiRC project. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public read-only Foresight data | Publishable key; RLS limits public access to SELECT. |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Testnet payment-intent RPCs | Server-only elevated key; never use a `NEXT_PUBLIC_` prefix. |
| `PI_NETWORK` | Pi server environment | Must be exactly `Pi Testnet`; app network is fixed in Pi Developer Portal. |
| `PI_SANDBOX_MODE` | Pi server SDK mode | `true` only for the Pi Sandbox; `false` for direct SDK mode on the registered Testnet app. |
| `PI_DIRECT_TESTNET_ENABLED` | Direct Testnet guard | Must be `true` when Sandbox is false; this does not enable payment execution. |
| `NEXT_PUBLIC_PI_SANDBOX_MODE` | Pi browser SDK mode | Must match `PI_SANDBOX_MODE`; controls only SDK Sandbox mode. |
| `PI_APP_SESSION_SECRET` | Encrypted Pi browser sessions | Server-only secret, at least 32 characters; never expose it to the client. |
| `NEXT_PUBLIC_PI_OAUTH_CLIENT_ID` | Optional Pi Sign-In OAuth | Public client ID issued by Pi Developer Portal. |
| `NEXT_PUBLIC_PI_OAUTH_REDIRECT_URI` | Optional Pi Sign-In OAuth | Exact HTTPS redirect URI registered in Pi Developer Portal. |
| `PI_PAYMENTS_ENABLED` | Pi Testnet approval/completion | `false` by default; Preview-only demo release gate. |
| `PI_PAYMENT_INTENT_LEDGER_READY` | Private payment-intent persistence | `false` by default; set only when the isolated Supabase private RPCs are configured. |
| `PI_ENTITLEMENT_LEDGER_ENABLED` | Paid credit/entitlement delivery | Must remain `false` until balances, refunds, and entitlement delivery are separately implemented and tested. |
| `PI_MAINNET_PAYMENTS_APPROVED` | Mainnet payment release | `false` by default; requires the owner’s explicit approval after Testnet end-to-end validation. |

After changing variables, redeploy the relevant environment. Never commit real credentials.

## 2. Pi integration boundary

The application exposes two separate identity paths:
- **Pi App Studio sign-in:** the browser requests only the `username` scope with `Pi.authenticate()`, then posts the returned access token to the server. The server exchanges it with the configured App Studio authentication endpoint, validates the returned UID/username/session token, and issues an encrypted, HttpOnly session cookie. The App Studio endpoint must be reachable and verified in a real Pi Browser session.
- **Pi Sign-In OAuth (optional):** the browser verifies the returned OAuth `state`, removes the token fragment from the URL, and posts the access token to the server. The server validates it against Pi `GET /v2/me` before issuing its own encrypted, HttpOnly session cookie. The exact HTTPS redirect URI must match the Pi Developer Portal registration.
- Never accept a client-supplied UID or username as proof of identity. The payment and agent APIs must derive the Pioneer UID from a verified server session.

The backend uses the official Pi Platform API v2 for Testnet payment verification:
- Retrieve the payment record before approval/completion. The SDK's `onIncompletePaymentFound` callback runs before `Pi.authenticate()` resolves, so the client must queue the callback DTO and block new payments. Once authentication resolves, it sends the verified Pioneer Bearer token with the payment ID. The backend verifies the token through `/v2/me`, retrieves the app-scoped payment with the Server API Key, and requires `payment.user_uid` to match the authenticated Pioneer before recovery.
- Check the server-known plan amount, payment owner UID, and plan metadata.
- Approve only a matching payment.
- Complete with the transaction ID supplied by the Pi SDK.
- Read the payment back and require both `transaction_verified` and `developer_completed` before reporting settlement.

**Important:** a private Testnet payment-intent ledger and service-role-only RPCs are now deployed in the isolated Foresight Supabase project. This persists idempotent intent state and verifies the Pi transaction read-back, but it does not yet implement product entitlements, prepaid-credit balances, refunds, or merchant settlement. A verified settlement is not the same as granting a prepaid credit or premium entitlement. Do not sell or advertise redeemable credits until those workflows are implemented and tested.

Testnet payment approval/completion fail closed unless `PI_NETWORK=Pi Testnet`, matching server/browser Sandbox settings, the direct-Testnet guard when Sandbox is false, `PI_API_KEY`, a valid server-only `SUPABASE_SERVICE_ROLE_KEY`, the isolated Foresight Supabase URL, `PI_PAYMENTS_ENABLED=true`, and `PI_PAYMENT_INTENT_LEDGER_READY=true` are all configured in Preview. The Preview release flags are prepared for Testnet, but `PI_API_KEY` is absent. The `SUPABASE_SERVICE_ROLE_KEY` variable is sensitive and cannot be evaluated from its masked environment-variable listing, but the live Preview readiness endpoints report the private ledger credential as configured. Pi payment and recovery remain unavailable until the Testnet `PI_API_KEY` is added directly in Vercel Preview and an end-to-end Sandbox flow passes. `PI_ENTITLEMENT_LEDGER_ENABLED` remains false: a verified test payment is recorded, but no prepaid balance or paid feature is granted. The Pi route is hard-locked to the registered Pi Testnet network and rejects Mainnet payments; SDK Sandbox is a separate development flag. A future Mainnet release requires a separately registered Mainnet Pi app, independent security review, completed entitlements/refunds, and the owner's explicit approval; it is not enabled by this route. The Pi Developer Portal locks an app to the network chosen at registration, so a Testnet app cannot be switched to Mainnet. Rewarded ads remain disabled until a trusted provider callback is integrated and verified server-side.


## 3. Pi Developer Portal: Testnet/Sandbox setup

1. Select the already registered **Pi Testnet app** in Pi Developer Portal. The selected network is immutable; Mainnet would require a separate app and is not enabled here.
2. Set the app's Development URL to the owner-approved HTTPS endpoint. Use the Portal-provided Sandbox URL only when testing Sandbox mode; do not mistake Sandbox mode for Mainnet/Testnet network selection.
3. Load `https://sdk.minepi.com/pi-sdk.js` and initialize SDK v2. For this direct Testnet deployment, set `PI_NETWORK=Pi Testnet`, `PI_SANDBOX_MODE=false`, `PI_DIRECT_TESTNET_ENABLED=true`, and `NEXT_PUBLIC_PI_SANDBOX_MODE=false`. The normal sign-in requests `username` only. The registered app network is controlled by the Developer Portal.
4. Keep the Testnet Server API Key as a sensitive, server-only `PI_API_KEY` in Vercel Preview only when payment Platform API operations are needed. Never prefix it with `NEXT_PUBLIC_` or paste it into chat/source control.
5. Keep Preview SSO enabled. Pi Browser cannot use a protected Preview as a public app URL unless the owner explicitly configures an approved public test endpoint. Do not disable SSO as a shortcut.
6. Test username authentication and session persistence first. Keep `PI_PAYMENTS_ENABLED=false`, `PI_PAYMENT_INTENT_LEDGER_READY=false`, `PI_ENTITLEMENT_LEDGER_ENABLED=false`, and `PI_MAINNET_PAYMENTS_APPROVED=false` until a separately approved Test-Pi payment test is ready.

## 4. Current capability status

| Capability | Status |
| --- | --- |
| Public Arabic/RTL application | Available |
| Global sensing | Partial coverage: USGS + NASA EONET polling |
| Gemini analysis | Requires `GEMINI_API_KEY` |
| Pi identity | Requires Pi Browser SDK session and server verification |
| Pi payment approval/completion | Disabled by default; requires `PI_API_KEY`, a durable ledger, and explicit release flags |
| Private Testnet payment-intent persistence | Implemented in Supabase; server credentials and Pi key still required for live flow |
| Durable prepaid/premium entitlements | Not implemented; requires separate credit/entitlement and refund workflows |
| x402 paid execution | Disabled; no trusted facilitator/settlement integration |
| Rewarded-ad grants | Disabled; no verified provider callback |
| Cloud-agent execution | Disabled pending telemetry validation, calibrated scoring, and independent settlement verification |

## 5. Smoke checks

After deployment:
- `GET /` should return HTTP 200 and render Arabic RTL.
- `GET /api/health` should return HTTP 200 and accurately report configuration state.
- `GET /api/global-sense` should return source-attributed signals or an empty partial-coverage result when upstream sources are unavailable.
- `GET /api/pi/verify` should report the registered network, server/browser Sandbox mode consistency, direct-Testnet guard, readiness gates, and server-key configuration without exposing secrets.
- `GET /api/x402/mcp` should expose discovery only; paid execution remains disabled.

## 6. Security and release gates

- Keep Preview protected; only Production is public.
- Keep API keys server-side.
- Do not accept client-supplied prices or identity claims.
- Do not grant entitlements from a browser callback alone.
- Do not describe symbolic correlations as factual evidence or calibrated threat scores.
- Keep cloud-agent execution, paid x402 execution, and rewarded-ad grants disabled until their respective evidence and security gates are met.
- Run build, typecheck, unit tests, and a security review before enabling any paid feature.
