create table if not exists private.url_inspection_rate_limits (
  subject_hash text primary key check (subject_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1 and request_count <= 20),
  updated_at timestamptz not null
);
create index if not exists url_inspection_rate_limits_updated_idx
  on private.url_inspection_rate_limits(updated_at);
alter table private.url_inspection_rate_limits enable row level security;
revoke all on table private.url_inspection_rate_limits from public,anon,authenticated,service_role;

create or replace function public.consume_url_inspection_slot(
 p_subject_hash text,p_limit integer default 5,p_window_seconds integer default 60
) returns table(allowed boolean,retry_after_seconds integer)
language plpgsql security definer set search_path=pg_catalog,private as $$
declare v_now timestamptz:=clock_timestamp();v_window_started timestamptz;v_request_count integer;
begin
 if p_subject_hash is null or p_subject_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate-limit subject'; end if;
 if p_limit is null or p_limit<1 or p_limit>20 or p_window_seconds is null or p_window_seconds<10 or p_window_seconds>3600 then raise exception 'Invalid rate-limit parameters'; end if;
 insert into private.url_inspection_rate_limits as limits(subject_hash,window_started_at,request_count,updated_at)
 values(p_subject_hash,v_now,1,v_now)
 on conflict(subject_hash) do update
 set window_started_at=case when limits.window_started_at+make_interval(secs=>p_window_seconds)<=v_now then v_now else limits.window_started_at end,
     request_count=case when limits.window_started_at+make_interval(secs=>p_window_seconds)<=v_now then 1 else limits.request_count+1 end,
     updated_at=v_now
 where limits.window_started_at+make_interval(secs=>p_window_seconds)<=v_now or limits.request_count<p_limit
 returning window_started_at,request_count into v_window_started,v_request_count;
 if found then return query select true,0;
 else
  select limits.window_started_at into v_window_started from private.url_inspection_rate_limits limits where limits.subject_hash=p_subject_hash;
  return query select false,greatest(1,ceil(extract(epoch from(v_window_started+make_interval(secs=>p_window_seconds)-v_now)))::integer);
 end if;
 delete from private.url_inspection_rate_limits where updated_at<v_now-interval '1 day';
end $$;
revoke all on function public.consume_url_inspection_slot(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_url_inspection_slot(text,integer,integer) to service_role;
comment on function public.consume_url_inspection_slot(text,integer,integer) is 'Atomic per-Pioneer URL inspection throttle; accepts only server-generated SHA-256 subject hashes.';
