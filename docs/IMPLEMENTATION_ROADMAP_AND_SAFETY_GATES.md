# Implementation Roadmap and Verified Delivery Matrix

Status: **living engineering record**. A checked item requires code, tests, and evidence on the current branch; a proposal or document alone is not implementation.

## Release principles

- Keep Mainnet payment, A2U payouts, paid-agent execution, x402 settlement, and production secrets disabled until explicitly approved by the owner and verified end-to-end.
- Treat browser input, scanned URLs, external API responses, agent output, and imported files as untrusted.
- Never expose API keys, service-role keys, wallet secrets, or signing material to the client or repository.
- Use small, reviewable changes on feature branches. Merge only after required CI and Preview checks pass.
- Label sourced facts, inference, estimates, and speculation separately. Never present model output as verified fact.

## Delivery matrix

| Workstream | Current evidence | Required before marking complete |
|---|---|---|
| Global news | GDELT DOC 2.0 route and eight-category panel exist on the review branch; shared refresh lease and API cache are five minutes; original publisher links and partial-coverage notice are displayed. | Add independent source adapters, provider health tests, category-level fixtures, deduplication tests, and monitored rate-limit/failure behavior. GDELT is not exhaustive or guaranteed instant. |
| Hazard signals | Existing USGS/NASA signal integration and source-count/coverage UI are present. | Verify each adapter, timestamp semantics, geo coordinates, stale-data handling, and attribution; do not claim all disasters are covered. |
| Evidence and Q-Clock | Existing narrative/time-map UI requires a source/evidence audit. | Separate symbolic projections from empirical analysis; publish reproducible formulas, test cases, confidence basis, alternative explanations, and uncertainty. |
| Pi authentication and payments | Pi SDK loading/initialization, server-side `/v2/me` verification, server-priced Testnet U2A retrieval/approval/completion/read-back, private payment-intent RPCs, and server-authoritative incomplete-payment recovery are implemented. Recovery is bound to the authenticated Pioneer UID: the callback DTO is queued until the SDK auth promise resolves, then the Bearer token is verified and matched against the payment owner before completion. Live end-to-end payment remains unverified because `PI_API_KEY` and an actual Pi Browser session have not been validated. A prior Vercel Preview detected its configured `SUPABASE_SERVICE_ROLE_KEY` as a public publishable key; Vercel-side private RPC writes therefore fail closed until an elevated key is set. The Supabase Edge Functions use platform-injected `SUPABASE_SECRET_KEYS` internally. | Run sandbox tests with the registered Testnet app, strengthen callback/retry/reconciliation and authorization tests, then separately implement and test entitlements/refunds before any paid-value delivery. |
| Pi Testnet fee telemetry | `/api/pi/testnet-fee` reads the latest Testnet Horizon ledger's `base_fee_in_stroops` and converts it to Pi using integer arithmetic. The latest Preview smoke test received HTTP 502 because Horizon was unreachable; live availability is not established. | Keep the endpoint read-only. If a separate Stellar SDK transaction builder is added, fetch the current ledger fee at transaction time, pass the exact stroop fee to `TransactionBuilder`, and fail safely on Horizon errors. |
| Micro-payments / x402 | Not implemented or validated by this PR. | Do not assume an on-chain minimum of 0.01 Pi or promise that Pi.createPayment supports a custom fee. Design any prepaid-credit or batched-settlement ledger as a separate custodial accounting feature with explicit user consent, durable double-entry records, refunds, reconciliation, and legal/security review. Do not represent internal credits as on-chain Pi. |
| URL inspection | Not evidenced as complete. | Enforce HTTP(S)-only URLs, reject credentials, block loopback/private/link-local/reserved IP ranges after DNS resolution, revalidate every redirect, cap redirects/body/time, defend against DNS rebinding, and never execute fetched content. Add SSRF regression tests. |
| File sharing and storage | Not evidenced as complete. | Verify current Pi SDK support before calling native sharing; otherwise use a clearly labeled browser download/share fallback. Add private storage, MIME/size limits, retention, deletion, and access controls. |
| Agent builder / marketplace | Not evidenced as a production-ready service. | Start with reviewed templates and declared capabilities. Require confirmation for consequential actions, isolate execution, apply quotas, log actions, and keep paid listings disabled until billing and revocation flows pass. |
| Simple / Pro modes | Existing UI needs feature-by-feature verification. | Test keyboard/accessibility, responsive layout, localization, and ensure developer diagnostics never expose secrets to ordinary users. |
| SoloHost / Pi Desktop | Not evidenced as packaged or certified. | Build reproducible Docker Compose/config bundles, document supported Pi Desktop versions, scan images/dependencies, and test install/upgrade/rollback on a clean host. |
| Governance / staking | Not evidenced as live or approved. | Use only documented and authorized APIs; distinguish proposal voting from binding protocol governance; prevent claims of voting weight unless the source and eligibility are verified. |

