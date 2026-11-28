import { createClient } from "npm:@supabase/supabase-js@2";
import { getSupabaseAdminCredential } from "../_shared/supabase-admin-key.mjs";
import { buildAgentRunSummary, normalizeCisaKevCatalog } from "./workbench.mjs";
import { MARKETPLACE_BILLING_PERIODS, MARKETPLACE_CATEGORIES, MARKETPLACE_LICENSES, normalizeMarketplaceCapabilityManifest, parseStroops } from "./marketplace.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
};
const MAX_BODY_BYTES = 16 * 1024;
const ALLOWED_PLANS = new Set(["continuous_watch", "incident_response", "daily_brief", "weekly_review"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}

function getServiceKey() {
  return getSupabaseAdminCredential(
    Deno.env.get("SUPABASE_SECRET_KEYS") ?? undefined,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined,
  )?.key ?? "";
}

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = getServiceKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "foresight-agent-workbench/1.0" } },
  });
}

async function verifyPiToken(token: string) {
  if (token.length < 20 || token.length > 4096) return null;
  try {
    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const value = await response.json().catch(() => null);
    if (!value || typeof value.uid !== "string" || value.uid.length < 3 || value.uid.length > 160) return null;
    return {
      uid: value.uid as string,
      username: typeof value.username === "string" ? cleanText(value.username, 80) : null,
    };
  } catch {
    return null;
  }
}

