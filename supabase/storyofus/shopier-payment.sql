-- StoryOfUs Shopier payment matching support

alter table public.storyofus_submissions
add column if not exists payment_amount numeric(10,2);

alter table public.storyofus_submissions
add column if not exists payment_currency text not null default 'TRY';

alter table public.storyofus_submissions
add column if not exists payment_callback_received_at timestamptz;

alter table public.storyofus_submissions
add column if not exists payment_raw_callback jsonb not null default '{}'::jsonb;

alter table public.storyofus_submissions
add column if not exists payment_verified_at timestamptz;

alter table public.storyofus_submissions
add column if not exists payment_error text;

alter table public.storyofus_submissions
add column if not exists checkout_expires_at timestamptz;

-- View recent Shopier checkout orders:
-- select
--   id,
--   order_reference,
--   customer_name,
--   customer_email,
--   payment_status,
--   payment_amount,
--   payment_currency,
--   payment_provider,
--   payment_reference,
--   payment_callback_received_at,
--   payment_verified_at,
--   payment_error,
--   created_at
-- from public.storyofus_submissions
-- where payment_provider = 'shopier'
-- order by created_at desc
-- limit 20;

-- Reset QA order back to pending:
-- update public.storyofus_submissions
-- set payment_status = 'pending',
--     paid_at = null,
--     payment_reference = null,
--     payment_callback_received_at = null,
--     payment_verified_at = null,
--     payment_raw_callback = '{}'::jsonb,
--     payment_error = null
-- where order_reference = 'PASTE_ORDER_REFERENCE_HERE'
-- returning order_reference, payment_status;