## Pi SDK and fee-policy guardrails

- The documented Pi payment flow is frontend `Pi.createPayment(paymentData, callbacks)`, followed by server-side approval and server-side completion through the Pi Platform API. Deliver an entitlement only after successful completion is confirmed by the backend.
- Pi SDK payment data includes amount, memo, and metadata. Do not invent or pass an undocumented custom network-fee parameter.
- Pi's current developer examples for Stellar token operations retrieve the latest ledger record and read `base_fee_in_stroops`, then pass that value as the `fee` option to `StellarSdk.TransactionBuilder`. This applies to transactions the application itself constructs with Stellar SDK; it is not a fee override for the Pi.createPayment wallet flow.
- Do not hard-code a universal `0.01 Pi` minimum or a priority multiplier without an authoritative, current Pi network source and a Testnet measurement. Network base fees are ledger/network data and must be handled in stroops with exact integer arithmetic.
- If an application offers prepaid service credits or internal micro-billing, show that they are internal account units, not blockchain transfers. Require an auditable ledger, balance reconciliation, explicit terms, refund handling, and security review before enabling.
- x402 is not a Pi SDK payment method. Any bridge between x402 and Pi must be specified and audited as a separate integration; never imply that batch settlement is automatically supported by Pi.

## Security and backend requirements

- Keep privileged operations server-side. Validate and normalize all inputs at the boundary.
- Store `GEMINI_API_KEY`, `PI_API_KEY`, Supabase service credentials, and signing material only in server-side environment scopes. Never ask users to paste secrets into chat or commit them.
- Pi authentication and payment authorization are separate. Verify the access token against the Pi Platform API; verify each payment belongs to this app and matches a server-side order before approval/completion.
- Make approve/complete callbacks idempotent because callbacks can be retried. Persist state transitions and perform read-back before delivering value.
- Use request IDs, structured errors, bounded timeouts, rate limits, safe retries, and provider circuit breakers.
- For URL scanning, resolve and validate every destination IP and redirect to prevent SSRF and DNS rebinding.
- For personal data, define opt-in, retention, export, deletion, and access-control behavior before collection.

## Data and Supabase

- Do not alter or migrate an existing Supabase production project as a shortcut.
- Use a separate development project only after the owner confirms the organization and region and approves any nonzero cost.
- Design schema and migrations from actual requirements; apply least privilege and row-level security.
- Keep service-role credentials server-only. Add migration tests, RLS tests, backups, and rollback procedures before production use.

## Testing and readiness gates

- [ ] Current branch lint passes.
- [ ] TypeScript check passes.
- [ ] Production build passes.
- [ ] Unit and integration tests cover news adapters, provider failures, timestamps, deduplication, and category mapping.
- [ ] URL/file inspection abuse cases and SSRF regression tests pass.
- [ ] Authentication and authorization boundaries reviewed.
- [ ] Privacy, retention, and RLS reviewed.
- [ ] Pi Testnet authentication/payment flow verified end-to-end, if payments are in scope.
- [ ] Fee calculation uses current Testnet ledger data and exact stroop arithmetic, if Stellar transactions are in scope.
- [ ] Preview deployment reaches READY and routes are smoke-tested.
- [ ] Owner reviews the final diff and explicitly approves merge/release.

## Current scope boundary

This document is a delivery and safety record, not evidence that every row is already implemented. In this change set, the GDELT/news and USGS/NASA source routes, Pi Sandbox identity and payment code path, private payment-intent persistence, incomplete-payment recovery, and read-only Testnet fee telemetry are implemented. CI and Preview builds can pass while Pi live credentials/Horizon remain unavailable. x402, internal credits/entitlements, marketplace billing, URL scanning, file sharing, agent execution, SoloHost packaging, governance, and Mainnet approval remain disabled or planned until their own code and test evidence exist. Mainnet activation requires a separate explicit instruction from the owner.


