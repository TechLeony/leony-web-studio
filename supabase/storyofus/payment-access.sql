-- StoryOfUs payment-gated setup access fields

alter table public.storyofus_submissions
add column if not exists payment_status text not null default 'pending',
add column if not exists paid_at timestamptz,
add column if not exists payment_provider text,
add column if not exists payment_reference text,
add column if not exists setup_link_sent_at timestamptz;

alter table public.storyofus_submissions
drop constraint if exists storyofus_submissions_payment_status_check;

alter table public.storyofus_submissions
add constraint storyofus_submissions_payment_status_check
check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- Safe inspection only:
-- select
--   id,
--   order_reference,
--   customer_email,
--   payment_status,
--   status,
--   paid_at,
--   setup_link_sent_at,
--   created_at
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 20;
