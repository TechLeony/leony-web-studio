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
  checkout_expires_at timestamptz,

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
alter table public.storyofus_couple_details enable row level security;
alter table public.storyofus_music enable row level security;
alter table public.storyofus_media enable row level security;
alter table public.storyofus_timeline_items enable row level security;
alter table public.storyofus_letters enable row level security;
