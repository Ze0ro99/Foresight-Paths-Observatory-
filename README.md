# Foresight Paths

Foresight Paths is a research workspace for source-attributed event mapping, competing-hypothesis analysis, and scenario exploration. It is designed to help users inspect signals and distinguish reported observations from analyst interpretations.

## Current application

- Arabic-first, right-to-left interface.
- Event and trajectory mapping with source-attributed inputs.
- Analysis and scenario tools for research workflows.
- Server-side Gemini analysis using a configurable model (`GEMINI_MODEL`, default `gemini-3.8-flash`) when a valid API key is configured.
- Pi SDK v2 direct Testnet identity path with server-side Pioneer token verification; identity-only mode requests `username` scope and keeps payments/entitlements disabled by release gates.

## Important limitations

This repository does not claim that the application is approved, certified, or listed by Pi Network or PiOS. Payment approval/completion, durable entitlements, rewarded-ad grants, paid x402 execution, and cloud-agent execution are disabled or not ready as documented in [Production Setup](docs/PRODUCTION_SETUP.md) and [Security and Evidence Gates](docs/SECURITY_AND_EVIDENCE_GATES.md).

The map and analysis are research aids, not verified threat intelligence, emergency alerts, or evidence of causation. Interpretations and symbolic associations must not be presented as observed facts.


## Live sources and Pi Testnet development slice

- Global news is currently indexed through GDELT DOC 2.0 across eight categories. The feed includes original-publisher links and explicitly reports partial coverage; it is not a complete or guaranteed real-time news wire.
- Hazard-source coverage is tracked separately for USGS and NASA EONET.
- `/api/pi/testnet-fee` reads the latest public Pi Testnet Horizon ledger and reports `base_fee_in_stroops`. It is read-only and does not sign or submit transactions.
- `/api/intelligence/overview` reads public, RLS-protected records from the isolated Supabase project `foresight-paths-dev`. This is not the PiRC Supabase project.
- Supabase migrations are versioned under `supabase/migrations/`. Public datasets are read-only to `anon` and `authenticated`; payment-intent and double-entry ledger tables are in a private schema restricted to server-side service access.
- The Testnet demo script and recording checklist are in [Testnet Demo Video Script](docs/TESTNET_DEMO_VIDEO_SCRIPT.md).

Payment approval/completion, prepaid credits, x402 settlement, automated agent execution, and Mainnet remain gated. Do not claim a live payment flow until the Pi Sandbox/Testnet server handshake and durable ledger have passed end-to-end tests.

## Development

Requirements: Node.js compatible with the installed Next.js version.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The built-in Node test runner covers Gemini model selection, GDELT response validation/fallback query shape, Pi Testnet readiness, payment recovery validation, and exact Pi stroop fee conversion. The repository does not yet commit an npm lockfile; CI and Docker currently resolve dependencies with npm install. Route-level end-to-end inference and Pi Browser flows still require credentialed runtime tests.

## Deployment

The production deployment is managed separately. See [Production Setup](docs/PRODUCTION_SETUP.md) for environment variables, safe defaults, smoke checks, and release gates. For local container deployment, follow [Docker Deployment](docs/DOCKER_DEPLOYMENT.md). Never commit API keys or other secrets.

## PiOS and Pi ecosystem documentation

See [PiOS Submission Readiness](docs/PIOS_SUBMISSION_READINESS.md) for the official PiOS app-list process, the proposed listing metadata, and remaining prerequisites. The PiOS license and listing are separate decisions; this repository does not include or claim acceptance of the PiOS license.

## Trademark

Pi, Pi Network and the Pi logo are trademarks of the Pi Community Company.
