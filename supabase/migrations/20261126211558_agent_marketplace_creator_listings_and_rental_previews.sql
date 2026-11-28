create table if not exists public.agent_marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.user_agents(id) on delete cascade,
  owner_pi_uid text not null check (length(owner_pi_uid) between 3 and 160),
  public_title text not null check (length(btrim(public_title)) between 3 and 80),
  public_summary text not null check (length(btrim(public_summary)) between 20 and 600),
  category text not null check (category in ('cybersecurity','global_intelligence','market_research','pi_network','research','other')),
  capability_manifest jsonb not null check (jsonb_typeof(capability_manifest) = 'object'),
  price_stroops bigint not null check (price_stroops >= 0),
  currency text not null default 'PI' check (currency = 'PI'),
  billing_period text not null check (billing_period in ('per_run','weekly','monthly')),
  license_code text not null check (license_code in ('rental_access_only','personal_use_rental','commercial_use_rental')),
  creator_label text not null check (length(btrim(creator_label)) between 1 and 60),
  current_version integer not null default 1 check (current_version >= 1),
  listing_status text not null default 'published' check (listing_status in ('published','suspended','retired')),
  platform_fee_stroops bigint not null default 0 check (platform_fee_stroops = 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_marketplace_listings_public_idx on public.agent_marketplace_listings(listing_status,category,updated_at desc);

create table if not exists public.agent_marketplace_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agent_marketplace_listings(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  public_snapshot jsonb not null check (jsonb_typeof(public_snapshot) = 'object'),
  price_stroops bigint not null check (price_stroops >= 0),
  currency text not null default 'PI' check (currency = 'PI'),
  billing_period text not null check (billing_period in ('per_run','weekly','monthly')),
  license_code text not null check (license_code in ('rental_access_only','personal_use_rental','commercial_use_rental')),
  created_at timestamptz not null default now(),
  unique (listing_id,version_number)
);
create table if not exists public.agent_rental_intents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agent_marketplace_listings(id) on delete restrict,
  version_number integer not null check (version_number >= 1),
  renter_pi_uid text not null check (length(renter_pi_uid) between 3 and 160),
  idempotency_key uuid not null,
  status text not null default 'preview_only' check (status = 'preview_only'),
  payment_state text not null default 'not_started' check (payment_state = 'not_started'),
  entitlement_granted boolean not null default false check (entitlement_granted = false),
  created_at timestamptz not null default now(),
  unique (renter_pi_uid,idempotency_key)
);
create index if not exists agent_rental_intents_listing_idx on public.agent_rental_intents(listing_id,created_at desc);
create index if not exists agent_rental_intents_renter_idx on public.agent_rental_intents(renter_pi_uid,created_at desc);

alter table public.agent_marketplace_listings enable row level security;
alter table public.agent_marketplace_versions enable row level security;
alter table public.agent_rental_intents enable row level security;
revoke all on table public.agent_marketplace_listings from public,anon,authenticated;
revoke all on table public.agent_marketplace_versions from public,anon,authenticated;
revoke all on table public.agent_rental_intents from public,anon,authenticated;
grant select (id,public_title,public_summary,category,capability_manifest,price_stroops,currency,billing_period,license_code,creator_label,current_version,listing_status,created_at,updated_at)
  on public.agent_marketplace_listings to anon,authenticated;
grant all privileges on public.agent_marketplace_listings to service_role;
grant all privileges on public.agent_marketplace_versions to service_role;
grant all privileges on public.agent_rental_intents to service_role;
create policy "public can read only published agent listings" on public.agent_marketplace_listings for select to anon,authenticated using (listing_status = 'published');
create policy "service role manages agent marketplace listings" on public.agent_marketplace_listings for all to service_role using (true) with check (true);
create policy "service role manages agent marketplace versions" on public.agent_marketplace_versions for all to service_role using (true) with check (true);
create policy "service role manages agent rental intents" on public.agent_rental_intents for all to service_role using (true) with check (true);

