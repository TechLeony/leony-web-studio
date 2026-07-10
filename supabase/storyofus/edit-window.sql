-- StoryOfUs 3-hour setup edit window

alter table public.storyofus_submissions
add column if not exists editable_until timestamptz;

alter table public.storyofus_submissions
add column if not exists last_resubmitted_at timestamptz;

-- QA helper A: make a submitted token editable:
-- update public.storyofus_submissions
-- set status = 'submitted',
--     submitted_at = now(),
--     editable_until = now() + interval '3 hours'
-- where payment_reference = 'manual-qa-001'
-- returning setup_token, editable_until;

-- QA helper B: make a submitted token expired:
-- update public.storyofus_submissions
-- set status = 'submitted',
--     submitted_at = now() - interval '4 hours',
--     editable_until = now() - interval '1 hour'
-- where payment_reference = 'manual-qa-001'
-- returning setup_token, editable_until;

-- Optional QA checks after running this migration:
-- select id, status, payment_status, submitted_at, editable_until, last_resubmitted_at
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 10;
