-- StoryOfUs customer order tracking support

alter table public.storyofus_submissions
add column if not exists tracking_code text;

alter table public.storyofus_submissions
add column if not exists delivered_at timestamptz;

alter table public.storyofus_submissions
add column if not exists final_site_url text;

create unique index if not exists storyofus_submissions_tracking_code_unique
on public.storyofus_submissions (tracking_code)
where tracking_code is not null;

-- View recent tracking orders:
-- select
--   id,
--   tracking_code,
--   order_reference,
--   customer_email,
--   contact_phone,
--   payment_status,
--   status,
--   setup_link_sent_at,
--   paid_at,
--   submitted_at,
--   editable_until,
--   delivered_at,
--   final_site_url,
--   created_at
-- from public.storyofus_submissions
-- where tracking_code is not null
-- order by created_at desc
-- limit 20;

-- Mark a QA order as delivered:
-- update public.storyofus_submissions
-- set status = 'published',
--     delivered_at = now(),
--     final_site_url = 'https://leony.tech/storyofus/site/qa-example-abc123'
-- where tracking_code = 'PASTE_TRACKING_CODE_HERE'
-- returning tracking_code, status, delivered_at, final_site_url;
