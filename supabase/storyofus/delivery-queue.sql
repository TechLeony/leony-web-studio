begin;

alter table public.storyofus_submissions
  add column if not exists delivery_queued_at timestamptz;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_catalog.pg_constraint
    where conrelid = 'public.storyofus_submissions'::pg_catalog.regclass
      and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) ilike '%status%'
      and pg_catalog.pg_get_constraintdef(oid) ilike '%draft%'
      and pg_catalog.pg_get_constraintdef(oid) ilike '%submitted%'
  loop
    execute pg_catalog.format(
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
      'queued_for_delivery',
      'published',
      'archived'
    )
  );

create index if not exists storyofus_submissions_delivery_queue_idx
on public.storyofus_submissions (delivery_queued_at, created_at, id)
where status = 'queued_for_delivery'
  and payment_status = 'paid';

create or replace function public.storyofus_queue_final_site_delivery(
  p_submission_id uuid
)
returns table (
  result text,
  status text,
  delivery_queued_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_submission public.storyofus_submissions%rowtype;
begin
  if p_submission_id is null then
    raise exception 'Invalid StoryOfUs queue input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions as submission
  where submission.id = p_submission_id
  for update;

  if not found then
    result := 'not_found';
    status := null;
    delivery_queued_at := null;
    return next;
    return;
  end if;

  if v_submission.status = 'queued_for_delivery' then
    result := 'already_queued';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  if v_submission.status = 'published' then
    result := 'not_queueable';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  if v_submission.payment_status <> 'paid'
    or v_submission.status <> 'in_review'
    or v_submission.review_ready_at is null
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) is null
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) > v_now
    or coalesce(v_submission.refund_status, 'none') not in ('none', 'rejected')
    or v_submission.site_passcode_hash is null
    or v_submission.site_passcode_hint is null
    or v_submission.site_passcode_set_at is null then
    result := 'not_queueable';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.storyofus_couple_details as couple_details
    where couple_details.submission_id = v_submission.id
  ) then
    result := 'missing_setup_data';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.storyofus_media as media
    where media.submission_id = v_submission.id
      and media.section = 'letter'
      and media.semantic_key = 'love_letter_side_photo'
      and media.section_item_id = 'loveLetterPhoto'
      and media.media_type = 'photo'
      and media.storage_bucket = 'storyofus-media'
      and media.storage_path is not null
      and media.storage_path <> ''
  ) then
    result := 'missing_setup_data';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  update public.storyofus_submissions as submission
  set
    status = 'queued_for_delivery',
    delivery_queued_at = coalesce(submission.delivery_queued_at, v_now),
    updated_at = v_now
  where submission.id = v_submission.id
    and submission.status = 'in_review'
    and submission.review_ready_at is not null
    and submission.payment_status = 'paid'
    and coalesce(submission.refund_request_until, submission.editable_until) is not null
    and coalesce(submission.refund_request_until, submission.editable_until) <= v_now
    and coalesce(submission.refund_status, 'none') in ('none', 'rejected')
  returning submission.status, submission.delivery_queued_at
  into status, delivery_queued_at;

  if not found then
    result := 'not_queueable';
    status := v_submission.status;
    delivery_queued_at := v_submission.delivery_queued_at;
    return next;
    return;
  end if;

  result := 'queued';
  return next;
end;
$$;

