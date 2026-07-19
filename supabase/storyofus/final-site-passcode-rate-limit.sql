-- StoryOfUs final-site passcode rate-limit foundation.
-- Manual-review SQL only. Browser roles must not call this RPC or read buckets.

begin;

create table if not exists public.storyofus_final_site_passcode_rate_limits (
  bucket_key_hash text primary key
    check (bucket_key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  failure_count integer not null
    check (failure_count >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null
);

create index if not exists storyofus_final_site_passcode_rate_limits_updated_at_idx
on public.storyofus_final_site_passcode_rate_limits (updated_at);

alter table public.storyofus_final_site_passcode_rate_limits enable row level security;

revoke all privileges
on table public.storyofus_final_site_passcode_rate_limits
from public, anon, authenticated;

create or replace function public.storyofus_check_final_site_passcode_rate_limit(
  p_bucket_key_hash text
)
returns table (
  limited boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_bucket public.storyofus_final_site_passcode_rate_limits%rowtype;
begin
  if p_bucket_key_hash is null
    or p_bucket_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid final-site passcode rate-limit hash.';
  end if;

  delete from public.storyofus_final_site_passcode_rate_limits
  where ctid in (
    select ctid
    from public.storyofus_final_site_passcode_rate_limits
    where updated_at < v_now - interval '7 days'
    order by updated_at
    limit 100
  );

  select *
  into v_bucket
  from public.storyofus_final_site_passcode_rate_limits
  where bucket_key_hash = p_bucket_key_hash
  for update;

  if found
    and v_bucket.locked_until is not null
    and v_bucket.locked_until > v_now then
    return query
    select
      true,
      greatest(
        ceiling(extract(epoch from (v_bucket.locked_until - v_now)))::integer,
        1
      );
    return;
  end if;

  return query
  select false, 0;
end;
$$;

create or replace function public.storyofus_record_final_site_passcode_failure(
  p_bucket_key_hash text
)
returns table (
  limited boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_window interval := interval '10 minutes';
  v_lockout interval := interval '15 minutes';
  v_failure_limit integer := 5;
  v_bucket public.storyofus_final_site_passcode_rate_limits%rowtype;
  v_next_failure_count integer;
  v_locked_until timestamptz;
begin
  if p_bucket_key_hash is null
    or p_bucket_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid final-site passcode rate-limit hash.';
  end if;

  insert into public.storyofus_final_site_passcode_rate_limits (
    bucket_key_hash,
    window_started_at,
    failure_count,
    locked_until,
    updated_at
  )
  values (
    p_bucket_key_hash,
    v_now,
    0,
    null,
    v_now
  )
  on conflict (bucket_key_hash) do nothing;

  select *
  into v_bucket
  from public.storyofus_final_site_passcode_rate_limits
  where bucket_key_hash = p_bucket_key_hash
  for update;

  if v_bucket.locked_until is not null
    and v_bucket.locked_until > v_now then
    return query
    select
      true,
      greatest(
        ceiling(extract(epoch from (v_bucket.locked_until - v_now)))::integer,
        1
      );
    return;
  end if;

  if v_bucket.window_started_at + v_window <= v_now then
    v_next_failure_count := 1;
  else
    v_next_failure_count := v_bucket.failure_count + 1;
  end if;

  v_locked_until := case
    when v_next_failure_count >= v_failure_limit then v_now + v_lockout
    else null
  end;

  update public.storyofus_final_site_passcode_rate_limits
  set
    window_started_at = case
      when v_bucket.window_started_at + v_window <= v_now then v_now
      else v_bucket.window_started_at
    end,
    failure_count = v_next_failure_count,
    locked_until = v_locked_until,
    updated_at = v_now
  where bucket_key_hash = p_bucket_key_hash;

  return query
  select
    v_locked_until is not null,
    case
      when v_locked_until is not null then ceiling(extract(epoch from (v_locked_until - v_now)))::integer
      else 0
    end;
end;
$$;

create or replace function public.storyofus_clear_final_site_passcode_rate_limit(
  p_bucket_key_hash text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_bucket_key_hash is null
    or p_bucket_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid final-site passcode rate-limit hash.';
  end if;

  delete from public.storyofus_final_site_passcode_rate_limits
  where bucket_key_hash = p_bucket_key_hash;
end;
$$;

revoke all privileges on function public.storyofus_check_final_site_passcode_rate_limit(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_record_final_site_passcode_failure(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_clear_final_site_passcode_rate_limit(text)
from public, anon, authenticated;

grant execute on function public.storyofus_check_final_site_passcode_rate_limit(text)
to service_role;

grant execute on function public.storyofus_record_final_site_passcode_failure(text)
to service_role;

grant execute on function public.storyofus_clear_final_site_passcode_rate_limit(text)
to service_role;

commit;
