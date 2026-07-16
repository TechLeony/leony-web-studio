-- StoryOfUs per-order Shopier product and webhook mapping

alter table public.storyofus_submissions
add column if not exists shopier_product_id text;

alter table public.storyofus_submissions
add column if not exists shopier_payment_url text;

alter table public.storyofus_submissions
add column if not exists shopier_product_created_at timestamptz;

alter table public.storyofus_submissions
add column if not exists shopier_product_error text;

alter table public.storyofus_submissions
add column if not exists payment_provider_event_id text;

create unique index if not exists storyofus_submissions_shopier_product_id_unique
on public.storyofus_submissions (shopier_product_id)
where shopier_product_id is not null;

create unique index if not exists storyofus_submissions_payment_provider_event_unique
on public.storyofus_submissions (payment_provider, payment_provider_event_id)
where payment_provider_event_id is not null;

-- Safe inspection:
-- select
--   order_reference,
--   payment_status,
--   shopier_product_id,
--   shopier_payment_url,
--   shopier_product_created_at,
--   shopier_product_error,
--   payment_provider_event_id
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 20;