async function readPiTestnetTelemetry() {
  try {
    const response = await fetch("https://api.testnet.minepi.com/ledgers?order=desc&limit=1", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return { status: "unavailable" };
    const payload = await response.json();
    const ledger = payload?._embedded?.records?.[0];
    if (!ledger?.sequence || !ledger?.base_fee_in_stroops) return { status: "unavailable" };
    return {
      status: "connected",
      sequence: String(ledger.sequence),
      baseFeeStroops: String(ledger.base_fee_in_stroops),
      closedAt: typeof ledger.closed_at === "string" ? ledger.closed_at : null,
    };
  } catch {
    return { status: "unavailable" };
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getVotes(admin: any, proposalIds: string[], uid: string) {
  if (!proposalIds.length) return { counts: new Map(), myVotes: new Map() };
  const [allResult, mineResult] = await Promise.all([
    admin.from("agent_proposal_votes").select("proposal_id,vote").in("proposal_id", proposalIds),
    admin.from("agent_proposal_votes").select("proposal_id,vote").eq("owner_pi_uid", uid).in("proposal_id", proposalIds),
  ]);
  if (allResult.error || mineResult.error) throw new Error("proposal_votes_read_failed");
  const counts = new Map<string, { for: number; against: number }>();
  for (const vote of allResult.data || []) {
    const current = counts.get(vote.proposal_id) || { for: 0, against: 0 };
    if (vote.vote === "for") current.for += 1;
    if (vote.vote === "against") current.against += 1;
    counts.set(vote.proposal_id, current);
  }
  const myVotes = new Map<string, string>();
  for (const vote of mineResult.data || []) myVotes.set(vote.proposal_id, vote.vote);
  return { counts, myVotes };
}

async function bootstrap(admin: any, uid: string, username: string | null) {
  const [templatesResult, agentsResult, runsResult, proposalsResult, subscriptionsResult] = await Promise.all([
    admin.from("agent_templates")
      .select("template_key,name,description,category,capability_level,requires_external_credentials,safety_notes,testnet_enabled,mainnet_enabled")
      .order("category", { ascending: true }),
    admin.from("user_agents")
      .select("id,template_key,name,mission,status,created_at")
      .eq("owner_pi_uid", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("agent_runs")
      .select("id,agent_id,run_status,execution_mode,result,created_at")
      .eq("owner_pi_uid", uid)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("agent_proposals")
      .select("id,agent_id,kind,title,summary,risk_label,status,execution_state,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    admin.from("agent_subscription_previews")
      .select("id,plan_key,pi_service_id,periods,billing_mode,payment_started,entitlement_granted,created_at")
      .eq("owner_pi_uid", uid)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if ([templatesResult, agentsResult, runsResult, proposalsResult, subscriptionsResult].some((item) => item.error)) {
    throw new Error("workbench_bootstrap_read_failed");
  }

  const proposalRows = proposalsResult.data || [];
  const proposalIds = proposalRows.map((item: any) => item.id);
  const { counts, myVotes } = await getVotes(admin, proposalIds, uid);
  const proposals = proposalRows.map((item: any) => {
    const tally = counts.get(item.id) || { for: 0, against: 0 };
    return {
      ...item,
      votesFor: tally.for,
      votesAgainst: tally.against,
      myVote: myVotes.get(item.id) || null,
    };
  });

  return json({
    ok: true,
    user: { username },
    templates: templatesResult.data || [],
    agents: agentsResult.data || [],
    recentRuns: runsResult.data || [],
    proposals,
    subscriptionPreviews: subscriptionsResult.data || [],
    safety: {
      mode: "simulation",
      payments: "disabled",
      entitlements: "disabled",
      mainnet: "disabled",
      externalActions: "disabled",
    },
  });
}

async function createAgent(admin: any, uid: string, body: Record<string, unknown>) {
  const templateKey = cleanText(body.templateKey, 80);
  const name = cleanText(body.name, 80);
  const mission = cleanText(body.mission, 1200);
  if (!/^[a-z0-9-]{3,80}$/.test(templateKey) || name.length < 2 || mission.length < 5) {
    return json({ ok: false, error: "Enter a valid agent name, mission, and approved template." }, 400);
  }

  const [templateResult, countResult] = await Promise.all([
    admin.from("agent_templates").select("template_key").eq("template_key", templateKey).maybeSingle(),
    admin.from("user_agents").select("id", { count: "exact", head: true }).eq("owner_pi_uid", uid),
  ]);
  if (templateResult.error || countResult.error) return json({ ok: false, error: "Agent catalogue is temporarily unavailable." }, 503);
  if (!templateResult.data) return json({ ok: false, error: "This agent template is not available." }, 404);
  if ((countResult.count ?? 0) >= 20) return json({ ok: false, error: "The test workspace allows up to 20 saved agents per account." }, 429);

  const { data, error } = await admin.from("user_agents").insert({
    owner_pi_uid: uid,
    template_key: templateKey,
    name,
    mission,
    status: "active",
  }).select("id,template_key,name,mission,status,created_at").single();
  if (error || !data) return json({ ok: false, error: "The agent could not be saved." }, 503);
  return json({ ok: true, agent: data });
}

const CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const CISA_KEV_SOURCE_URL = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";

async function refreshCisaKev(admin: any) {
  const claim = await admin.rpc("claim_source_refresh", {
    p_source_key: "cisa-kev",
    p_min_interval_seconds: 900,
  });

  if (!claim.error && claim.data === true) {
    try {
      const response = await fetch(CISA_KEV_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("CISA_KEV_HTTP_" + response.status);
      const catalog = normalizeCisaKevCatalog(await response.json(), 100);
      if (!catalog) throw new Error("CISA_KEV_INVALID_CATALOG");

      const observedAt = new Date().toISOString();
      const rows = catalog.vulnerabilities.map((item: any) => ({
        cve_id: item.cveID,
        vendor_project: item.vendorProject,
        product: item.product,
        vulnerability_name: item.vulnerabilityName,
        date_added: item.dateAdded,
        short_description: item.shortDescription,
        required_action: item.requiredAction,
        due_date: item.dueDate,
        known_ransomware_campaign_use: item.knownRansomwareCampaignUse,
        forensic_triage: item.forensicTriage,
        cwes: item.cwes,
        catalog_version: catalog.catalogVersion,
        catalog_date_released: catalog.dateReleased,
        source_url: CISA_KEV_SOURCE_URL,
        observed_at: observedAt,
      }));

      const stored = await admin.from("cisa_kev_items").upsert(rows, { onConflict: "cve_id" });
      if (stored.error) throw new Error("CISA_KEV_UPSERT_FAILED");

      const sourceUpdate = await admin.from("source_registry").update({
        last_success_at: observedAt,
        last_error_at: null,
        last_error_code: null,
        metadata: {
          catalog_version: catalog.catalogVersion,
          catalog_date_released: catalog.dateReleased,
          catalog_count: catalog.count,
          validated_count: catalog.validatedCount,
          cached_records: rows.length,
        },
      }).eq("source_key", "cisa-kev");
      if (sourceUpdate.error) throw new Error("CISA_KEV_SOURCE_STATE_UPDATE_FAILED");
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 80) : "CISA_KEV_REFRESH_FAILED";
      console.warn("CISA KEV refresh failed", { code });
      await admin.from("source_registry").update({
        last_error_at: new Date().toISOString(),
        last_error_code: code,
      }).eq("source_key", "cisa-kev");
    }
  }

  const [itemsResult, sourceResult] = await Promise.all([
    admin.from("cisa_kev_items")
      .select("cve_id,vendor_project,product,vulnerability_name,date_added,short_description,required_action,due_date,known_ransomware_campaign_use,forensic_triage,cwes,catalog_version,catalog_date_released,source_url,observed_at")
      .order("date_added", { ascending: false })
      .limit(50),
    admin.from("source_registry")
      .select("source_key,display_name,source_type,enabled,last_success_at,coverage_note")
      .eq("source_key", "cisa-kev")
      .maybeSingle(),
  ]);

  return {
    status: itemsResult.error ? "unavailable" : (itemsResult.data?.length ? "ok" : "unavailable"),
    vulnerabilities: itemsResult.data || [],
    source: sourceResult.error ? null : sourceResult.data,
  };
}

async function runAgent(admin: any, uid: string, body: Record<string, unknown>) {
  const agentId = cleanText(body.agentId, 64);
  if (!isUuid(agentId)) return json({ ok: false, error: "Choose a valid saved agent." }, 400);

  const { data: agent, error: agentError } = await admin.from("user_agents")
    .select("id,template_key,name,mission,status")
    .eq("id", agentId)
    .eq("owner_pi_uid", uid)
    .maybeSingle();
  if (agentError) return json({ ok: false, error: "The selected agent could not be loaded." }, 503);
  if (!agent || agent.status !== "active") return json({ ok: false, error: "This agent is unavailable or paused." }, 404);

  const slot = await admin.rpc("claim_agent_run_slot", { p_owner_pi_uid: uid });
  if (slot.error) return json({ ok: false, error: "The run safety limiter is unavailable; no run was started." }, 503);
  if (slot.data !== true) return json({ ok: false, error: "Run limit reached. Please wait before starting another simulation." }, 429);

  const [sourcesResult, newsResult, hazardsResult, risksResult, scenariosResult] = await Promise.all([
    admin.from("source_registry").select("source_key,display_name,source_type,enabled,last_success_at,coverage_note").eq("enabled", true),
    admin.from("news_items").select("category,title,canonical_url,source_domain,evidence_class,observed_at,published_at").order("observed_at", { ascending: false }).limit(40),
    admin.from("hazard_events").select("hazard_type,title,severity_label,latitude,longitude,location_label,occurred_at,observed_at,source_url,status").eq("status", "active").order("occurred_at", { ascending: false }).limit(40),
    admin.from("risk_assessments").select("risk_score,confidence,evidence_class,generated_at").order("generated_at", { ascending: false }).limit(20),
    admin.from("scenario_snapshots").select("evidence_class,probability,impact_score,generated_at").order("generated_at", { ascending: false }).limit(20),
  ]);
  const queryResults = [sourcesResult, newsResult, hazardsResult, risksResult, scenariosResult];
  const queryUnavailable = queryResults.some((item) => item.error);
  const cisaKev = agent.template_key === "cyber-threat-watch" ? await refreshCisaKev(admin) : null;
  const sourceRows = (sourcesResult.data || []).filter((item: any) => item.source_key !== "cisa-kev");
  if (cisaKev?.source?.enabled === true) sourceRows.push(cisaKev.source);
  const telemetry = agent.template_key === "pi-testnet-observer" ? await readPiTestnetTelemetry() : null;
  const summary = buildAgentRunSummary(agent.template_key, {
    sources: sourceRows,
    news: newsResult.data || [],
    hazards: hazardsResult.data || [],
    risks: risksResult.data || [],
    scenarios: scenariosResult.data || [],
    cisaKev,
    piTelemetry: telemetry,
  }, {
    locale: body.locale === "ar" ? "ar" : "en",
    observedAt: new Date().toISOString(),
  });
  if (queryUnavailable) {
    summary.status = "unavailable";
    summary.summary = body.locale === "ar"
      ? "تعذر قراءة أحد مصادر البيانات؛ لم يتم استنتاج نتيجة من بيانات جزئية غير مكتملة."
      : "At least one data source could not be read; no conclusion was inferred from an incomplete dataset.";
    summary.findings = [];
    summary.riskScore = null;
    summary.forecast = null;
  }

  const { data: run, error: runError } = await admin.from("agent_runs").insert({
    owner_pi_uid: uid,
    agent_id: agent.id,
    run_status: summary.status,
    execution_mode: "simulation",
    result: summary,
  }).select("id,run_status,execution_mode,created_at").single();
  if (runError || !run) return json({ ok: false, error: "The analysis completed but could not be saved to the run history." }, 503);

  return json({ ok: true, agent: { id: agent.id, name: agent.name }, run, result: summary });
}

async function createProposal(admin: any, uid: string, body: Record<string, unknown>) {
  const title = cleanText(body.title, 120);
  const summary = cleanText(body.summary, 2000);
  const kind = cleanText(body.kind, 32);
  const riskLabel = cleanText(body.riskLabel, 24) || "unassessed";
  const agentId = cleanText(body.agentId, 64);
  if (title.length < 3 || summary.length < 10 || !["agent", "smart_contract", "subscription"].includes(kind)) {
    return json({ ok: false, error: "Enter a title, a meaningful summary, and a supported proposal type." }, 400);
  }
  if (!["low", "moderate", "high", "unassessed"].includes(riskLabel)) {
    return json({ ok: false, error: "Invalid risk label." }, 400);
  }
  let linkedAgentId: string | null = null;
  if (agentId) {
    if (!isUuid(agentId)) return json({ ok: false, error: "Invalid agent reference." }, 400);
    const owned = await admin.from("user_agents").select("id").eq("id", agentId).eq("owner_pi_uid", uid).maybeSingle();
    if (owned.error) return json({ ok: false, error: "The linked agent could not be checked." }, 503);
    if (!owned.data) return json({ ok: false, error: "The linked agent does not belong to this account." }, 403);
    linkedAgentId = agentId;
  }
  const { data, error } = await admin.from("agent_proposals").insert({
    proposer_pi_uid: uid,
    agent_id: linkedAgentId,
    kind,
    title,
    summary,
    risk_label: riskLabel,
    status: "open",
    execution_state: "not_executed",
  }).select("id,kind,title,summary,risk_label,status,execution_state,created_at").single();
  if (error || !data) return json({ ok: false, error: "The proposal could not be saved." }, 503);
  return json({ ok: true, proposal: { ...data, votesFor: 0, votesAgainst: 0, myVote: null } });
}

async function castVote(admin: any, uid: string, body: Record<string, unknown>) {
  const proposalId = cleanText(body.proposalId, 64);
  const vote = cleanText(body.vote, 12);
  if (!isUuid(proposalId) || !["for", "against"].includes(vote)) {
    return json({ ok: false, error: "Select a valid proposal and vote." }, 400);
  }
  const proposal = await admin.from("agent_proposals").select("id,status")
    .eq("id", proposalId).maybeSingle();
  if (proposal.error) return json({ ok: false, error: "The proposal could not be loaded." }, 503);
  if (!proposal.data || proposal.data.status !== "open") return json({ ok: false, error: "This proposal is not open for voting." }, 409);

  const inserted = await admin.from("agent_proposal_votes").insert({
    proposal_id: proposalId,
    owner_pi_uid: uid,
    vote,
  }).select("proposal_id,vote").single();
  if (inserted.error) {
    if (inserted.error.code === "23505") return json({ ok: false, error: "You have already voted on this proposal." }, 409);
    return json({ ok: false, error: "Your vote could not be saved." }, 503);
  }
  const { data: votes, error } = await admin.from("agent_proposal_votes").select("vote").eq("proposal_id", proposalId);
  if (error) return json({ ok: false, error: "The vote was saved, but the tally is temporarily unavailable." }, 503);
  const votesFor = (votes || []).filter((item: any) => item.vote === "for").length;
  const votesAgainst = (votes || []).filter((item: any) => item.vote === "against").length;
  return json({
    ok: true,
    proposalId,
    myVote: vote,
    votesFor,
    votesAgainst,
    status: "open",
    executionState: "not_executed",
  });
}

async function createSubscriptionPreview(admin: any, uid: string, body: Record<string, unknown>) {
  const planKey = cleanText(body.planKey, 40);
  const serviceId = cleanText(body.serviceId, 160) || null;
  const periods = Number(body.periods ?? 1);
  if (!ALLOWED_PLANS.has(planKey) || !Number.isInteger(periods) || periods < 1 || periods > 180) {
    return json({ ok: false, error: "Choose a supported monitoring plan and 1–180 preview periods." }, 400);
  }
  const { data, error } = await admin.from("agent_subscription_previews").insert({
    owner_pi_uid: uid,
    plan_key: planKey,
    pi_service_id: serviceId,
    periods,
    billing_mode: "preview",
    payment_started: false,
    entitlement_granted: false,
  }).select("id,plan_key,pi_service_id,periods,billing_mode,payment_started,entitlement_granted,created_at").single();
  if (error || !data) return json({ ok: false, error: "The subscription preview could not be saved." }, 503);
  return json({
    ok: true,
    preview: data,
    notice: "Preview saved only. No Pi subscription, wallet prompt, payment, renewal, or entitlement was started.",
  });
}


const MARKETPLACE_PUBLIC_COLUMNS = "id,public_title,public_summary,category,capability_manifest,price_stroops,currency,billing_period,license_code,creator_label,current_version,capability_level,listing_status,updated_at";

async function marketplaceBrowse(admin: any) {
  const { data, error } = await admin.from("agent_marketplace_listings")
    .select(MARKETPLACE_PUBLIC_COLUMNS).eq("listing_status", "published")
    .order("updated_at", { ascending: false }).limit(100);
  if (error) return json({ ok: false, error: "The creator catalogue is temporarily unavailable." }, 503);
  return json({ ok: true, listings: (data || []).map((row: any) => ({
    id: row.id, title: row.public_title, summary: row.public_summary, category: row.category,
    capabilities: row.capability_manifest, priceStroops: String(row.price_stroops), currency: "PI",
    billingPeriod: row.billing_period, license: row.license_code, creatorLabel: row.creator_label,
    version: row.current_version, capabilityLevel: row.capability_level, status: row.listing_status,
    updatedAt: row.updated_at,
  })), notice: "Published capability metadata only. Private missions, source code, credentials, and executable definitions are not exposed." });
}

async function marketplaceMyListings(admin: any, uid: string) {
  const { data, error } = await admin.from("agent_marketplace_listings")
    .select("id,agent_id,public_title,public_summary,category,price_stroops,billing_period,license_code,creator_label,current_version,capability_level,listing_status,updated_at")
    .eq("owner_pi_uid", uid).order("updated_at", { ascending: false }).limit(50);
  if (error) return json({ ok: false, error: "Your creator listings could not be loaded." }, 503);
  const rows = data || [];
  const ids = rows.map((row: any) => row.agent_id);
  const agents = ids.length
    ? await admin.from("user_agents").select("id,name,template_key").eq("owner_pi_uid", uid).in("id", ids)
    : { data: [], error: null };
  if (agents.error) return json({ ok: false, error: "Your owned agents could not be loaded." }, 503);
  const byId = new Map<string, any>((agents.data || []).map((agent: any) => [agent.id, agent]));
  return json({ ok: true, listings: rows.map((row: any) => ({
    id: row.id, agentId: row.agent_id, agentName: byId.get(row.agent_id)?.name || "Saved agent",
    templateKey: byId.get(row.agent_id)?.template_key || null, title: row.public_title, summary: row.public_summary,
    category: row.category, priceStroops: String(row.price_stroops), billingPeriod: row.billing_period,
    license: row.license_code, creatorLabel: row.creator_label, version: row.current_version,
    capabilityLevel: row.capability_level, status: row.listing_status, updatedAt: row.updated_at,
  })) });
}

async function marketplacePublish(admin: any, uid: string, username: string | null, body: Record<string, unknown>) {
  const agentId = cleanText(body.agentId, 64);
  const title = cleanText(body.title, 80);
  const summary = cleanText(body.summary, 600);
  const category = cleanText(body.category, 40);
  const priceStroops = parseStroops(body.priceStroops);
  const billingPeriod = cleanText(body.billingPeriod, 20);
  const license = cleanText(body.license, 40);
  const manifest = normalizeMarketplaceCapabilityManifest(body.capabilityManifest);
  if (!isUuid(agentId)) return json({ ok: false, error: "Choose one of your saved agents." }, 400);
  if (title.length < 3 || summary.length < 20) return json({ ok: false, error: "Add a public title and a description of at least 20 characters." }, 400);
  if (!MARKETPLACE_CATEGORIES.includes(category as any)) return json({ ok: false, error: "Choose a supported marketplace category." }, 400);
  if (priceStroops === null) return json({ ok: false, error: "Enter a valid Pi price with at most seven decimal places." }, 400);
  if (!MARKETPLACE_BILLING_PERIODS.includes(billingPeriod as any)) return json({ ok: false, error: "Choose a supported rental period." }, 400);
  if (!MARKETPLACE_LICENSES.includes(license as any)) return json({ ok: false, error: "Choose a supported rental licence." }, 400);
  if (!manifest) return json({ ok: false, error: "The capability definition is invalid or requests unsupported execution." }, 400);
  const { data: owned, error: ownershipError } = await admin.from("user_agents")
    .select("id,status").eq("id", agentId).eq("owner_pi_uid", uid).maybeSingle();
  if (ownershipError) return json({ ok: false, error: "Agent ownership could not be verified." }, 503);
  if (!owned || owned.status !== "active") return json({ ok: false, error: "This agent is not owned by this Pioneer or is inactive." }, 403);
  const { data, error } = await admin.rpc("publish_agent_marketplace_listing", {
    p_owner_pi_uid: uid, p_agent_id: agentId, p_public_title: title, p_public_summary: summary,
    p_category: category, p_capability_manifest: manifest, p_price_stroops: priceStroops,
    p_billing_period: billingPeriod, p_license_code: license,
    p_creator_label: cleanText(username, 60) || "Pi Pioneer",
  });
  if (error || !data) {
    const code = String(error?.message || "");
    if (code.includes("AGENT_NOT_OWNED_OR_NOT_MARKETPLACE_ELIGIBLE")) return json({ ok: false, error: "This template is not yet eligible for marketplace publication." }, 409);
    if (code.includes("UNSUPPORTED_") || code.includes("INVALID_CAPABILITY")) return json({ ok: false, error: "The capability list includes an unsupported permission." }, 400);
    return json({ ok: false, error: "The listing could not be published. Check that it is a reviewed prototype or demo." }, 503);
  }
  return json({ ok: true, listingId: data, notice: "Published capability metadata only. No payment or rental entitlement was created." });
}

async function marketplaceRentPreview(admin: any, uid: string, body: Record<string, unknown>) {
  const listingId = cleanText(body.listingId, 64);
  const idempotencyKey = cleanText(body.idempotencyKey, 64);
  if (!isUuid(listingId) || !isUuid(idempotencyKey)) return json({ ok: false, error: "A valid listing and request identity are required." }, 400);
  const { data, error } = await admin.rpc("create_agent_rental_preview", {
    p_renter_pi_uid: uid, p_listing_id: listingId, p_idempotency_key: idempotencyKey,
  });
  if (error || !data) {
    const code = String(error?.message || "");
    if (code.includes("CREATOR_CANNOT_RENT_OWN_LISTING")) return json({ ok: false, error: "Creators cannot rent their own listings." }, 409);
    if (code.includes("IDEMPOTENCY_KEY_REUSED")) return json({ ok: false, error: "This request identifier was already used for a different listing." }, 409);
    if (code.includes("LISTING_NOT_AVAILABLE")) return json({ ok: false, error: "This listing is no longer available." }, 404);
    return json({ ok: false, error: "The rental preview could not be created." }, 503);
  }
  const { data: intent, error: intentError } = await admin.from("agent_rental_intents")
    .select("id,listing_id,version_number,status,payment_state,entitlement_granted,created_at")
    .eq("id", data).eq("renter_pi_uid", uid).single();
  if (intentError || !intent) return json({ ok: false, error: "The preview receipt could not be loaded." }, 503);
  return json({ ok: true, intent: {
    id: intent.id, listingId: intent.listing_id, version: intent.version_number,
    status: intent.status, paymentState: intent.payment_state,
    entitlementGranted: intent.entitlement_granted, createdAt: intent.created_at,
  }, notice: "Preview only. No wallet prompt, payment, source transfer, or entitlement was started." });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const authHeader = request.headers.get("authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return json({ ok: false, error: "Sign in with Pi Browser to use your private workbench." }, 401);

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) return json({ ok: false, error: "Request is too large." }, 413);
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) return json({ ok: false, error: "Request is too large." }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_body");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const user = await verifyPiToken(tokenMatch[1].trim());
  if (!user) return json({ ok: false, error: "Pi could not verify this session. Sign in again from the registered Testnet app." }, 401);

  const admin = getAdminClient();
  if (!admin) return json({ ok: false, error: "The secure workbench service is not configured. No action was taken." }, 503);

  try {
    const action = cleanText(body.action, 40);
    switch (action) {
      case "bootstrap":
        return await bootstrap(admin, user.uid, user.username);
      case "create_agent":
        return await createAgent(admin, user.uid, body);
      case "run_agent":
        return await runAgent(admin, user.uid, body);
      case "create_proposal":
        return await createProposal(admin, user.uid, body);
      case "vote":
        return await castVote(admin, user.uid, body);
      case "subscription_preview":
        return await createSubscriptionPreview(admin, user.uid, body);
      case "marketplace_browse":
        return await marketplaceBrowse(admin);
      case "marketplace_my_listings":
        return await marketplaceMyListings(admin, user.uid);
      case "marketplace_publish":
        return await marketplacePublish(admin, user.uid, user.username, body);
      case "marketplace_rent_preview":
        return await marketplaceRentPreview(admin, user.uid, body);
      default:
        return json({ ok: false, error: "Unsupported workbench action." }, 400);
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    console.error("agent-workbench request failed", { code });
    return json({ ok: false, error: "The workbench could not complete this request. No external action was performed." }, 503);
  }
});
