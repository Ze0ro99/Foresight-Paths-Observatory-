-- Keep the listing's currency explicit in the authoritative insert and update paths.
create or replace function public.publish_agent_marketplace_listing(
 p_owner_pi_uid text,p_agent_id uuid,p_public_title text,p_public_summary text,p_category text,
 p_capability_manifest jsonb,p_price_stroops bigint,p_billing_period text,p_license_code text,p_creator_label text
) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_listing_id uuid; v_current_version integer; v_next_version integer; v_snapshot jsonb;
begin
 if p_owner_pi_uid is null or length(p_owner_pi_uid)<3 or length(p_owner_pi_uid)>160 then raise exception 'INVALID_OWNER'; end if;
 if p_public_title is null or length(btrim(p_public_title))<3 or length(btrim(p_public_title))>80 then raise exception 'INVALID_PUBLIC_TITLE'; end if;
 if p_public_summary is null or length(btrim(p_public_summary))<20 or length(btrim(p_public_summary))>600 then raise exception 'INVALID_PUBLIC_SUMMARY'; end if;
 if p_category not in ('cybersecurity','global_intelligence','market_research','pi_network','research','other') then raise exception 'INVALID_CATEGORY'; end if;
 if p_price_stroops is null or p_price_stroops<0 then raise exception 'INVALID_PI_PRICE'; end if;
 if p_billing_period not in ('per_run','weekly','monthly') then raise exception 'INVALID_BILLING_PERIOD'; end if;
 if p_license_code not in ('rental_access_only','personal_use_rental','commercial_use_rental') then raise exception 'INVALID_LICENSE'; end if;
 if p_creator_label is null or length(btrim(p_creator_label))<1 or length(btrim(p_creator_label))>60 then raise exception 'INVALID_CREATOR_LABEL'; end if;
 if p_capability_manifest is null or jsonb_typeof(p_capability_manifest)<>'object'
  or jsonb_typeof(p_capability_manifest->'capabilities')<>'array'
  or jsonb_typeof(p_capability_manifest->'input_types')<>'array'
  or jsonb_typeof(p_capability_manifest->'output_types')<>'array'
  or jsonb_typeof(p_capability_manifest->'data_sources')<>'array'
  or p_capability_manifest->>'execution_mode'<>'read_only' then raise exception 'INVALID_CAPABILITY_MANIFEST'; end if;
 if not exists(select 1 from public.user_agents a where a.id=p_agent_id and a.owner_pi_uid=p_owner_pi_uid and a.status='active') then raise exception 'AGENT_NOT_OWNED_OR_NOT_ACTIVE'; end if;
 select l.id,l.current_version into v_listing_id,v_current_version from public.agent_marketplace_listings l
  where l.agent_id=p_agent_id and l.owner_pi_uid=p_owner_pi_uid for update;
 if v_listing_id is null then
  v_listing_id:=gen_random_uuid();v_next_version:=1;
  insert into public.agent_marketplace_listings(id,agent_id,owner_pi_uid,public_title,public_summary,category,capability_manifest,price_stroops,currency,billing_period,license_code,creator_label,current_version,listing_status,platform_fee_stroops)
  values(v_listing_id,p_agent_id,p_owner_pi_uid,btrim(p_public_title),btrim(p_public_summary),p_category,p_capability_manifest,p_price_stroops,'PI',p_billing_period,p_license_code,btrim(p_creator_label),v_next_version,'published',0);
 else
  v_next_version:=v_current_version+1;
  update public.agent_marketplace_listings set public_title=btrim(p_public_title),public_summary=btrim(p_public_summary),
   category=p_category,capability_manifest=p_capability_manifest,price_stroops=p_price_stroops,currency='PI',
   billing_period=p_billing_period,license_code=p_license_code,creator_label=btrim(p_creator_label),
   current_version=v_next_version,listing_status='published',platform_fee_stroops=0,updated_at=now()
   where id=v_listing_id;
 end if;
 v_snapshot:=jsonb_build_object('public_title',btrim(p_public_title),'public_summary',btrim(p_public_summary),
  'category',p_category,'capability_manifest',p_capability_manifest,'creator_label',btrim(p_creator_label));
 insert into public.agent_marketplace_versions(listing_id,version_number,public_snapshot,price_stroops,currency,billing_period,license_code)
 values(v_listing_id,v_next_version,v_snapshot,p_price_stroops,'PI',p_billing_period,p_license_code);
 return v_listing_id;
end $$;
revoke all on function public.publish_agent_marketplace_listing(text,uuid,text,text,text,jsonb,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.publish_agent_marketplace_listing(text,uuid,text,text,text,jsonb,bigint,text,text,text) to service_role;
