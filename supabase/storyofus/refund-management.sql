-- StoryOfUs refund management fields.
-- Refund mutations should be handled only by trusted server/admin workflows.
-- No public or anon update policies are added here.

alter table public.storyofus_submissions
add column if not exists refund_status text not null default 'none',
add column if not exists refund_requested_at timestamptz,
add column if not exists refund_decided_at timestamptz,
add column if not exists refunded_at timestamptz,
add column if not exists refund_reference text,
add column if not exists refund_reason text,
add column if not exists refund_amount numeric(12,2),
add column if not exists refund_currency text,
add column if not exists refund_note text,
add column if not exists refund_policy_version text,
add column if not exists service_start_consent jsonb not null default '{}'::jsonb,
add column if not exists service_started_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storyofus_submissions_refund_status_check'
      and conrelid = 'public.storyofus_submissions'::regclass
  ) then
    alter table public.storyofus_submissions
    add constraint storyofus_submissions_refund_status_check
    check (
      refund_status in (
        'none',
        'requested',
        'under_review',
        'approved',
        'rejected',
        'processing',
        'refunded',
        'failed'
      )
    );
  end if;
end;
$$;

create index if not exists storyofus_submissions_refund_status_idx
on public.storyofus_submissions (refund_status);

-- Safe inspection example:
-- select
--   order_reference,
--   tracking_code,
--   payment_status,
--   status,
--   refund_status,
--   submitted_at,
--   editable_until,
--   refund_requested_at
-- from public.storyofus_submissions
-- order by created_at desc
-- limit 20;
