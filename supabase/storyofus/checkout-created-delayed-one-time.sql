-- StoryOfUs one-time delayed checkout_created recovery package.
-- Do not run broadly. Replace the placeholder UUID with the single approved
-- submission id, review the dry run first, then run only the enqueue block.
-- The existing email worker sends the email after the pending outbox row is
-- created. This file intentionally contains no customer data.

-- 1) DRY RUN: read-only eligibility check for exactly one submission.
select
  submission.id as submission_id,
  submission.payment_status,
  submission.status as submission_status,
  submission.checkout_expires_at,
  submission.shopier_payment_url is not null as has_shopier_payment_url,
  exists (
    select 1
    from public.storyofus_email_outbox as outbox
    where outbox.submission_id = submission.id
      and outbox.email_type = 'checkout_created'
  ) as checkout_created_email_exists,
  case
    when submission.payment_status <> 'pending' then 'not_pending_payment'
    when submission.status <> 'draft' then 'not_draft'
    when submission.checkout_expires_at is null
      or submission.checkout_expires_at <= now() then 'checkout_expired'
    when submission.shopier_payment_url is null
      or pg_catalog.btrim(submission.shopier_payment_url) = '' then 'missing_shopier_payment_url'
    when submission.shopier_payment_url !~* '^https://(www\.)?shopier\.com/' then 'invalid_shopier_payment_url'
    when pg_catalog.lower(coalesce(submission.customer_email, '')) like '%qa%'
      or pg_catalog.lower(coalesce(submission.customer_name, '')) like '%test%'
      or pg_catalog.lower(coalesce(submission.order_reference, '')) like '%test%'
      then 'test_order'
    when exists (
      select 1
      from public.storyofus_email_outbox as outbox
      where outbox.submission_id = submission.id
        and outbox.email_type = 'checkout_created'
    ) then 'already_emailed_or_queued'
    else 'eligible'
  end as eligibility
from public.storyofus_submissions as submission
where submission.id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 2) ENQUEUE: mutating one-time recovery for exactly one approved submission.
-- Run only after the dry run returns eligibility = 'eligible'.
begin;

insert into public.storyofus_email_outbox (
  submission_id,
  email_type,
  event_key,
  status
)
select
  submission.id,
  'checkout_created',
  'storyofus:checkout_created:delayed:' || submission.id::text,
  'pending'
from public.storyofus_submissions as submission
where submission.id = '00000000-0000-0000-0000-000000000000'::uuid
  and submission.payment_status = 'pending'
  and submission.status = 'draft'
  and submission.checkout_expires_at is not null
  and submission.checkout_expires_at > now()
  and submission.shopier_payment_url is not null
  and pg_catalog.btrim(submission.shopier_payment_url) <> ''
  and submission.shopier_payment_url ~* '^https://(www\.)?shopier\.com/'
  and pg_catalog.lower(coalesce(submission.customer_email, '')) not like '%qa%'
  and pg_catalog.lower(coalesce(submission.customer_name, '')) not like '%test%'
  and pg_catalog.lower(coalesce(submission.order_reference, '')) not like '%test%'
  and not exists (
    select 1
    from public.storyofus_email_outbox as outbox
    where outbox.submission_id = submission.id
      and outbox.email_type = 'checkout_created'
  )
on conflict (submission_id, email_type) do nothing
returning id, submission_id, email_type, status, queued_at;

commit;
