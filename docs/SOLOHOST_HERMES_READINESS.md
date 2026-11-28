# SoloHost + Hermes Integration Readiness

Status: **documentation and architecture plan only**. This document does not enable cloud execution, publish a container image, configure a SoloHost app, or authorize payments.

## Current verified boundary

- `app/api/cloud-agent/run/route.ts` intentionally returns HTTP 503 `not_ready` for every request.
- The current Cloud Agents view is preview-only. A UI selection is not an executed run.
- Pi payment approval/completion, entitlement delivery, x402 settlement, automated execution, and Mainnet remain gated.
- The public `pi-node/solohost` repository is readable but is not owned by this project. Its v0 package contract requires a public, pullable, version-tagged image and two validated files: `docker-compose.yml` and `config_options.yml`.
- Hermes' SoloHost example is a multi-container agent + Web UI package. It is a reference package, not evidence that Foresight Paths has a compatible image or that its agent can safely execute tasks.

## Live Preview audit — 2026-11-28

Checked the Preview deployment for branch `feat/docker-deployment-readiness` (commit `21f9bd8364a66fbb41109dcf68125447d6473764`). This is a point-in-time diagnostic, not a release approval.

- `/api/health`: HTTP 200, reports `operational_with_restricted_features`. It reports the Supabase server credential as a publishable key, the private ledger as not configured, and payment/entitlement/cloud-agent gates as disabled.
- `/api/news`: HTTP 200 but returned zero articles and `SUPABASE_SERVER_KEY_MISCONFIGURED`; persistence was skipped. The endpoint's HTTP success must not be interpreted as successful news ingestion.
- `/api/pi/verify`: HTTP 200, reports Pi Testnet and direct Testnet mode, but payment execution and entitlement delivery remain disabled pending private ledger credentials and explicit release gates.
- Vercel Preview environment metadata for that branch contains a public Supabase URL and publishable key, but no server-only `SUPABASE_SERVICE_ROLE_KEY`. Do not put the service-role secret into a public variable, browser bundle, repository, or this document.
- This audit did not perform Pi authentication, payment, signing, A2U, x402 settlement, or Mainnet operations.

**Required operator action:** configure a valid server-only Supabase service credential through the approved secret manager, then re-run the health/news checks. Until then, persistent ingestion and payment-ledger checks cannot pass. Keep payment flags disabled; do not use a successful health response as proof of ledger readiness.

## Target architecture

1. **Foresight Paths web app** remains the user-facing research interface and source-attributed read-only data surface.
2. **Hermes runtime** is an optional, separately isolated operator-managed assistant. It must not receive payment credentials, wallet signing material, or unrestricted app/database credentials.
3. **SoloHost package** is an install wrapper around a published immutable image. It must not build from source at install time and must not expose a public network port.
4. **Cloud-agent API** remains fail-closed until an authenticated, bounded, audited execution service is implemented and independently tested.
5. **Pi payment flow** is a separate concern. A SoloHost install, Hermes session, model response, or local run must never imply a payment, settlement, subscription, or entitlement.

## SoloHost package prerequisites

Do not publish a package until every prerequisite below is met:

- [ ] A public, versioned, immutable container image exists for the intended target (Foresight Paths web app or Hermes, explicitly identified).
- [ ] Image architecture, entrypoint, listening port, required environment variables, persistent state, and health behavior are confirmed by running that exact image.
- [ ] A non-root runtime and minimal container permissions are verified.
- [ ] Compose uses `image:` (not `build:`), exactly one `pi.ui.primary: "true"` UI service, and one loopback-bound UI port in `127.0.0.1:HOST:CONTAINER` form.
- [ ] No privileged mode, host networking, host bind mounts, host devices, Docker socket, or unnecessary capabilities are present.
- [ ] Stateful app data uses named volumes only where persistence is required; configuration secrets are not stored in image layers or committed files.
- [ ] Every Compose interpolation is declared in the install form and maps to an environment variable the image actually reads.
- [ ] Every password/API-key field uses `preserve_if_blank: true`; secrets are not printed in logs or diagnostics.
- [ ] The package passes SoloHost's authoritative validator and the install checklist against the exact image.
- [ ] A clean install, restart, update, uninstall, and reinstall are exercised on a disposable test host.

### Install-form secret policy

