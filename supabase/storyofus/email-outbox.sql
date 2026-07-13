-- StoryOfUs email outbox foundation.
-- Email rows are created only by trusted server-side workflows.
-- No public or anon policies are added here.

create table if not exists public.storyofus_email_outbox (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null
    references public.storyofus_submissions(id)
    on delete cascade,

  email_type text not null
    check (email_type in ('order_created', 'final_site_ready')),

  event_key text not null unique,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry_scheduled', 'sent', 'dead')),

  attempt_count integer not null default 0
    check (attempt_count >= 0),

  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  lock_token uuid,
  provider_message_id text,
  last_error_code text,
  last_error_safe_message text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (submission_id, email_type)
);

drop trigger if exists set_storyofus_email_outbox_updated_at
on public.storyofus_email_outbox;

create trigger set_storyofus_email_outbox_updated_at
before update on public.storyofus_email_outbox
for each row
execute function public.set_updated_at();

create index if not exists storyofus_email_outbox_processable_idx
on public.storyofus_email_outbox (status, next_attempt_at);

create index if not exists storyofus_email_outbox_submission_id_idx
on public.storyofus_email_outbox (submission_id);

create unique index if not exists storyofus_email_outbox_provider_message_id_idx
on public.storyofus_email_outbox (provider_message_id)
where provider_message_id is not null;

alter table public.storyofus_email_outbox enable row level security;

revoke all privileges
on table public.storyofus_email_outbox
from public, anon, authenticated;

grant usage on schema public to service_role;

revoke all privileges
on table public.storyofus_email_outbox
from service_role;

grant select, insert, update, delete
on table public.storyofus_email_outbox
to service_role;