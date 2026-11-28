-- Testnet-only, authenticated agent workbench.
-- Private user records are accessible only to the service-role-backed Edge Function.
create table if not exists public.user_agents (
  id uuid primary key default gen_random_uuid(),
  owner_pi_uid text not null,
  template_key text not null references public.agent_templates(template_key) on delete restrict,
  name text not null check (length(name) between 2 and 80),
  mission text not null check (length(mission) between 5 and 1200),
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_agents_owner_created_idx on public.user_agents (owner_pi_uid, created_at desc);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_pi_uid text not null,
  agent_id uuid not null references public.user_agents(id) on delete cascade,
  run_status text not null check (run_status in ('ok','partial','unavailable','failed')),
  execution_mode text not null default 'simulation' check (execution_mode = 'simulation'),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_owner_created_idx on public.agent_runs (owner_pi_uid, created_at desc);
create index if not exists agent_runs_agent_created_idx on public.agent_runs (agent_id, created_at desc);

create table if not exists public.agent_proposals (
  id uuid primary key default gen_random_uuid(),
  proposer_pi_uid text not null,
  agent_id uuid references public.user_agents(id) on delete set null,
  kind text not null check (kind in ('agent','smart_contract','subscription')),
  title text not null check (length(title) between 3 and 120),
  summary text not null check (length(summary) between 10 and 2000),
  risk_label text not null default 'unassessed' check (risk_label in ('low','moderate','high','unassessed')),
  status text not null default 'open' check (status in ('open','approved','rejected','staged')),
  execution_state text not null default 'not_executed' check (execution_state = 'not_executed'),
  created_at timestamptz not null default now()
);
create index if not exists agent_proposals_status_created_idx on public.agent_proposals (status, created_at desc);
create index if not exists agent_proposals_owner_created_idx on public.agent_proposals (proposer_pi_uid, created_at desc);

create table if not exists public.agent_proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.agent_proposals(id) on delete cascade,
  owner_pi_uid text not null,
  vote text not null check (vote in ('for','against')),
  created_at timestamptz not null default now(),
  constraint agent_proposal_one_vote_per_pioneer unique (proposal_id, owner_pi_uid)
);
create index if not exists agent_proposal_votes_proposal_idx on public.agent_proposal_votes (proposal_id);

create table if not exists public.agent_subscription_previews (
  id uuid primary key default gen_random_uuid(),
  owner_pi_uid text not null,
  plan_key text not null check (plan_key in ('continuous_watch','incident_response','daily_brief','weekly_review')),
  pi_service_id text check (pi_service_id is null or length(pi_service_id) <= 160),
  periods integer not null default 1 check (periods between 1 and 180),
  billing_mode text not null default 'preview' check (billing_mode = 'preview'),
  payment_started boolean not null default false check (payment_started = false),
  entitlement_granted boolean not null default false check (entitlement_granted = false),
  created_at timestamptz not null default now()
);
create index if not exists agent_subscription_previews_owner_created_idx
  on public.agent_subscription_previews (owner_pi_uid, created_at desc);

-- Durable per-Pioneer run throttling: one run every 20 seconds, at most 40 per 24-hour window.
create table if not exists public.agent_run_limits (
  owner_pi_uid text primary key,
  next_allowed_at timestamptz not null,
  daily_window_started_at timestamptz not null,
  daily_count integer not null check (daily_count between 1 and 40)
);

alter table public.user_agents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_proposals enable row level security;
alter table public.agent_proposal_votes enable row level security;
alter table public.agent_subscription_previews enable row level security;
alter table public.agent_run_limits enable row level security;

revoke all on table public.user_agents from anon, authenticated;
revoke all on table public.agent_runs from anon, authenticated;
revoke all on table public.agent_proposals from anon, authenticated;
revoke all on table public.agent_proposal_votes from anon, authenticated;
revoke all on table public.agent_subscription_previews from anon, authenticated;
revoke all on table public.agent_run_limits from anon, authenticated;