## Verified Testnet infrastructure added in the current development slice

The isolated Supabase project `foresight-paths-dev` (project ref `mlrbbnjoczpfmbgewgrm`) is separate from the PiRC Supabase project. It is on the organization's Free plan. The following schema is deployed there and versioned in `supabase/migrations/20261122195345_foresight_core_data_and_testnet_ledger.sql`, `20261122195413_secure_private_ledger_permissions_and_balance.sql`, `20261122195539_service_role_private_ledger_policies_and_indexes.sql`, `20261122195737_pi_testnet_payment_intent_rpcs.sql`, `20261122200225_source_refresh_and_batch_ingestion_rpcs.sql`, and `20261122200635_enforce_ledger_balance_after_entry_insert.sql`:

- Public, read-only datasets: `source_registry`, `news_items`, `hazard_events`, `risk_assessments`, `agent_templates`, and `scenario_snapshots`.
- Private schema: `payment_intents`, `ledger_accounts`, `ledger_transactions`, and immutable `ledger_entries`. Private schema access is revoked from `anon` and `authenticated`; only the server `service_role` is granted access.
- Public tables have RLS enabled and only SELECT policies for `anon` and `authenticated`. No client-side insert/update/delete policy exists.
- Testnet-only constraints are applied to payment intent and ledger network fields; Mainnet is rejected by the schema. Ledger entries are append-only; posting is blocked unless debit and credit totals are equal, and later inserts into an already-posted transaction are checked again for balance.
- Seeded source registry records identify GDELT, USGS, NASA EONET, and Pi Testnet Horizon. Agent cards are explicitly marked `demo` or `prototype`, not live automated agents.

The latest PR #15 feature branch is configured for Pi Testnet direct identity and identity-only SDK scopes; payment, ledger release, entitlements, and Mainnet flags are false. Vercel currently rate-limits new Preview builds for this branch. A previous Preview detected its `SUPABASE_SERVICE_ROLE_KEY` value as `publishable_key`, so Vercel-side private writes remain disabled until corrected. Edge Functions use the Supabase-injected secret in the Supabase runtime. The UI uses the public read-only endpoint `/api/intelligence/overview`; the Pi Testnet telemetry endpoint `/api/pi/testnet-fee` reads the latest Horizon ledger and reports the live `base_fee_in_stroops` value as a string and a Pi-denominated display value. It does not construct, sign, or submit transactions.

### Payment activation remains gated

The database structure, service-only idempotent payment RPCs, and backend approve/complete/read-back code are now present, but live payment processing remains fail-closed and has not been end-to-end verified. The application must not enable payment approval or deliver paid entitlements until all of the following are completed and verified:

1. Add the Testnet app's `PI_API_KEY` as a Preview-only sensitive environment secret through Vercel; never commit or paste it into source.
2. Replace the incorrectly configured Vercel `SUPABASE_SERVICE_ROLE_KEY` public key with an elevated `sb_secret_...` or legacy `service_role` JWT from the same isolated project before enabling Vercel-side private RPCs.
3. Provide an approved public HTTPS Testnet URL reachable from Pi Browser; keep current Preview SSO protection enabled.
3. Configure and verify the existing server-side Pi `/v2/me` verification, payment retrieval, exact order/amount/user/plan matching, idempotent approve/complete, private intent persistence, and reconciliation for incomplete payments.
4. Verify all flows using Pi Sandbox/Testnet and a real developer app configuration. Deliver no entitlement before successful server-side completion.
5. Add a Testnet fee quote path for any Stellar SDK-built transaction; use the current ledger base fee in stroops, integer arithmetic, and a safe failure mode. The fee endpoint in this slice is telemetry only, not a transaction builder.
6. Add refund, dispute, replay, callback retry, ledger balancing, and audit tests before enabling prepaid credits or x402 settlement.

The public news feed is fetched from GDELT and the hazard route reads USGS/NASA EONET. Both routes now have service-role-only batch-ingestion RPCs with a per-source refresh lease and upsert deduplication. Hazard persistence is currently confirmed by the latest available smoke test. GDELT news persistence is skipped when upstream returns HTML, errors, or no usable articles. The browser never receives the service-role key. The UI must not imply that empty persisted tables mean no real-world events.

