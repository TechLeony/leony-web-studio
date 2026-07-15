alter table public.storyofus_submissions
add column if not exists legal_consents jsonb not null default '{}'::jsonb;
