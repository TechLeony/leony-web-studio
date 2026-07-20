begin;

create or replace function public.storyofus_publish_final_site(
  p_submission_id uuid,
  p_final_site_slug text,
  p_final_site_url text,
  p_expected_status text default 'in_review'
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
    or p_expected_status is distinct from 'in_review' then
    raise exception 'Invalid StoryOfUs publish input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions
  where id = p_submission_id
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
      from public.storyofus_email_outbox
      where submission_id = v_submission.id
        and email_type = 'final_site_ready'
    );
    return next;
    return;
  end if;

  if v_submission.payment_status <> 'paid'
    or v_submission.status <> 'in_review'
    or v_submission.editable_until is null
    or v_submission.editable_until > v_now
    or pg_catalog.coalesce(v_submission.refund_status, 'none') not in ('none', 'rejected')
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
    from public.storyofus_couple_details
    where submission_id = v_submission.id
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
    from public.storyofus_submissions
    where final_site_slug = v_slug
      and id <> v_submission.id
  ) then
    result := 'slug_conflict';
    final_site_slug := null;
    final_site_url := null;
    email_queued := false;
    return next;
    return;
  end if;

  update public.storyofus_submissions
  set
    status = 'published',
    final_site_slug = v_slug,
    final_site_url = v_url,
    delivered_at = v_now,
    updated_at = v_now
  where id = v_submission.id
    and status = 'in_review'
    and payment_status = 'paid'
    and editable_until is not null
    and editable_until <= v_now
    and pg_catalog.coalesce(refund_status, 'none') in ('none', 'rejected');

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
      from public.storyofus_email_outbox
      where submission_id = v_submission.id
        and email_type = 'final_site_ready'
    );
  end if;
  return next;
end;
$$;

revoke all privileges on function public.storyofus_publish_final_site(uuid, text, text, text)
from public, anon, authenticated;

grant execute on function public.storyofus_publish_final_site(uuid, text, text, text)
to service_role;

commit;