### Video demonstration boundary

A Testnet walkthrough can currently demonstrate the global news feed, source attribution, partial coverage disclosures, hazard-source coverage, the isolated Supabase read-only data panel, and live Pi Testnet ledger/fee telemetry. Agent templates should be presented as prototypes. Do not demonstrate a payment as successful unless the full Pi Sandbox/Testnet approve → wallet transaction → complete flow has passed with the project's own credentials. Do not switch `Pi.init` to production or enable Mainnet.


## Pi Developer Portal compliance re-check — 2026-11-23

The official Pi Developer documentation was checked against the repository implementation:

| Official requirement | Repository implementation | Result |
|---|---|---|
| Load the official SDK script from `https://sdk.minepi.com/pi-sdk.js` | `app/layout.tsx` loads the SDK through Next.js `afterInteractive` | Implemented; runtime verification in Pi Browser remains required |
| Initialize Testnet with `Pi.init({ version: "2.0", sandbox: true })` before SDK methods | `components/PiSandboxPaymentPanel.tsx` initializes Sandbox before authentication/payment | Implemented; Mainnet mode is not enabled |
| Authenticate through the SDK and verify the access token server-side | `Pi.authenticate(['username','payments'], ...)`; backend validates with `GET /v2/me` using Bearer auth | Implemented; requires an actual Pi Browser session |
| Approve U2A payment server-side with the app Server API Key | Backend retrieves the payment with `Authorization: Key`, checks server-known plan, app metadata, Testnet network, direction, amount and user UID, then approves | Implemented; credential-dependent |
| Complete and read back payment state | Backend completes through Platform API, re-reads the PaymentDTO, and requires matching txid plus `transaction_verified`, `developer_completed`, and transaction verification before ledger completion | Implemented; credential-dependent |
| Handle the SDK's incomplete-payment callback | Recovery now begins inside `onIncompletePaymentFound` without waiting for `Pi.authenticate()` to resolve. The server fetches the PaymentDTO by payment ID using the app key, checks ownership/app/network/plan/amount/txid, approves if needed, completes, reads back, then persists completion | Implemented in code and unit-tested; real Sandbox interruption/recovery test pending |
| Keep server key private and don't trust browser payment metadata | Pi key remains server-side; recovery derives plan, UID, amount, network, and txid from the Pi Platform API response | Implemented |
| Keep Mainnet and paid entitlement release distinct | Sandbox is hard-coded for this UI; database constrains payments to Testnet; entitlement and Mainnet flags remain false | Kept disabled |

Official references:
- Getting Started: https://developers.minepi.com/docs/build-first-app/GettingStarted
- Authentication: https://developers.minepi.com/docs/authenticate-user/Authentication
- Payments: https://developers.minepi.com/docs/accept-payment/Payments
- SDK Reference: https://developers.minepi.com/docs/api-reference/SdkReference
- Platform API: https://developers.minepi.com/docs/api-reference/PlatformAPI

### Preview configuration at this audit

- `PI_API_KEY` is absent from Preview branch `fix/ci-clean-base`.
- `SUPABASE_SERVICE_ROLE_KEY` exists as a sensitive Preview variable. The metadata listing uses `decrypt=false`, so its blank `value` field is redaction, not proof of an empty secret. A previous READY Preview reported the key type as `publishable_key`; current Vercel-side readiness must remain fail-closed. The latest PR #15 branch currently has no exact-head READY Preview because of Vercel build-rate limiting.
- `NEXT_PUBLIC_SUPABASE_URL` and the publishable key are configured for the isolated `foresight-paths-dev` project.
- Testnet release flags are set for Preview; entitlement delivery and Mainnet approval remain false.
- Consequently, approval/completion/recovery are fail-closed. Both the live Testnet `PI_API_KEY`/Pi Browser session and a valid elevated Vercel Supabase key remain unverified for private Vercel-side writes. Preserve the existing Supabase service-role key, then run the authenticated Pi Sandbox payment and interrupted-payment recovery tests from a Pi Browser-accessible HTTPS Testnet URL before reporting the flow as live.
