create table if not exists public.cisa_kev_items (
  cve_id text primary key
    check (cve_id ~ '^CVE-[0-9]{4}-[0-9]{4,19}$'),
  vendor_project text not null,
  product text not null,
  vulnerability_name text not null,
  date_added date not null,
  short_description text not null,
  required_action text not null,
  due_date date not null,
  known_ransomware_campaign_use text
    check (known_ransomware_campaign_use is null or known_ransomware_campaign_use in ('Known', 'Unknown')),
  forensic_triage text
    check (forensic_triage is null or forensic_triage in ('Yes', 'No')),
  cwes text[] not null default '{}'::text[],
  catalog_version text not null,
  catalog_date_released timestamptz not null,
  source_url text not null check (source_url ~ '^https://'),
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cisa_kev_items_date_added_idx
  on public.cisa_kev_items (date_added desc);

alter table public.cisa_kev_items enable row level security;
revoke all on table public.cisa_kev_items from public, anon, authenticated;
grant all privileges on table public.cisa_kev_items to service_role;

insert into public.source_registry (
  source_key, display_name, source_type, endpoint_host,
  attribution_url, enabled, coverage_note, metadata
)
values (
  'cisa-kev',
  'CISA Known Exploited Vulnerabilities',
  'research',
  'www.cisa.gov',
  'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  true,
  'Official global catalog of known exploited vulnerabilities; entries do not prove a customer asset is affected.',
  jsonb_build_object('refresh_interval_seconds', 900, 'cache_table', 'cisa_kev_items')
)
on conflict (source_key) do update
set display_name = excluded.display_name,
    source_type = excluded.source_type,
    endpoint_host = excluded.endpoint_host,
    attribution_url = excluded.attribution_url,
    enabled = true,
    coverage_note = excluded.coverage_note,
    metadata = public.source_registry.metadata || excluded.metadata,
    updated_at = now();