grant select, insert, update, delete on table public.user_agents to service_role;
grant select, insert on table public.agent_runs to service_role;
grant select, insert, update on table public.agent_proposals to service_role;
grant select, insert on table public.agent_proposal_votes to service_role;
grant select, insert on table public.agent_subscription_previews to service_role;
grant select, insert, update on table public.agent_run_limits to service_role;

drop policy if exists "service role manages user agents" on public.user_agents;
create policy "service role manages user agents" on public.user_agents for all to service_role using (true) with check (true);
drop policy if exists "service role manages agent runs" on public.agent_runs;
create policy "service role manages agent runs" on public.agent_runs for all to service_role using (true) with check (true);
drop policy if exists "service role manages agent proposals" on public.agent_proposals;
create policy "service role manages agent proposals" on public.agent_proposals for all to service_role using (true) with check (true);
drop policy if exists "service role manages agent proposal votes" on public.agent_proposal_votes;
create policy "service role manages agent proposal votes" on public.agent_proposal_votes for all to service_role using (true) with check (true);
drop policy if exists "service role manages subscription previews" on public.agent_subscription_previews;
create policy "service role manages subscription previews" on public.agent_subscription_previews for all to service_role using (true) with check (true);
drop policy if exists "service role manages agent run limits" on public.agent_run_limits;
create policy "service role manages agent run limits" on public.agent_run_limits for all to service_role using (true) with check (true);

-- Callable only by the service-role-backed Edge Function.
create or replace function public.claim_agent_run_slot(p_owner_pi_uid text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_claimed boolean := false;
begin
  if p_owner_pi_uid is null or length(p_owner_pi_uid) < 3 or length(p_owner_pi_uid) > 160 then
    return false;
  end if;

  insert into public.agent_run_limits (owner_pi_uid, next_allowed_at, daily_window_started_at, daily_count)
  values (p_owner_pi_uid, now() + interval '20 seconds', now(), 1)
  on conflict (owner_pi_uid) do update
  set
    daily_count = case
      when public.agent_run_limits.daily_window_started_at <= now() - interval '24 hours' then 1
      else public.agent_run_limits.daily_count + 1
    end,
    daily_window_started_at = case
      when public.agent_run_limits.daily_window_started_at <= now() - interval '24 hours' then now()
      else public.agent_run_limits.daily_window_started_at
    end,
    next_allowed_at = now() + interval '20 seconds'
  where public.agent_run_limits.next_allowed_at <= now()
    and (
      public.agent_run_limits.daily_window_started_at <= now() - interval '24 hours'
      or public.agent_run_limits.daily_count < 40
    )
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$function$;

revoke all on function public.claim_agent_run_slot(text) from public, anon, authenticated;
grant execute on function public.claim_agent_run_slot(text) to service_role;

-- Reviewed prototypes only; no chain execution or Mainnet permission is enabled.
insert into public.agent_templates (
  template_key, name, description, category, capability_level,
  requires_external_credentials, testnet_enabled, mainnet_enabled, safety_notes, config_schema
)
values
  ('market-risk-monitor', 'Market Risk Monitor',
   'Prepares source-attributed market risk briefs when an approved price and macro data feed is connected.',
   'research', 'planned', true, false, false,
   'No live market feed is connected by default. Never invent prices, guarantee direction, or issue trading instructions.',
   '{"assets":["gold","oil","crypto","equities"],"horizons":["24h","7d","30d"]}'::jsonb),
  ('space-anomaly-observer', 'Space and Anomaly Observer',
   'Organizes attributed science and space reports while separating documented observations from disputed or speculative claims.',
   'research', 'planned', false, false, false,
   'No extraordinary or extraterrestrial claim is treated as confirmed without independently attributable evidence.',
   '{"evidence_classes":["documented","plausible","disputed","speculative","symbolic"]}'::jsonb),
  ('public-health-watch', 'Public Health Watch',
   'Summarizes attributed public health and outbreak reporting for situational awareness.',
   'disaster', 'planned', false, false, false,
   'Not a diagnostic or medical advice system. Official public health guidance and human review are required.',
   '{"categories":["health"]}'::jsonb)
on conflict (template_key) do nothing;
