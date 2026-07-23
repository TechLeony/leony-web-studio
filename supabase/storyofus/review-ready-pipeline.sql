begin;

-- Phase 1A: review-ready foundation for submitted StoryOfUs orders.
-- This migration is additive and does not publish, deliver, or email final sites.

alter table public.storyofus_submissions
  add column if not exists review_ready_at timestamptz;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.storyofus_submissions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
      and pg_get_constraintdef(oid) ilike '%draft%'
      and pg_get_constraintdef(oid) ilike '%submitted%'
  loop
    execute format(
      'alter table public.storyofus_submissions drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.storyofus_submissions
  add constraint storyofus_submissions_status_check
  check (
    status in (
      'draft',
      'submitted',
      'in_review',
      'published',
      'archived'
    )
  );

create index if not exists storyofus_submissions_review_ready_eligibility_idx
on public.storyofus_submissions (editable_until, created_at)
where status = 'submitted'
  and payment_status = 'paid';

create or replace function public.storyofus_promote_review_ready_orders(
  p_batch_limit integer default 50,
  p_dry_run boolean default false
)
returns table (
  eligible_count integer,
  promoted_count integer
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_batch_limit integer := least(greatest(coalesce(p_batch_limit, 50), 1), 100);
  v_eligible_count integer := 0;
  v_promoted_count integer := 0;
begin
  select pg_catalog.count(*)::integer
  into v_eligible_count
  from public.storyofus_submissions
  where payment_status = 'paid'
    and status = 'submitted'
    and editable_until is not null
    and editable_until <= v_now
    and coalesce(refund_status, 'none') in ('none', 'rejected');

  if p_dry_run then
    eligible_count := v_eligible_count;
    promoted_count := 0;
    return next;
    return;
  end if;

  with eligible as (
    select id
    from public.storyofus_submissions
    where payment_status = 'paid'
      and status = 'submitted'
      and editable_until is not null
      and editable_until <= v_now
      and coalesce(refund_status, 'none') in ('none', 'rejected')
    order by editable_until asc, created_at asc, id asc
    limit v_batch_limit
    for update skip locked
  ),
  promoted as (
    update public.storyofus_submissions as submission
    set
      status = 'in_review',
      review_ready_at = coalesce(submission.review_ready_at, v_now),
      updated_at = v_now
    from eligible
    where submission.id = eligible.id
      and submission.payment_status = 'paid'
      and submission.status = 'submitted'
      and submission.editable_until is not null
      and submission.editable_until <= v_now
      and coalesce(submission.refund_status, 'none') in ('none', 'rejected')
    returning submission.id
  )
  select pg_catalog.count(*)::integer
  into v_promoted_count
  from promoted;

  eligible_count := v_eligible_count;
  promoted_count := v_promoted_count;
  return next;
end;
$$;

revoke all privileges on function public.storyofus_promote_review_ready_orders(integer, boolean)
from public, anon, authenticated;

grant execute on function public.storyofus_promote_review_ready_orders(integer, boolean)
to service_role;

grant select, update on table public.storyofus_submissions to service_role;

-- Safe dry-run inspection. Returns aggregate counts only.
-- select * from public.storyofus_promote_review_ready_orders(50, true);

-- Controlled backfill. Uses the same guarded, idempotent transition as the worker.
-- select * from public.storyofus_promote_review_ready_orders(50, false);

commit;

-- Operational Supabase Cron setup to run separately after deployment.
-- Do not store the secret in this file. Store it in Supabase Vault first.
--
-- select vault.create_secret(
--   '<STORYOFUS_EMAIL_WORKER_SECRET value>',
--   'storyofus_review_ready_worker_secret'
-- );
--
-- select cron.schedule(
--   'storyofus-review-ready-worker-every-5-minutes',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://leony.tech/api/internal/storyofus/review-ready-worker',
--     headers := jsonb_build_object(
--       'Authorization',
--       'Bearer ' || (
--         select decrypted_secret
--         from vault.decrypted_secrets
--         where name = 'storyofus_review_ready_worker_secret'
--         limit 1
--       ),
--       'Content-Type',
--       'application/json'
--     ),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 10000
--   );
--   $$
-- );
