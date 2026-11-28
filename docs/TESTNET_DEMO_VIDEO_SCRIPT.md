# Foresight Paths — Pi Testnet Demo Video Script

Target length: 2 minutes 45 seconds  
Environment: Pi Browser with the app configured for Sandbox/Testnet  
Audience: Pi ecosystem reviewers, developers, and community users

## Before recording

- Open the current Vercel Preview in Pi Browser, not the production domain.
- Confirm the page shows the Preview build and that the Pi SDK is initialized with `sandbox: true` only if a Pi SDK flow is included.
- Confirm the global news feed loads and that source attribution and partial-coverage notes are visible.
- Confirm the Pi Testnet status card shows a live ledger sequence and a current base-fee reading. If Horizon is unavailable, show the unavailable state honestly; do not replace it with a fabricated value.
- Pi Sandbox authentication can be demonstrated after the SDK initializes. The payment buttons appear only after the Testnet server key and private Supabase key are configured; never fake the approval/completion state.
- Confirm the Supabase project indicator says `foresight-paths-dev` and that source/agent-template counts load.
- Keep wallet secrets, server keys, environment settings, and private database records off-screen.
- Do not attempt a payment during this recording unless the complete Pi Sandbox/Testnet payment flow has been configured and independently tested.

## Shot-by-shot narration

### 0:00–0:15 — Product introduction
**Screen:** Main Foresight Paths workspace and world map.

**Narration:**  
"Foresight Paths is a global intelligence and situational-awareness workspace. It brings together public news, hazard feeds, evidence-based analysis, and Pi Testnet network telemetry in one interface."

### 0:15–0:40 — Global news
**Screen:** Global news panel; move through the eight categories.

**Narration:**  
"The live news panel organizes indexed reports into disasters, conflict, politics, economy, health, cybersecurity, science, and energy. Each item links to its original publisher and shows its source domain and observation time. Coverage is partial, so the original report must always be checked."

### 0:40–1:00 — Hazard awareness
**Screen:** Map and USGS/NASA source-coverage indicator.

**Narration:**  
"The hazard layer combines public earthquake and Earth-observation event sources. The map is a situational-awareness aid, not an emergency-warning service. Source coverage and freshness are shown rather than assumed."

### 1:00–1:25 — Pi Testnet telemetry
**Screen:** Testnet readiness panel with ledger sequence and fee.

**Narration:**  
"The Pi Testnet observer reads the latest public Horizon ledger and displays its current base fee in stroops and Pi units. This is read-only telemetry: the application does not sign transactions, move funds, or initiate Mainnet operations."

### 1:25–1:50 — Isolated data layer
**Screen:** Supabase source registry and agent-template counts.

**Narration:**  
"The development data layer is a dedicated Foresight Paths Supabase project, separate from the PiRC project. Public intelligence records use read-only access controls. Payment intents and ledger records are isolated in a private database schema."

### 1:50–2:15 — Agent and analysis capabilities
**Screen:** Agent template cards, scenario analysis, evidence labels, and Q-Clock.

**Narration:**  
"The workspace includes reviewed agent templates for disaster monitoring, cyber threat awareness, news-source verification, and Pi Testnet observation. These are marked as prototypes or demos until their execution, safety, and evaluation tests pass. Analysis distinguishes documented evidence from plausible, disputed, speculative, and symbolic interpretations."

### 2:15–2:35 — Payment safety boundary
**Screen:** Readiness/status view; do not show secrets.

**Narration:**  
"Payment infrastructure is being prepared for Pi Sandbox/Testnet with idempotency and a private ledger design. Payments remain disabled until server credentials, user verification, approval, blockchain confirmation, completion, and reconciliation have all passed end-to-end tests."

### 2:35–2:45 — Closing
**Screen:** Return to world map and project name.

**Narration:**  
"Foresight Paths is being validated on Testnet first. Mainnet activation will only follow a separate release review and explicit approval."

## Recording acceptance checklist

- [ ] Preview build is READY and the exact commit is recorded.
- [ ] No Vercel SSO/login wall appears during the capture.
- [ ] News cards link to original publishers.
- [ ] Partial-coverage and timestamp caveats are legible.
- [ ] Hazard sources and counts are visible.
- [ ] Testnet fee is fetched live; no hard-coded demo fee is shown.
- [ ] Supabase panel identifies the Foresight project, not PiRC.
- [ ] Agent templates are visibly labeled demo/prototype.
- [ ] No secrets, private records, or real wallet passphrases appear.
- [ ] No Mainnet toggle or transaction is used.
- [ ] Final video is under three minutes and has readable captions.

## Current payment-demo limitation

The current build includes a private Testnet-only payment-intent and double-entry ledger schema, service-only idempotent RPCs, and backend Pi approve/complete/read-back code. The live handshake has not yet been validated because an authenticated Pi Browser Testnet session and the Testnet `PI_API_KEY` have not been tested. The shared Vercel Preview also has a publishable key incorrectly stored in `SUPABASE_SERVICE_ROLE_KEY`; Vercel-side private RPCs remain disabled until an elevated key is set. The Edge Functions use the Supabase-injected secret inside their own runtime. Until those checks pass, present payment handling as gated/in preparation, not as a completed live payment.