create or replace function public.publish_agent_marketplace_listing(
  p_owner_pi_uid text,p_agent_id uuid,p_public_title text,p_public_summary text,p_category text,
  p_capability_manifest jsonb,p_price_stroops bigint,p_billing_period text,p_license_code text,p_creator_label text
) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_listing_id uuid; v_current_version integer; v_next_version integer; v_snapshot jsonb;
begin
  if p_owner_pi_uid is null or length(p_owner_pi_uid) < 3 or length(p_owner_pi_uid) > 160 then raise exception 'INVALID_OWNER'; end if;
  if p_public_title is null or length(btrim(p_public_title)) < 3 or length(btrim(p_public_title)) > 80 then raise exception 'INVALID_PUBLIC_TITLE'; end if;
  if p_public_summary is null or length(btrim(p_public_summary)) < 20 or length(btrim(p_public_summary)) > 600 then raise exception 'INVALID_PUBLIC_SUMMARY'; end if;
  if p_category not in ('cybersecurity','global_intelligence','market_research','pi_network','research','other') then raise exception 'INVALID_CATEGORY'; end if;
  if p_price_stroops is null or p_price_stroops < 0 then raise exception 'INVALID_PI_PRICE'; end if;
  if p_billing_period not in ('per_run','weekly','monthly') then raise exception 'INVALID_BILLING_PERIOD'; end if;
  if p_license_code not in ('rental_access_only','personal_use_rental','commercial_use_rental') then raise exception 'INVALID_LICENSE'; end if;
  if p_creator_label is null or length(btrim(p_creator_label)) < 1 or length(btrim(p_creator_label)) > 60 then raise exception 'INVALID_CREATOR_LABEL'; end if;
  if p_capability_manifest is null or jsonb_typeof(p_capability_manifest) <> 'object'
    or jsonb_typeof(p_capability_manifest->'capabilities') <> 'array'
    or jsonb_typeof(p_capability_manifest->'input_types') <> 'array'
    or jsonb_typeof(p_capability_manifest->'output_types') <> 'array'
    or jsonb_typeof(p_capability_manifest->'data_sources') <> 'array'
    or p_capability_manifest->>'execution_mode' <> 'read_only' then raise exception 'INVALID_CAPABILITY_MANIFEST'; end if;
  if not exists (select 1 from public.user_agents a where a.id=p_agent_id and a.owner_pi_uid=p_owner_pi_uid and a.status='active') then raise exception 'AGENT_NOT_OWNED_OR_NOT_ACTIVE'; end if;
  select l.id,l.current_version into v_listing_id,v_current_version from public.agent_marketplace_listings l where l.agent_id=p_agent_id and l.owner_pi_uid=p_owner_pi_uid for update;
  if v_listing_id is null then
    v_listing_id:=gen_random_uuid(); v_next_version:=1;
    insert into public.agent_marketplace_listings(id,agent_id,owner_pi_uid,public_title,public_summary,category,capability_manifest,price_stroops,billing_period,license_code,creator_label,current_version,listing_status,platform_fee_stroops)
    values(v_listing_id,p_agent_id,p_owner_pi_uid,btrim(p_public_title),btrim(p_public_summary),p_category,p_capability_manifest,p_price_stroops,p_billing_period,p_license_code,btrim(p_creator_label),v_next_version,'published',0);
  else
    v_next_version:=v_current_version+1;
    update public.agent_marketplace_listings set public_title=btrim(p_public_title),public_summary=btrim(p_public_summary),category=p_category,capability_manifest=p_capability_manifest,price_stroops=p_price_stroops,billing_period=p_billing_period,license_code=p_license_code,creator_label=btrim(p_creator_label),current_version=v_next_version,listing_status='published',platform_fee_stroops=0,updated_at=now() where id=v_listing_id;
  end if;
  v_snapshot:=jsonb_build_object('public_title',btrim(p_public_title),'public_summary',btrim(p_public_summary),'category',p_category,'capability_manifest',p_capability_manifest,'creator_label',btrim(p_creator_label));
  insert into public.agent_marketplace_versions(listing_id,version_number,public_snapshot,price_stroops,currency,billing_period,license_code)
    values(v_listing_id,v_next_version,v_snapshot,p_price_stroops,'PI',p_billing_period,p_license_code);
  return v_listing_id;
end $$;

create or replace function public.create_agent_rental_preview(p_renter_pi_uid text,p_listing_id uuid,p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_owner_pi_uid text; v_version integer; v_intent_id uuid; v_existing_listing_id uuid;
begin
  if p_renter_pi_uid is null or length(p_renter_pi_uid) < 3 or length(p_renter_pi_uid) > 160 then raise exception 'INVALID_RENTER'; end if;
  if p_idempotency_key is null then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  select l.owner_pi_uid,l.current_version into v_owner_pi_uid,v_version from public.agent_marketplace_listings l
   where l.id=p_listing_id and l.listing_status='published' for share;
  if v_owner_pi_uid is null then raise exception 'LISTING_NOT_AVAILABLE'; end if;
  if v_owner_pi_uid=p_renter_pi_uid then raise exception 'CREATOR_CANNOT_RENT_OWN_LISTING'; end if;
  insert into public.agent_rental_intents(listing_id,version_number,renter_pi_uid,idempotency_key,status,payment_state,entitlement_granted)
  values(p_listing_id,v_version,p_renter_pi_uid,p_idempotency_key,'preview_only','not_started',false)
  on conflict(renter_pi_uid,idempotency_key) do nothing returning id into v_intent_id;
  if v_intent_id is null then
    select intent.id,intent.listing_id into v_intent_id,v_existing_listing_id from public.agent_rental_intents intent
     where intent.renter_pi_uid=p_renter_pi_uid and intent.idempotency_key=p_idempotency_key;
    if v_existing_listing_id is distinct from p_listing_id then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  end if;
  return v_intent_id;
end $$;
revoke all on function public.publish_agent_marketplace_listing(text,uuid,text,text,text,jsonb,bigint,text,text,text) from public,anon,authenticated;
revoke all on function public.create_agent_rental_preview(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_agent_marketplace_listing(text,uuid,text,text,text,jsonb,bigint,text,text,text) to service_role;
grant execute on function public.create_agent_rental_preview(text,uuid,uuid) to service_role;
comment on table public.agent_marketplace_listings is 'Published capability metadata only. Private agent missions and executable source are not public.';
comment on table public.agent_marketplace_versions is 'Versioned public metadata snapshots for attribution and listing history.';
comment on table public.agent_rental_intents is 'Preview-only rental records. Payment and entitlement are database-constrained off.';
