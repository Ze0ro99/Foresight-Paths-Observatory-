# Production setup and release checklist

The public deployment can serve the read-only map without credentials. Optional integrations remain unavailable until their credentials and supporting infrastructure are configured.

## 1. Vercel environment variables

Add the following under **Project → Settings → Environment Variables**, for Preview and Production as appropriate:

| Variable | Required for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini event analysis | Server-only secret. Never expose it in the browser bundle. |
| `GEMINI_MODEL` | Gemini model selection | Defaults to `gemini-3.8-flash`; may be overridden with a model available to the configured Google AI Studio API key. |
| `PI_API_KEY` | Pi server-side identity/payment operations | Testnet app key for Preview; server-only secret. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public read-only Foresight data | Must point to `foresight-paths-dev`, not the PiRC project. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public read-only Foresight data | Publishable key; RLS limits public access to SELECT. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side private RPCs and ingestion | Server-only Supabase elevated key. Accepts a modern `sb_secret_...` key or legacy JWT `service_role` key; never use a `NEXT_PUBLIC_` prefix. Modern secret keys are sent in `apikey` only; legacy JWT keys also use Bearer authorization. |
| `PI_NETWORK` | Pi server environment | Must be exactly `Pi Testnet` for this gateway. Mainnet is rejected. |
| `PI_SANDBOX_MODE` | Pi server environment | `true` by default; `false` only for explicitly enabled direct Testnet mode. |
| `PI_DIRECT_TESTNET_ENABLED` | Direct Testnet SDK mode | Must be `true` when `PI_SANDBOX_MODE=false`; does not change the app's registered network. |
| `NEXT_PUBLIC_PI_SANDBOX_MODE` | Pi browser SDK environment | Must match `PI_SANDBOX_MODE`; client-side setting only. |
| `PI_APP_SESSION_SECRET` | Encrypted Pi App Studio sessions | Server-only secret, at least 32 characters. |
| `NEXT_PUBLIC_PI_OAUTH_CLIENT_ID` / `NEXT_PUBLIC_PI_OAUTH_REDIRECT_URI` | Optional Pi Sign-In OAuth | Public client configuration; redirect URI must exactly match Pi Developer Portal. |
| `NEXT_PUBLIC_PI_PAYMENTS_ENABLED` | Pi browser permission scope | `false` for identity-only mode; set `true` only alongside the separately approved server payment gates. |
| `PI_PAYMENTS_ENABLED` | Pi Testnet approval/completion | `false` by default; Preview-only demo release gate. |
| `PI_PAYMENT_INTENT_LEDGER_READY` | Private payment-intent persistence | `false` by default; set only when the isolated Supabase private RPCs are configured. The server adapter sends modern `sb_secret_...` keys through the `apikey` header only, and sends the legacy JWT in both `apikey` and `Authorization: Bearer` for backward compatibility. |
| `PI_ENTITLEMENT_LEDGER_ENABLED` | Paid credit/entitlement delivery | Must remain `false` until balances, refunds, and entitlement delivery are separately implemented and tested. |
| `PI_MAINNET_PAYMENTS_APPROVED` | Mainnet payment release | `false` by default; requires the owner’s explicit approval after Testnet end-to-end validation. |

After changing variables, redeploy the relevant environment. Never commit real credentials.

### Supabase private-key troubleshooting

The server-side value in `SUPABASE_SERVICE_ROLE_KEY` must be an elevated key from the **same** `foresight-paths-dev` project:

- Preferred: a modern `sb_secret_...` key from **Supabase → Project Settings → API Keys → Secret keys**.
- Compatibility only: the legacy `service_role` JWT from the legacy API keys section.
- Do not use `sb_publishable_...`, the legacy `anon` key, a database password, or a key from the PiRC Supabase project.

The server sends modern secret keys in the `apikey` header only. It sends legacy JWT keys in both `apikey` and `Authorization: Bearer`. The application rejects public or unrecognized key formats before calling private RPCs, and `/api/health` reports the detected key format without returning the key value.

If `/api/news` reports `SUPABASE_SERVER_KEY_MISCONFIGURED`, or Vercel logs show `42501: permission denied for function claim_source_refresh`, replace the Preview value in **Vercel → Project → Settings → Environment Variables** with the correct elevated key for `foresight-paths-dev`, then redeploy the current branch. Never paste the key into chat, logs, source control, Docker build arguments, or any `NEXT_PUBLIC_*` variable.

Do **not** grant the `anon` or `authenticated` roles execute access to private ingestion/payment RPCs to work around a bad key. The RPCs must remain restricted to the server-side elevated role.

## 2. Pi integration boundary

The app includes a username-only Pi App Studio sign-in route that validates the server exchange and issues an encrypted HttpOnly session. A separate optional Pi OAuth route validates OAuth `state` and verifies the access token against Pi `/v2/me`. Never trust client-supplied UID/username fields; test both paths in Pi Browser before release.


The backend uses the official Pi Platform API v2:
- Verify the user access token with `GET /me`.
- Retrieve the payment record before approval/completion. The SDK's `onIncompletePaymentFound` callback runs before `Pi.authenticate()` resolves, so the client must queue the callback DTO and block new payments. Once authentication resolves, it sends the verified Pioneer Bearer token with the payment ID. The backend verifies the token through `/v2/me`, retrieves the app-scoped payment with the Server API Key, and requires `payment.user_uid` to match the authenticated Pioneer before recovery.
- Check the server-known plan amount, payment owner UID, and plan metadata.
- Approve only a matching payment.
- Complete with the transaction ID supplied by the Pi SDK.
- Read the payment back and require both `transaction_verified` and `developer_completed` before reporting settlement.

