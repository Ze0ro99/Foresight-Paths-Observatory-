import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentRunSummary } from "../supabase/functions/agent-workbench/workbench.mjs";

const observedAt = "2026-11-25T14:30:00.000Z";

test("empty cyber feed is unavailable and never claims an all-clear", () => {
  const result = buildAgentRunSummary("cyber-threat-watch", {
    sources: [{ source_key: "gdelt-doc", enabled: true, display_name: "GDELT", source_type: "news" }],
    news: [],
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "unavailable");
  assert.match(result.summary, /not clear or safe/i);
  assert.equal(result.riskScore, null);
  assert.equal(result.externalActionsExecuted, 0);
  assert.equal(result.transactionsSubmitted, 0);
});

test("hazard findings keep source URLs and are explicitly partial", () => {
  const result = buildAgentRunSummary("global-disaster-watch", {
    sources: [{ source_key: "usgs-earthquakes", enabled: true, display_name: "USGS", source_type: "hazard", last_success_at: observedAt }],
    hazards: [{
      title: "Test earthquake",
      hazard_type: "earthquake",
      location_label: "Test location",
      severity_label: "M4.5",
      source_url: "https://earthquake.usgs.gov/example",
      occurred_at: observedAt,
    }],
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "partial");
  assert.equal(result.coverage.recordsReviewed, 1);
  assert.equal(result.findings[0].sourceUrl, "https://earthquake.usgs.gov/example");
  assert.equal(result.riskScore, null);
});

test("market agent does not fabricate prices or forecasts when connectors are missing", () => {
  const result = buildAgentRunSummary("market-risk-monitor", {
    sources: [],
    news: [],
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "unavailable");
  assert.equal(result.forecast, null);
  assert.equal(result.riskScore, null);
  assert.match(result.summary, /No price, return forecast/i);
});

test("Pi Testnet observer reports only read-only telemetry when present", () => {
  const result = buildAgentRunSummary("pi-testnet-observer", {
    sources: [{ source_key: "pi-testnet-horizon", enabled: true, display_name: "Pi Testnet Horizon", source_type: "blockchain" }],
    piTelemetry: { status: "connected", sequence: "12345", baseFeeStroops: "100", closedAt: observedAt },
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "ok");
  assert.equal(result.executionMode, "simulation");
  assert.equal(result.transactionsSubmitted, 0);
  assert.equal(result.findings[0].title, "Latest Pi Testnet ledger");
});

test("space/anomaly reports are not promoted into extraordinary claims", () => {
  const result = buildAgentRunSummary("space-anomaly-observer", {
    sources: [],
    news: [{
      title: "Unusual lights reported",
      category: "science",
      canonical_url: "https://example.org/report",
      source_domain: "example.org",
      evidence_class: "unverified",
    }],
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "partial");
  assert.match(result.summary, /unverified/i);
  assert.equal(result.findings[0].evidenceClass, "unverified");
});

test("untrusted URLs are omitted instead of rendered as links", () => {
  const result = buildAgentRunSummary("news-source-verifier", {
    sources: [],
    news: [{
      title: "Suspicious report",
      category: "cyber",
      canonical_url: "javascript:alert(1)",
      source_domain: "example.org",
    }],
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "partial");
  assert.equal(result.findings[0].sourceUrl, null);
  assert.equal(result.externalActionsExecuted, 0);
});


test("cyber agent includes source-attributed CISA KEV records without claiming user assets are affected", () => {
  const result = buildAgentRunSummary("cyber-threat-watch", {
    sources: [
      { source_key: "gdelt-doc", enabled: true, display_name: "GDELT", source_type: "news", last_success_at: observedAt },
      { source_key: "cisa-kev", enabled: true, display_name: "CISA Known Exploited Vulnerabilities", source_type: "research", last_success_at: observedAt },
    ],
    news: [],
    cisaKev: {
      status: "ok",
      vulnerabilities: [{
        cve_id: "CVE-2026-103406",
        vendor_project: "Hewlett Packard Enterprise (HPE)",
        product: "Juniper Session Smart Conductor and Session Smart Router",
        vulnerability_name: "OS Command Injection Vulnerability",
        date_added: "2026-11-25",
        short_description: "An OS command injection vulnerability.",
        required_action: "Apply mitigations in accordance with vendor instructions.",
        due_date: "2026-11-28",
        known_ransomware_campaign_use: "Unknown",
        cwes: ["CWE-78"],
        source_url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        observed_at: observedAt,
      }],
    },
  }, { observedAt, locale: "en" });

  assert.equal(result.status, "partial");
  assert.equal(result.coverage.recordsReviewed, 1);
  assert.ok(result.coverage.sources.some((source) => source.key === "cisa-kev"));
  assert.match(result.findings[0].title, /CVE-2026-103406/);
  assert.match(result.findings[0].detail, /Due 2026-11-28/);
  assert.equal(result.findings[0].evidenceClass, "cisa_kev_known_exploited");
  assert.equal(result.findings[0].sourceUrl, "https://www.cisa.gov/known-exploited-vulnerabilities-catalog");
  assert.ok(result.limits.some((item) => /does not prove your assets are affected/i.test(item)));
  assert.equal(result.externalActionsExecuted, 0);
  assert.equal(result.transactionsSubmitted, 0);
  assert.equal(result.entitlementsGranted, 0);
});

