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

-- Manual QA paid setup link:
-- insert into public.storyofus_submissions (
--   payment_status,
--   status,
--   customer_email,
--   customer_name,
--   contact_phone,
--   paid_at,
--   payment_provider,
--   payment_reference,
--   order_reference
-- )
-- values (
--   'paid',
--   'draft',
--   'qa-token@example.com',
--   'QA Token Customer',
--   '+905321234567',
--   now(),
--   'manual',
--   'manual-qa-001',
--   'manual-qa-001'
-- )
-- returning setup_token;