**Important:** a private Testnet payment-intent ledger and service-role-only RPCs are now deployed in the isolated Foresight Supabase project. This persists idempotent intent state and verifies the Pi transaction read-back, but it does not yet implement product entitlements, prepaid-credit balances, refunds, or merchant settlement. A verified settlement is not the same as granting a prepaid credit or premium entitlement. Do not sell or advertise redeemable credits until those workflows are implemented and tested.

Testnet payment approval/completion fail closed unless `PI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (modern `sb_secret_...` or legacy service-role JWT), the isolated Foresight Supabase URL, `PI_PAYMENTS_ENABLED=true`, and `PI_PAYMENT_INTENT_LEDGER_READY=true` are all configured in Preview. The registered app is Testnet-only. Direct SDK mode is separately opt-in through `PI_SANDBOX_MODE=false` plus `PI_DIRECT_TESTNET_ENABLED=true` and requires `PI_NETWORK=Pi Testnet`; the app network remains fixed at registration. The Vercel environment inventory is branch-scoped. The rebased branch and Docker PR branch must each have the public Supabase values and explicit Pi network flags assigned to their own Preview scope. Existing branchless Preview secrets may be inherited, but their values cannot be verified from variable-name inventory alone; test each server integration at the exact deployed commit without copying secret values into source control or chat. The Vercel Preview configuration keeps `PI_PAYMENTS_ENABLED=false`, so payment approval and recovery remain disabled until a current-head deployment, runtime credential checks, and an end-to-end Pi Browser Testnet flow (Sandbox or direct SDK mode) pass. Do not add these variables again unless the branch-scoped inventory or runtime checks show a genuine gap. `PI_ENTITLEMENT_LEDGER_ENABLED` remains false: a verified test payment is recorded, but no prepaid balance or paid feature is granted. The Pi route is hard-locked to Sandbox/Testnet and rejects Mainnet payments. A future Mainnet release requires a separately registered Mainnet Pi app, independent security review, completed entitlements/refunds, and the owner's explicit approval; it is not enabled by this route. The Pi Developer Portal locks an app to the network chosen at registration, so a Testnet app cannot be switched to Mainnet. Rewarded ads remain disabled until a trusted provider callback is integrated and verified server-side.


## 3. Pi Developer Portal: Testnet/Sandbox setup

1. Register or select a **Testnet app** in the Pi Developer Portal from Pi Browser. Pi locks an app to its registered network; Mainnet requires a separate app and is not enabled here.
2. Configure the Testnet app's Development URL and use the Sandbox URL provided by the Portal. Authorize the Sandbox app from Pi Utilities in the Pi app when prompted.
3. The site loads `https://sdk.minepi.com/pi-sdk.js` and initializes SDK v2. Current direct Testnet mode uses `PI_SANDBOX_MODE=false`, `PI_DIRECT_TESTNET_ENABLED=true`, and `NEXT_PUBLIC_PI_SANDBOX_MODE=false`, with `PI_NETWORK=Pi Testnet`. The UI requests only `username` while `NEXT_PUBLIC_PI_PAYMENTS_ENABLED=false`; it asks for `payments` only after that client flag and the separate server payment gates are deliberately enabled.
4. Copy the Server API Key for that **Testnet app** to Vercel Project → Settings → Environment Variables as a sensitive, server-only `PI_API_KEY` scoped to Preview and the active branch (`feat/v1-testnet-direct-mode-rebased` or `feat/docker-deployment-readiness`). Never set a `NEXT_PUBLIC_` prefix or put the key into chat/source control.
5. The current Vercel project protects Preview deployments with Vercel Authentication. Pi Browser access to the protected Preview is not verified; do not disable SSO to make the test pass. Use an explicitly approved public HTTPS Testnet URL for the Portal's Development URL before running Pi Browser end-to-end tests.
6. For the direct Testnet mode used by the current branch, set `PI_NETWORK=Pi Testnet`, `PI_SANDBOX_MODE=false`, `PI_DIRECT_TESTNET_ENABLED=true`, and `NEXT_PUBLIC_PI_SANDBOX_MODE=false`. Keep `PI_PAYMENTS_ENABLED=false` and `PI_PAYMENT_INTENT_LEDGER_READY=false`; this allows Pi SDK identity testing only. Do not open the payment route until public Pi Browser access and identity verification succeed, the private ledger is configured, and the owner explicitly approves a separate Testnet payment test. No paid credits or entitlements are delivered.

## 4. Current capability status

| Capability | Status |
| --- | --- |
| Public Arabic/RTL application | Available |
| Global sensing | Partial coverage: USGS + NASA EONET polling |
| Gemini analysis | Uses `GEMINI_MODEL` (default `gemini-3.8-flash`) and requires a valid `GEMINI_API_KEY`; health checks configuration only, not a live model request |
| Pi identity | Requires Pi Browser SDK session and server verification |
| Pi payment approval/completion | Disabled by default; requires `PI_API_KEY`, a durable ledger, and explicit release flags |
| Private Testnet payment-intent persistence | Implemented in Supabase; branch-scoped server credentials exist, but current-head runtime validation is pending |
| Durable prepaid/premium entitlements | Not implemented; requires separate credit/entitlement and refund workflows |
| x402 paid execution | Disabled; no trusted facilitator/settlement integration |
| Rewarded-ad grants | Disabled; no verified provider callback |
| Cloud-agent execution | Disabled pending telemetry validation, calibrated scoring, and independent settlement verification |

## 5. Smoke checks

After deployment:
- `GET /` should return HTTP 200 and render Arabic RTL.
- `GET /api/health` should return HTTP 200 and accurately report configuration state.
- `GET /api/global-sense` should return source-attributed signals or an empty partial-coverage result when upstream sources are unavailable.
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
