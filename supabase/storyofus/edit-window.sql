-- StoryOfUs 3-hour setup edit window

alter table public.storyofus_submissions
add column if not exists editable_until timestamptz;

alter table public.storyofus_submissions
add column if not exists last_resubmitted_at timestamptz;

-- Optional safe checks after running this migration:
-- select id, order_reference, status, payment_status, submitted_at, editable_until, last_resubmitted_at
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 10;
