-- StoryOfUs checkout-created pending order support

alter table public.storyofus_submissions
add column if not exists checkout_consents jsonb not null default '{}'::jsonb;

create unique index if not exists storyofus_submissions_order_reference_unique
on public.storyofus_submissions (order_reference)
where order_reference is not null;

-- View recent checkout-created pending orders:
-- select
--   id,
--   order_reference,
--   customer_name,
--   customer_email,
--   contact_phone,
--   payment_status,
--   status,
--   payment_provider,
--   checkout_consents,
--   created_at
-- from public.storyofus_submissions
-- where payment_provider = 'shopier'
-- order by created_at desc
-- limit 10;

-- Manually mark an order as paid for QA:
-- update public.storyofus_submissions
-- set payment_status = 'paid',
--     paid_at = now(),
--     payment_reference = order_reference
-- where order_reference = 'PASTE_ORDER_REFERENCE_HERE'
-- returning setup_token, order_reference, payment_status, status;
