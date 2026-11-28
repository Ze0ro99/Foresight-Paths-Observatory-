# Creator Marketplace, Agent/Contract Studio, and Global Impact Map

Status: product requirements and implementation contract. A requirement is not delivered until UI, API, persistence, authorization, tests, and current Preview demonstrate it.

## Product rule: feature access is independent from provider health

- Keep navigation and each feature entry point available when an unrelated provider is unavailable.
- Show each feature's own state: ready, partial, offline, sign-in required, or configuration required. Do not make the whole app or a gateway inaccessible because a background feed, AI provider, Horizon endpoint, or payment rail is down.
- Allow useful local work when possible: save a draft, inspect existing records, compose a proposal, prepare an analysis request, or view the last-known source-stamped result.
- Disable only the exact action that requires the unavailable dependency. Explain the missing dependency inline and offer retry/status details; do not route users through unrelated backend diagnostics.
- Never replace missing live data with fabricated events, prices, citations, or success states. Cached data must show its source timestamp and staleness.

## Core user journeys

### 1. Idea / URL → analysis → recommendations

- Accept either a user-entered idea or a URL. Treat both as untrusted input.
- URL inspection must be an isolated, read-only fetch service with HTTP(S)-only validation, DNS/IP and redirect revalidation, private/reserved address blocking, strict timeout/size/redirect limits, content-type allowlists, and no script execution. Keep the idea-only path available if URL inspection is offline.
- Return a plain-language report: what was observed, source links and timestamps, assumptions, uncertainties, real-world impacts by sector/region, alternative explanations, and follow-up questions.
- Recommend relevant agents, contract design templates, and subscription/service plans with reasons, fit limits, price/terms where verified, and provider attribution. Clearly distinguish a suggestion from an implemented or audited capability.
- User may save, revise, export, or discard the analysis without buying anything.

### 2. Agent Studio and creator listings

- Separate private draft, validated version, published listing, and retired listing states.
- The creator owns the source, configuration, description, and version history. A listing must declare author/organization, version, license, capabilities, data access, runtime limits, required permissions, pricing (if any), support policy, and known limitations.
- Buyers can inspect a capability manifest and a safe demo/simulation before subscribing. A creator cannot publish hidden capabilities or claim that a prototype is an autonomous production agent.
- No public clone/remix action. A user can fork only a template explicitly marked reusable under its license, with attribution and a new creator-owned identity. Private drafts and unpublished source/config are never exposed to other users.
- Enforce owner-scoped access in the database and API. Public listings expose only explicitly published fields. Do not rely on obscured UI controls for IP protection.
- Require explicit creator consent before publishing; support takedown, retirement, version pinning, and revocation. A subscriber's access is limited to the purchased version and declared rights.
- Similarity checks may flag likely duplicate listings for review; they are not proof of infringement and must not automatically reject legitimate common patterns. Never expose another creator's private source to perform a similarity check.
- No copying guarantees: explain that access controls, provenance, licenses, versioning, and review reduce misuse but cannot prevent a buyer from independently recreating visible behavior.

### 3. Smart-contract design studio

- Start with guided specification and reviewable source/artifact generation, not one-click deployment.
- Show chain/network, language, dependencies, roles, state, invariants, events, upgradeability, admin powers, trust assumptions, threat model, test coverage, and known limitations.
- Distinguish generated draft, locally validated artifact, reviewed artifact, Testnet deployment, and verified contract. Never label a draft as audited or deployed.
- Protect creator IP with private drafts, owner-scoped access, version history, explicit publication, license/attribution, and no cross-user source copying.
- Keep signing, deployment, token issuance, transfers, and other state-changing operations behind separate explicit approvals and verified Testnet controls. Mainnet remains out of scope for this delivery.

### 4. Subscription/service marketplace

- A listing may be a creator's agent, a monitoring plan, or a registered service. Show service identity, version, scope, included runs/limits, renewal/cancellation terms, support, and refund policy where applicable.
- A submitted app URL or idea is input to analysis; it is not automatically a subscription target or permission to fetch/execute it.
- Separate free preview, simulation, subscription intent, payment, entitlement, renewal, and cancellation states. No charge or entitlement before server-verified payment and durable ledger confirmation.
- Keep payment creation/processing disabled until the explicit release checklist passes. The marketplace and catalog must remain browsable when payment rails are disabled; offer save/share/waitlist or clearly marked simulation where implemented.
- Never promise automatic renewal unless a verified renewal worker, reconciliation, cancellation, and failure recovery exist.

## Originality, ownership, and non-duplication controls

- Every creator-owned artifact has an immutable owner ID, stable artifact ID, version ID, creation timestamp, and provenance record.
- Enforce uniqueness on the owner/artifact/version tuple and idempotency keys on publish operations. Prevent two listings from claiming the same creator-owned artifact/version.
- Keep private source/config and drafts inaccessible across users. Public marketplace data is a deliberate, separately stored publication snapshot.
- Reuse is permission-based: license, attribution, and explicit forkability are required. Similarity detection is a review signal, not a legal determination.
- Provide report/takedown and dispute workflows with audit trails. Do not claim these controls eliminate copying or guarantee legal ownership.

## Global event map and public-facing impact reports

- Build the map from source-attributed, timestamped events across supported domains. Every layer declares geographic coverage, update cadence, data gaps, and source licensing/terms.
- A map item opens a readable report: what happened, where/when, what is confirmed, what remains uncertain, likely real-world impacts by people/services/sectors, affected-area caveats, and practical context for non-specialists.
- Keep observation, official assessment, model inference, scenario, and speculation visually and semantically distinct. Forecasts require a disclosed method, calibrated evidence, uncertainty, and backtesting; otherwise show scenarios, not predictions.
- Impact statements must be proportional to the evidence and avoid implying an event affects a specific person, asset, or community without verified matching data.
- Support source links, publication/observation times, correction history, and stale/unavailable states. Do not infer that no event occurred from an empty or failed feed.
- Keep the map and cached reports usable when one feed fails; show source-specific degradation and retain last-known data with its timestamp.

## Delivery order and acceptance

1. Experience contract: keep feature entry points available; add per-feature status/degraded states and separate background health from navigation.
2. Creator identity and ownership: schema/RLS tests for owner-scoped drafts, versions, published snapshots, licenses, and audit events.
3. Idea/URL analysis: safe URL inspection service and idea-only fallback; source-attributed report schema and tests.
4. Agent and contract studios: versioned drafts, capability manifests, reviewable outputs, and no cross-user clone path.
5. Marketplace and subscriptions: published listings, safe demo, plan terms, entitlement/revocation model; keep billing off until payment gates pass.
6. Global impact reporting: source registry coverage metadata, accessible plain-language reports, uncertainty labels, correction/staleness behavior, and source failure tests.
7. Release evidence: exact-head lint, unit/integration tests, typecheck, build, migration/RLS review, matching Preview READY, route smoke checks, and owner review.

No step is complete merely because a roadmap or UI mock exists. Report implementation and validation separately.
