begin;

-- Repair legacy half-closed submitted orders without touching active editing,
-- refunded/cancelled, queued, published, archived, or already review-ready rows.
update public.storyofus_submissions as submission
set
  status = 'in_review',
  review_ready_at = coalesce(submission.review_ready_at, submission.editing_closed_at, now()),
  editing_closed_reason = coalesce(submission.editing_closed_reason, 'deadline_expired'),
  updated_at = now()
where submission.payment_status = 'paid'
  and submission.status = 'submitted'
  and submission.editing_closed_at is not null
  and submission.review_ready_at is null
  and coalesce(submission.refund_status, 'none') in ('none', 'rejected');

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
  from public.storyofus_submissions as submission
  where submission.payment_status = 'paid'
    and submission.status = 'submitted'
    and submission.editable_until is not null
    and submission.editable_until <= v_now
    and coalesce(submission.refund_status, 'none') in ('none', 'rejected')
    and submission.review_ready_at is null;

  if p_dry_run then
    eligible_count := v_eligible_count;
    promoted_count := 0;
    return next;
    return;
  end if;

  with eligible as (
    select submission.id
    from public.storyofus_submissions as submission
    where submission.payment_status = 'paid'
      and submission.status = 'submitted'
      and submission.editable_until is not null
      and submission.editable_until <= v_now
      and coalesce(submission.refund_status, 'none') in ('none', 'rejected')
      and submission.review_ready_at is null
    order by submission.editable_until asc, submission.created_at asc, submission.id asc
    limit v_batch_limit
    for update skip locked
  ),
  promoted as (
    update public.storyofus_submissions as submission
    set
      status = 'in_review',
      review_ready_at = coalesce(submission.review_ready_at, v_now),
      editing_closed_at = coalesce(submission.editing_closed_at, submission.editable_until, v_now),
      editing_closed_reason = coalesce(submission.editing_closed_reason, 'deadline_expired'),
      updated_at = v_now
    from eligible
    where submission.id = eligible.id
      and submission.payment_status = 'paid'
      and submission.status = 'submitted'
      and submission.editable_until is not null
      and submission.editable_until <= v_now
      and coalesce(submission.refund_status, 'none') in ('none', 'rejected')
      and submission.review_ready_at is null
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

commit;
