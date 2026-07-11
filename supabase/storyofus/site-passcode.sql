-- StoryOfUs final site 4-digit passcode support

alter table public.storyofus_submissions
add column if not exists site_passcode_hash text;

alter table public.storyofus_submissions
add column if not exists site_passcode_hint text;

alter table public.storyofus_submissions
add column if not exists site_passcode_set_at timestamptz;

-- Check recent passcode state without exposing raw passcode:
-- select
--   order_reference,
--   status,
--   site_passcode_hash is not null as has_passcode_hash,
--   site_passcode_hint,
--   site_passcode_set_at,
--   submitted_at,
--   editable_until
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 10;
