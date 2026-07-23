-- StoryOfUs verified Shopier webhook payment application.
-- Manual-review SQL only. Do not expose this RPC to browser roles.

begin;

create or replace function public.storyofus_apply_verified_shopier_payment(
  p_submission_id uuid,
  p_shopier_product_id text,
  p_provider_event_id text,
  p_payment_reference text,
  p_received_amount numeric,
  p_received_currency text,
  p_received_at timestamptz,
  p_sanitized_payload jsonb
)
returns table (
  result text
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_submission public.storyofus_submissions%rowtype;
  v_event_submission_id uuid;
  v_product_id text := pg_catalog.btrim(p_shopier_product_id);
  v_event_id text := pg_catalog.btrim(p_provider_event_id);
  v_payment_reference text := pg_catalog.btrim(p_payment_reference);
  v_currency text := pg_catalog.upper(pg_catalog.btrim(p_received_currency));
  v_payload_size integer;
begin
  if p_submission_id is null
    or v_product_id is null
    or v_product_id = ''
    or pg_catalog.length(v_product_id) > 160
    or v_event_id is null
    or v_event_id = ''
    or pg_catalog.length(v_event_id) > 160
    or v_payment_reference is null
    or v_payment_reference = ''
    or pg_catalog.length(v_payment_reference) > 160
    or p_received_amount is null
    or p_received_amount::text in ('NaN', 'Infinity', '-Infinity')
    or p_received_amount <= 0
    or v_currency is null
    or v_currency = ''
    or v_currency not in ('TRY', 'USD', 'EUR')
    or p_received_at is null
    or p_sanitized_payload is null
    or pg_catalog.jsonb_typeof(p_sanitized_payload) <> 'object' then
    raise exception 'Invalid verified Shopier payment input.';
  end if;

  v_payload_size := pg_catalog.octet_length(p_sanitized_payload::text);

  if v_payload_size > 4096 then
    raise exception 'Verified Shopier payment payload is too large.';
  end if;

  select id
  into v_event_submission_id
  from public.storyofus_submissions
  where payment_provider = 'shopier'
    and payment_provider_event_id = v_event_id
  order by id;

  perform 1
  from public.storyofus_submissions
  where id = p_submission_id
     or id = v_event_submission_id
  order by id
  for update;

  select id
  into v_event_submission_id
  from public.storyofus_submissions
  where payment_provider = 'shopier'
    and payment_provider_event_id = v_event_id
  order by id;

  if v_event_submission_id is not null
    and v_event_submission_id <> p_submission_id then
    return query select 'event_conflict'::text;
    return;
  end if;

  select *
  into v_submission
  from public.storyofus_submissions
  where id = p_submission_id
  for update;

  if not found then
    return query select 'submission_not_found'::text;
    return;
  end if;

  if v_submission.payment_provider is distinct from 'shopier' then
    if v_submission.payment_status = 'pending' then
      update public.storyofus_submissions
      set
        payment_callback_received_at = p_received_at,
        payment_raw_callback = p_sanitized_payload,
        payment_error = 'provider_mismatch'
      where id = p_submission_id;
    end if;

    return query select 'provider_mismatch'::text;
    return;
  end if;

  if v_submission.shopier_product_id is distinct from v_product_id then
    if v_submission.payment_status = 'pending' then
      update public.storyofus_submissions
      set
        payment_callback_received_at = p_received_at,
        payment_raw_callback = p_sanitized_payload,
        payment_error = 'product_mismatch'
      where id = p_submission_id;
    end if;

    return query select 'product_mismatch'::text;
    return;
  end if;

  if v_submission.payment_amount is null
    or pg_catalog.abs(v_submission.payment_amount - p_received_amount) > 0.01 then
    if v_submission.payment_status = 'pending' then
      update public.storyofus_submissions
      set
        payment_callback_received_at = p_received_at,
        payment_raw_callback = p_sanitized_payload,
        payment_error = 'amount_mismatch'
      where id = p_submission_id;
    end if;

    return query select 'amount_mismatch'::text;
    return;
  end if;

  if pg_catalog.upper(pg_catalog.btrim(v_submission.payment_currency)) is distinct from v_currency then
    if v_submission.payment_status = 'pending' then
      update public.storyofus_submissions
      set
        payment_callback_received_at = p_received_at,
        payment_raw_callback = p_sanitized_payload,
        payment_error = 'currency_mismatch'
      where id = p_submission_id;
    end if;

    return query select 'currency_mismatch'::text;
    return;
  end if;

  if v_submission.payment_status = 'paid' then
    if v_submission.payment_reference is distinct from v_payment_reference then
      return query select 'payment_conflict'::text;
      return;
    end if;

    if v_submission.payment_provider_event_id = v_event_id then
      return query select 'replayed'::text;
      return;
    end if;

    return query select 'already_paid'::text;
    return;
  end if;

  if v_submission.payment_status = 'pending'
    and (
      v_submission.payment_reference is not null
      or v_submission.payment_provider_event_id is not null
    ) then
    return query select 'payment_conflict'::text;
    return;
  end if;

  if v_submission.payment_status <> 'pending' then
    return query select 'payment_conflict'::text;
    return;
  end if;

  begin
    update public.storyofus_submissions
    set
      payment_status = 'paid',
      paid_at = coalesce(paid_at, p_received_at),
      payment_reference = v_payment_reference,
      payment_provider_event_id = v_event_id,
      payment_callback_received_at = p_received_at,
      payment_verified_at = p_received_at,
      payment_raw_callback = p_sanitized_payload,
      payment_error = null
    where id = p_submission_id;
  exception
    when unique_violation then
      select id
      into v_event_submission_id
      from public.storyofus_submissions
      where payment_provider = 'shopier'
        and payment_provider_event_id = v_event_id
      order by id
      for update;

      if v_event_submission_id = p_submission_id then
        return query select 'replayed'::text;
        return;
      end if;

      return query select 'event_conflict'::text;
      return;
  end;

  return query select 'applied'::text;
end;
$$;

revoke all privileges on function public.storyofus_apply_verified_shopier_payment(
  uuid,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  jsonb
)
from public, anon, authenticated;

grant execute on function public.storyofus_apply_verified_shopier_payment(
  uuid,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  jsonb
)
to service_role;

commit;
