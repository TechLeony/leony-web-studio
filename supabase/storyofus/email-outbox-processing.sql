-- StoryOfUs email outbox processing foundation.
-- Manual-review SQL only. Do not grant browser roles access to these functions.

begin;

create or replace function public.storyofus_claim_email_outbox_batch(
  p_batch_size integer default 10
)
returns table (
  id uuid,
  submission_id uuid,
  email_type text,
  event_key text,
  status text,
  attempt_count integer,
  locked_at timestamptz,
  lock_token uuid,
  queued_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_batch_size integer;
  v_now timestamptz := pg_catalog.now();
  v_stale_processing_before timestamptz := v_now - interval '15 minutes';
begin
  v_batch_size := least(greatest(coalesce(p_batch_size, 10), 1), 25);

  with stale_max_attempts as (
    select outbox.id
    from public.storyofus_email_outbox as outbox
    where outbox.status = 'processing'
      and outbox.attempt_count >= 8
      and (
        outbox.locked_at is null
        or outbox.locked_at < v_stale_processing_before
      )
    order by
      outbox.next_attempt_at,
      outbox.queued_at,
      outbox.id
    limit v_batch_size
    for update skip locked
  )
  update public.storyofus_email_outbox as outbox
  set
    status = 'dead',
    locked_at = null,
    lock_token = null,
    provider_message_id = null,
    last_error_code = 'processing_lock_expired_max_attempts',
    last_error_safe_message = null,
    failed_at = v_now,
    updated_at = v_now
  from stale_max_attempts
  where outbox.id = stale_max_attempts.id;

  return query
  with eligible as (
    select outbox.id
    from public.storyofus_email_outbox as outbox
    where outbox.attempt_count < 8
      and (
        outbox.status = 'pending'
        or (
          outbox.status = 'retry_scheduled'
          and outbox.next_attempt_at <= v_now
        )
        or (
          outbox.status = 'processing'
          and (
            outbox.locked_at is null
            or outbox.locked_at < v_stale_processing_before
          )
        )
      )
    order by
      outbox.next_attempt_at,
      outbox.queued_at,
      outbox.id
    limit v_batch_size
    for update skip locked
  )
  update public.storyofus_email_outbox as outbox
  set
    status = 'processing',
    attempt_count = outbox.attempt_count + 1,
    locked_at = v_now,
    lock_token = pg_catalog.gen_random_uuid(),
    provider_message_id = null,
    last_error_code = null,
    last_error_safe_message = null,
    failed_at = null,
    updated_at = v_now
  from eligible
  where outbox.id = eligible.id
  returning
    outbox.id,
    outbox.submission_id,
    outbox.email_type,
    outbox.event_key,
    outbox.status,
    outbox.attempt_count,
    outbox.locked_at,
    outbox.lock_token,
    outbox.queued_at,
    outbox.created_at;
end;
$$;

create or replace function public.storyofus_mark_email_outbox_sent(
  p_outbox_id uuid,
  p_lock_token uuid,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_provider_message_id text;
  v_updated_count integer;
  v_now timestamptz := pg_catalog.now();
begin
  v_provider_message_id := nullif(pg_catalog.btrim(coalesce(p_provider_message_id, '')), '');

  if p_outbox_id is null or p_lock_token is null then
    return false;
  end if;

  if v_provider_message_id is null or pg_catalog.length(v_provider_message_id) > 160 then
    raise exception 'Invalid provider message id.';
  end if;

  update public.storyofus_email_outbox
  set
    status = 'sent',
    provider_message_id = v_provider_message_id,
    locked_at = null,
    lock_token = null,
    last_error_code = null,
    last_error_safe_message = null,
    sent_at = v_now,
    failed_at = null,
    updated_at = v_now
  where id = p_outbox_id
    and status = 'processing'
    and lock_token = p_lock_token;

  get diagnostics v_updated_count = row_count;

  return v_updated_count = 1;
end;
$$;

create or replace function public.storyofus_schedule_email_outbox_retry(
  p_outbox_id uuid,
  p_lock_token uuid,
  p_next_attempt_at timestamptz,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_error_code text;
  v_updated_count integer;
  v_now timestamptz := pg_catalog.now();
begin
  v_error_code := nullif(pg_catalog.btrim(coalesce(p_error_code, '')), '');

  if p_outbox_id is null or p_lock_token is null then
    return false;
  end if;

  if p_next_attempt_at is null
    or p_next_attempt_at <= v_now
    or p_next_attempt_at > v_now + interval '86400 seconds' then
    raise exception 'Retry timestamp must be between now and 86400 seconds from now.';
  end if;

  if v_error_code is null
    or v_error_code not in ('rate_limited', 'provider_unavailable', 'provider_error') then
    raise exception 'Invalid retry error code.';
  end if;

  update public.storyofus_email_outbox
  set
    status = 'retry_scheduled',
    next_attempt_at = p_next_attempt_at,
    locked_at = null,
    lock_token = null,
    provider_message_id = null,
    last_error_code = v_error_code,
    last_error_safe_message = null,
    failed_at = null,
    updated_at = v_now
  where id = p_outbox_id
    and status = 'processing'
    and lock_token = p_lock_token
    and attempt_count < 8;

  get diagnostics v_updated_count = row_count;

  return v_updated_count = 1;
end;
$$;

create or replace function public.storyofus_mark_email_outbox_dead(
  p_outbox_id uuid,
  p_lock_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_error_code text;
  v_updated_count integer;
  v_now timestamptz := pg_catalog.now();
begin
  v_error_code := nullif(pg_catalog.btrim(coalesce(p_error_code, '')), '');

  if p_outbox_id is null or p_lock_token is null then
    return false;
  end if;

  if v_error_code is null
    or v_error_code not in (
    'rate_limited',
    'provider_unavailable',
    'provider_error',
    'invalid_input',
    'missing_configuration',
    'provider_rejected'
  ) then
    raise exception 'Invalid terminal error code.';
  end if;

  update public.storyofus_email_outbox
  set
    status = 'dead',
    locked_at = null,
    lock_token = null,
    provider_message_id = null,
    last_error_code = v_error_code,
    last_error_safe_message = null,
    failed_at = v_now,
    updated_at = v_now
  where id = p_outbox_id
    and status = 'processing'
    and lock_token = p_lock_token;

  get diagnostics v_updated_count = row_count;

  return v_updated_count = 1;
end;
$$;

revoke all privileges on function public.storyofus_claim_email_outbox_batch(integer)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_mark_email_outbox_sent(uuid, uuid, text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_schedule_email_outbox_retry(uuid, uuid, timestamptz, text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_mark_email_outbox_dead(uuid, uuid, text)
from public, anon, authenticated;

grant execute on function public.storyofus_claim_email_outbox_batch(integer)
to service_role;

grant execute on function public.storyofus_mark_email_outbox_sent(uuid, uuid, text)
to service_role;

grant execute on function public.storyofus_schedule_email_outbox_retry(uuid, uuid, timestamptz, text)
to service_role;

grant execute on function public.storyofus_mark_email_outbox_dead(uuid, uuid, text)
to service_role;

commit;
