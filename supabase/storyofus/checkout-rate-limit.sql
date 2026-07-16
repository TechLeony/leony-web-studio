-- StoryOfUs checkout rate-limit foundation.
-- Manual-review SQL only. Browser roles must not call this RPC or read buckets.

begin;

create table if not exists public.storyofus_checkout_rate_limits (
  bucket_type text not null
    check (bucket_type in ('global', 'source', 'email')),
  bucket_key_hash text not null
    check (bucket_key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null
    check (request_count >= 0),
  updated_at timestamptz not null,

  primary key (bucket_type, bucket_key_hash)
);

create index if not exists storyofus_checkout_rate_limits_updated_at_idx
on public.storyofus_checkout_rate_limits (updated_at);

alter table public.storyofus_checkout_rate_limits enable row level security;

revoke all privileges
on table public.storyofus_checkout_rate_limits
from public, anon, authenticated;

create or replace function public.storyofus_consume_checkout_rate_limit(
  p_global_key_hash text,
  p_source_key_hash text,
  p_email_key_hash text
)
returns table (
  limited boolean,
  limited_scope text,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_global_window interval := interval '1 minute';
  v_source_window interval := interval '10 minutes';
  v_email_window interval := interval '30 minutes';
  v_global_limit integer := 30;
  v_source_limit integer := 5;
  v_email_limit integer := 3;
  v_global public.storyofus_checkout_rate_limits%rowtype;
  v_source public.storyofus_checkout_rate_limits%rowtype;
  v_email public.storyofus_checkout_rate_limits%rowtype;
  v_global_limited boolean;
  v_source_limited boolean;
  v_email_limited boolean;
  v_retry_after_seconds integer := 0;
begin
  if p_global_key_hash is null
    or p_global_key_hash !~ '^[0-9a-f]{64}$'
    or p_source_key_hash is null
    or p_source_key_hash !~ '^[0-9a-f]{64}$'
    or p_email_key_hash is null
    or p_email_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid checkout rate-limit hash.';
  end if;

  delete from public.storyofus_checkout_rate_limits
  where ctid in (
    select ctid
    from public.storyofus_checkout_rate_limits
    where bucket_type <> 'global'
      and updated_at < v_now - interval '48 hours'
    order by updated_at
    limit 100
  );

  insert into public.storyofus_checkout_rate_limits (
    bucket_type,
    bucket_key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values
    ('global', p_global_key_hash, v_now, 0, v_now),
    ('source', p_source_key_hash, v_now, 0, v_now),
    ('email', p_email_key_hash, v_now, 0, v_now)
  on conflict (bucket_type, bucket_key_hash) do nothing;

  perform 1
  from public.storyofus_checkout_rate_limits as bucket
  where (
    (bucket.bucket_type = 'global' and bucket.bucket_key_hash = p_global_key_hash)
    or (bucket.bucket_type = 'source' and bucket.bucket_key_hash = p_source_key_hash)
    or (bucket.bucket_type = 'email' and bucket.bucket_key_hash = p_email_key_hash)
  )
  order by bucket.bucket_type, bucket.bucket_key_hash
  for update;

  select *
  into v_global
  from public.storyofus_checkout_rate_limits
  where bucket_type = 'global'
    and bucket_key_hash = p_global_key_hash;

  select *
  into v_source
  from public.storyofus_checkout_rate_limits
  where bucket_type = 'source'
    and bucket_key_hash = p_source_key_hash;

  select *
  into v_email
  from public.storyofus_checkout_rate_limits
  where bucket_type = 'email'
    and bucket_key_hash = p_email_key_hash;

  v_global_limited :=
    v_global.window_started_at + v_global_window > v_now
    and v_global.request_count >= v_global_limit;
  v_source_limited :=
    v_source.window_started_at + v_source_window > v_now
    and v_source.request_count >= v_source_limit;
  v_email_limited :=
    v_email.window_started_at + v_email_window > v_now
    and v_email.request_count >= v_email_limit;

  if v_global_limited or v_source_limited or v_email_limited then
    if v_global_limited then
      v_retry_after_seconds := greatest(
        v_retry_after_seconds,
        ceiling(extract(epoch from (v_global.window_started_at + v_global_window - v_now)))::integer
      );
    end if;

    if v_source_limited then
      v_retry_after_seconds := greatest(
        v_retry_after_seconds,
        ceiling(extract(epoch from (v_source.window_started_at + v_source_window - v_now)))::integer
      );
    end if;

    if v_email_limited then
      v_retry_after_seconds := greatest(
        v_retry_after_seconds,
        ceiling(extract(epoch from (v_email.window_started_at + v_email_window - v_now)))::integer
      );
    end if;

    return query
    select
      true,
      case
        when v_global_limited then 'global'
        when v_source_limited then 'source'
        else 'email'
      end,
      greatest(v_retry_after_seconds, 1);
    return;
  end if;

  update public.storyofus_checkout_rate_limits
  set
    window_started_at = case
      when window_started_at + v_global_window <= v_now then v_now
      else window_started_at
    end,
    request_count = case
      when window_started_at + v_global_window <= v_now then 1
      else request_count + 1
    end,
    updated_at = v_now
  where bucket_type = 'global'
    and bucket_key_hash = p_global_key_hash;

  update public.storyofus_checkout_rate_limits
  set
    window_started_at = case
      when window_started_at + v_source_window <= v_now then v_now
      else window_started_at
    end,
    request_count = case
      when window_started_at + v_source_window <= v_now then 1
      else request_count + 1
    end,
    updated_at = v_now
  where bucket_type = 'source'
    and bucket_key_hash = p_source_key_hash;

  update public.storyofus_checkout_rate_limits
  set
    window_started_at = case
      when window_started_at + v_email_window <= v_now then v_now
      else window_started_at
    end,
    request_count = case
      when window_started_at + v_email_window <= v_now then 1
      else request_count + 1
    end,
    updated_at = v_now
  where bucket_type = 'email'
    and bucket_key_hash = p_email_key_hash;

  return query
  select false, null::text, 0;
end;
$$;

revoke all privileges on function public.storyofus_consume_checkout_rate_limit(text, text, text)
from public, anon, authenticated;

grant execute on function public.storyofus_consume_checkout_rate_limit(text, text, text)
to service_role;

commit;