create or replace function public.storyofus_publish_final_site(
  p_submission_id uuid,
  p_final_site_slug text,
  p_final_site_url text,
  p_expected_status text default 'queued_for_delivery'
)
returns table (
  result text,
  final_site_slug text,
  final_site_url text,
  email_queued boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_submission public.storyofus_submissions%rowtype;
  v_slug text := pg_catalog.lower(pg_catalog.btrim(p_final_site_slug));
  v_url text := pg_catalog.btrim(p_final_site_url);
  v_origin text := 'https://leony.tech';
  v_email_inserted_count integer := 0;
begin
  if p_submission_id is null
    or v_slug is null
    or v_slug = ''
    or pg_catalog.length(v_slug) > 96
    or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or v_url is null
    or v_url = ''
    or v_url <> v_origin || '/storyofus/site/' || v_slug
    or p_expected_status is distinct from 'queued_for_delivery' then
    raise exception 'Invalid StoryOfUs publish input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions as submission
  where submission.id = p_submission_id
  for update;

  if not found then
    result := 'not_found';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  if v_submission.status = 'published' then
    result := 'already_published';
    final_site_slug := v_submission.final_site_slug;
    final_site_url := v_submission.final_site_url;
    email_queued := exists (
      select 1
      from public.storyofus_email_outbox as outbox
      where outbox.submission_id = v_submission.id
        and outbox.email_type = 'final_site_ready'
    );
    return next;
    return;
  end if;

  if v_submission.payment_status <> 'paid'
    or v_submission.status <> 'queued_for_delivery'
    or v_submission.delivery_queued_at is null
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) is null
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) > v_now
    or coalesce(v_submission.refund_status, 'none') not in ('none', 'rejected')
    or v_submission.site_passcode_hash is null
    or v_submission.site_passcode_hint is null
    or v_submission.site_passcode_set_at is null then
    result := 'not_publishable';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.storyofus_couple_details as couple_details
    where couple_details.submission_id = v_submission.id
  ) then
    result := 'missing_setup_data';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.storyofus_media as media
    where media.submission_id = v_submission.id
      and media.section = 'letter'
      and media.semantic_key = 'love_letter_side_photo'
      and media.section_item_id = 'loveLetterPhoto'
      and media.media_type = 'photo'
      and media.storage_bucket = 'storyofus-media'
      and media.storage_path is not null
      and media.storage_path <> ''
  ) then
    result := 'missing_setup_data';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  if exists (
    select 1
    from public.storyofus_submissions as existing_submission
    where existing_submission.final_site_slug = v_slug
      and existing_submission.id <> v_submission.id
  ) then
    result := 'slug_conflict';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  update public.storyofus_submissions as submission
  set
    status = 'published',
    final_site_slug = v_slug,
    final_site_url = v_url,
    delivered_at = v_now,
    updated_at = v_now
  where submission.id = v_submission.id
    and submission.status = 'queued_for_delivery'
    and submission.delivery_queued_at is not null
    and submission.payment_status = 'paid'
    and coalesce(submission.refund_request_until, submission.editable_until) is not null
    and coalesce(submission.refund_request_until, submission.editable_until) <= v_now
    and coalesce(submission.refund_status, 'none') in ('none', 'rejected');

  if not found then
    result := 'not_publishable';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  begin
    insert into public.storyofus_email_outbox (
      submission_id,
      email_type,
      event_key,
      status
    )
    values (
      v_submission.id,
      'final_site_ready',
      'storyofus:final_site_ready:' || v_submission.id::text,
      'pending'
    )
    on conflict (submission_id, email_type) do nothing;

    get diagnostics v_email_inserted_count = row_count;
  exception
    when others then
      v_email_inserted_count := 0;
  end;

  result := 'published';
  final_site_slug := v_slug;
  final_site_url := v_url;
  if v_email_inserted_count > 0 then
    email_queued := true;
  else
    email_queued := exists (
      select 1
      from public.storyofus_email_outbox as outbox
      where outbox.submission_id = v_submission.id
        and outbox.email_type = 'final_site_ready'
    );
  end if;
  return next;
end;
$$;

revoke all privileges on function public.storyofus_queue_final_site_delivery(uuid)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_publish_final_site(uuid, text, text, text)
from public, anon, authenticated;

grant execute on function public.storyofus_queue_final_site_delivery(uuid)
to service_role;

grant execute on function public.storyofus_publish_final_site(uuid, text, text, text)
to service_role;

grant select, update on table public.storyofus_submissions to service_role;
grant select on table public.storyofus_couple_details to service_role;
grant select on table public.storyofus_media to service_role;
grant select, insert on table public.storyofus_email_outbox to service_role;

commit;
