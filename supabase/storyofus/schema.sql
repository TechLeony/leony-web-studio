-- StoryOfUs external Supabase schema

create extension if not exists "pgcrypto";

-- Automatically update updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Main submission table
create table if not exists public.storyofus_submissions (
  id uuid primary key default gen_random_uuid(),

  setup_token uuid not null default gen_random_uuid() unique,

  order_reference text,
  tracking_code text,
  customer_email text,
  customer_name text,
  contact_phone text,

  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_review', 'published', 'archived')),

  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at timestamptz,
  payment_provider text,
  payment_reference text,
  setup_link_sent_at timestamptz,
  payment_amount numeric(10,2),
  payment_currency text not null default 'TRY',
  payment_callback_received_at timestamptz,
  payment_raw_callback jsonb not null default '{}'::jsonb,
  payment_verified_at timestamptz,
  payment_error text,
  shopier_product_id text,
  shopier_payment_url text,
  shopier_product_created_at timestamptz,
  shopier_product_error text,
  payment_provider_event_id text,
  checkout_expires_at timestamptz,
  delivered_at timestamptz,
  final_site_url text,
  site_passcode_hash text,
  site_passcode_hint text,
  site_passcode_set_at timestamptz,

  confirmed_skips jsonb not null default '{}'::jsonb,
  legal_consents jsonb not null default '{}'::jsonb,
  checkout_consents jsonb not null default '{}'::jsonb,

  submission_snapshot jsonb not null default '{}'::jsonb,

  submitted_at timestamptz,
  editable_until timestamptz,
  last_resubmitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_storyofus_submissions_updated_at on public.storyofus_submissions;

create trigger set_storyofus_submissions_updated_at
before update on public.storyofus_submissions
for each row
execute function public.set_updated_at();

create unique index if not exists storyofus_submissions_order_reference_unique
on public.storyofus_submissions (order_reference)
where order_reference is not null;

create unique index if not exists storyofus_submissions_tracking_code_unique
on public.storyofus_submissions (tracking_code)
where tracking_code is not null;

create unique index if not exists storyofus_submissions_shopier_product_id_unique
on public.storyofus_submissions (shopier_product_id)
where shopier_product_id is not null;

create unique index if not exists storyofus_submissions_payment_provider_event_unique
on public.storyofus_submissions (payment_provider, payment_provider_event_id)
where payment_provider_event_id is not null;

-- Checkout rate-limit buckets. Raw IPs/emails are never stored here.
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

revoke all privileges on table public.storyofus_checkout_rate_limits
from public, anon, authenticated;

revoke all privileges on function public.storyofus_consume_checkout_rate_limit(text, text, text)
from public, anon, authenticated;

grant execute on function public.storyofus_consume_checkout_rate_limit(text, text, text)
to service_role;


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
      paid_at = pg_catalog.coalesce(paid_at, p_received_at),
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


-- Couple and contact details
create table if not exists public.storyofus_couple_details (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null unique
    references public.storyofus_submissions(id)
    on delete cascade,

  customer_name text,
  customer_email text,
  contact_phone text,

  partner_name text,
  couple_display_name text,

  relationship_start_date date,
  special_date_label text,

  recipient_nickname text,
  relationship_story text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_storyofus_couple_details_updated_at on public.storyofus_couple_details;

create trigger set_storyofus_couple_details_updated_at
before update on public.storyofus_couple_details
for each row
execute function public.set_updated_at();


-- Music details
create table if not exists public.storyofus_music (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null unique
    references public.storyofus_submissions(id)
    on delete cascade,

  spotify_url text,
  spotify_track_id text,

  song_title text,
  artist_name text,

  start_at_seconds integer not null default 0
    check (start_at_seconds >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_storyofus_music_updated_at on public.storyofus_music;

create trigger set_storyofus_music_updated_at
before update on public.storyofus_music
for each row
execute function public.set_updated_at();


-- Photos, puzzle photo and voice note records
create table if not exists public.storyofus_media (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null
    references public.storyofus_submissions(id)
    on delete cascade,

  media_type text not null
    check (media_type in ('photo', 'puzzle_photo', 'voice_note')),

  section text not null
    check (section in ('gallery', 'puzzle', 'voice_note')),

  storage_bucket text not null,
  storage_path text not null,

  original_filename text,
  mime_type text,
  size_bytes bigint,

  caption text,
  sort_order integer not null default 0,

  is_puzzle_source boolean not null default false,

  created_at timestamptz not null default now()
);

create unique index if not exists storyofus_one_puzzle_source_per_submission
on public.storyofus_media (submission_id)
where is_puzzle_source = true;


-- Timeline items
create table if not exists public.storyofus_timeline_items (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null
    references public.storyofus_submissions(id)
    on delete cascade,

  title text not null,
  event_date date,
  description text,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_storyofus_timeline_items_updated_at on public.storyofus_timeline_items;

create trigger set_storyofus_timeline_items_updated_at
before update on public.storyofus_timeline_items
for each row
execute function public.set_updated_at();


-- Love letter and open-when letters
create table if not exists public.storyofus_letters (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null
    references public.storyofus_submissions(id)
    on delete cascade,

  letter_type text not null
    check (letter_type in ('love_letter', 'open_when')),

  title text not null,
  body text not null,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_storyofus_letters_updated_at on public.storyofus_letters;

create trigger set_storyofus_letters_updated_at
before update on public.storyofus_letters
for each row
execute function public.set_updated_at();


-- Enable RLS.
-- Policies will be added in the next security step.
alter table public.storyofus_submissions enable row level security;
alter table public.storyofus_checkout_rate_limits enable row level security;
alter table public.storyofus_couple_details enable row level security;
alter table public.storyofus_music enable row level security;
alter table public.storyofus_media enable row level security;
alter table public.storyofus_timeline_items enable row level security;
alter table public.storyofus_letters enable row level security;