The installer may collect only credentials needed by the selected, documented capability. Use password fields and preserve blank values on re-save. Keep server-only credentials out of browser-prefixed variables and out of the UI. Never collect a Pi wallet secret, signing key, or Mainnet credential. If a feature is unavailable, omit its field rather than showing a dead control.

## Hermes operating modes

Treat Hermes as an independent tool runtime with explicit operator control:

- **Local model (preferred for private/offline experimentation):** requires Docker Model Runner enabled on the host and adequate local resources. It is not guaranteed to work on every Pi Desktop device.
- **Cloud model:** requires the operator's provider key and sends prompts to that provider. Show the provider and privacy boundary before enabling it.
- **Custom endpoint:** allow only an operator-supplied, documented OpenAI-compatible endpoint. Do not silently forward data to an unknown endpoint.

For all modes, start with read-only research and manual approval. Do not mount Foresight Paths service-role keys, Pi API keys, payment ledgers, or browser session tokens into Hermes. Do not let a model select or execute shell commands, network scans, wallet actions, payment operations, or contract calls.

## Safe feature scope for the first integration

Allowed after implementation and tests:

- Source-attributed summarization of explicitly selected, non-sensitive research records.
- User-triggered analysis with bounded input size, request timeout, output size, and per-user rate limits.
- A dry-run plan preview that lists proposed steps without executing them.
- Operator-visible run status, timestamps, model/provider, source references, cancellation state, and sanitized error category.
- Manual export of a report with evidence labels and limitations.

Not allowed in the first release:

- Scheduled or unattended agent loops.
- Arbitrary tool execution, shell access, asset scanning, exploit actions, external account changes, or autonomous remediation.
- Agent-triggered payments, A2U, wallet signing, x402 settlement, entitlement grants, or Mainnet operations.
- Treating Gemini/Hermes output, symbolic correlation, or a generated digest as verified evidence or a transaction receipt.

## Required API contract before enabling cloud runs

Implement a server-side run service with:

- Authenticated Pioneer identity verified server-side; never trust a client-supplied UID or username.
- A strict request schema and allowlist of agent modes, source IDs, and read-only capabilities.
- Per-user concurrency, cooldown, daily quotas, and maximum runtime/output limits.
- A durable run record with an idempotency key, state machine, timestamps, source IDs, model/provider metadata, and sanitized failure code.
- Cancellation that marks the run cancelled and prevents any later side effect.
- Server-side source validation and provenance preservation; missing or stale sources must produce an explicit partial/unavailable result.
- No secrets in prompts, model context, logs, exported artifacts, or client responses.
- Fail-closed behavior on auth, database, model-provider, timeout, or policy failure.

The current `POST /api/cloud-agent/run` 503 response must remain until these controls exist and tests prove them. Do not simply remove the 503 or wire the UI to a model API.

## Test and release gates

### Package and container
- SoloHost validator passes for both package files.
- Compose config validation passes; image is pulled by digest/tag and starts as non-root.
- UI binds only to loopback and renders through Pi Desktop.
- Secret values are absent from generated config, logs, image layers, and browser bundles.
- Restart/reinstall persistence and clean uninstall are verified.

### Application and agent
- Exact-head lint, unit tests, TypeScript, production build, and container checks pass.
- Tests cover invalid auth, unauthorized mode, oversized input/output, provider timeout, stale source, duplicate idempotency key, quota exhaustion, cancellation race, and sanitized errors.
- Read-only scope is enforced server-side; the model cannot call tools not explicitly allowlisted.
- No run is reported as successful until its durable record is finalized; no client-side hash is presented as proof of execution or settlement.
- Pi Browser identity is tested on Testnet. Payment tests remain separate and require explicit user approval before any Test-Pi transaction.

### Release
- Require exact-head CI and matching Preview checks; old deployments are not evidence.
- Keep SSO enabled. Do not exceed hosting quotas.
- Do not merge or deploy automatically.
- Keep payment, entitlement, x402, signing, A2U, and Mainnet flags disabled.

## Next concrete inputs

The package cannot be completed honestly until the project owner supplies or confirms:

1. Which public versioned image is intended for SoloHost (Foresight Paths app, Hermes runtime, or separate packages).
2. The actual image port, entrypoint, and supported environment-variable contract, verified against that image.
3. Whether Hermes is intended to run locally through Docker Model Runner or use an operator-configured cloud provider.
4. The operator's intended persistence needs and allowed read-only data sources.

Do not substitute guessed image names, placeholder ports, or unverified environment variables for these inputs.
