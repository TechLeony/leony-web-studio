begin;

-- Phase 2A: atomic setup finalization, two-edit backend enforcement, and
-- separate refund request deadline tracking.
--
-- Backfill policy:
-- - Existing editable_until values are copied to refund_request_until when the
--   new field is empty. This preserves the original customer-facing deadline
--   without extending any historical window.
-- - Historical submitted/in_review/published/archived rows are not reopened.
--   Rows whose edit window is already closed are marked with an informational
--   editing_closed_at/reason when that can be derived safely.
-- - Historical edit usage is not invented; edits_used remains the non-negative
--   default unless future guarded submissions increment it.

alter table public.storyofus_submissions
  add column if not exists edit_limit integer not null default 2,
  add column if not exists edits_used integer not null default 0,
  add column if not exists editing_closed_at timestamptz,
  add column if not exists editing_closed_reason text,
  add column if not exists refund_request_until timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.storyofus_submissions'::regclass
      and conname = 'storyofus_submissions_edit_limit_positive_check'
  ) then
    alter table public.storyofus_submissions
      add constraint storyofus_submissions_edit_limit_positive_check
      check (edit_limit > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.storyofus_submissions'::regclass
      and conname = 'storyofus_submissions_edits_used_nonnegative_check'
  ) then
    alter table public.storyofus_submissions
      add constraint storyofus_submissions_edits_used_nonnegative_check
      check (edits_used >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.storyofus_submissions'::regclass
      and conname = 'storyofus_submissions_edits_used_limit_check'
  ) then
    alter table public.storyofus_submissions
      add constraint storyofus_submissions_edits_used_limit_check
      check (edits_used <= edit_limit);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.storyofus_submissions'::regclass
      and conname = 'storyofus_submissions_editing_closed_reason_check'
  ) then
    alter table public.storyofus_submissions
      add constraint storyofus_submissions_editing_closed_reason_check
      check (
        editing_closed_reason is null
        or editing_closed_reason in (
          'edit_limit_reached',
          'deadline_expired',
          'admin_locked'
        )
      );
  end if;
end $$;

update public.storyofus_submissions
set refund_request_until = editable_until
where refund_request_until is null
  and editable_until is not null;

update public.storyofus_submissions
set
  editing_closed_at = editable_until,
  editing_closed_reason = 'deadline_expired'
where editing_closed_at is null
  and editing_closed_reason is null
  and editable_until is not null
  and editable_until <= pg_catalog.now()
  and status in ('submitted', 'in_review', 'published', 'archived');

create index if not exists storyofus_submissions_edit_access_idx
on public.storyofus_submissions (setup_token, status, editable_until, edits_used, edit_limit)
where payment_status = 'paid';

create index if not exists storyofus_submissions_refund_request_until_idx
on public.storyofus_submissions (refund_request_until)
where refund_request_until is not null;

create or replace function public.storyofus_finalize_setup_submission(
  p_setup_token text,
  p_submission_snapshot jsonb,
  p_site_passcode_hash text,
  p_site_passcode_hint text,
  p_site_passcode_set_at timestamptz,
  p_service_start_consent jsonb default null
)
returns table (
  submission_id uuid,
  setup_token uuid,
  status text,
  submission_kind text,
  edits_used integer,
  edit_limit integer,
  editable_until timestamptz,
  refund_request_until timestamptz,
  editing_closed_at timestamptz,
  editing_closed_reason text,
  review_ready_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_submission public.storyofus_submissions%rowtype;
  v_snapshot jsonb := pg_catalog.coalesce(p_submission_snapshot, '{}'::jsonb);
  v_contact jsonb := pg_catalog.coalesce(v_snapshot -> 'contactCouple', '{}'::jsonb);
  v_media jsonb := pg_catalog.coalesce(v_snapshot -> 'media', '{}'::jsonb);
  v_music_voice jsonb := pg_catalog.coalesce(v_snapshot -> 'musicVoice', '{}'::jsonb);
  v_music jsonb := pg_catalog.coalesce(v_music_voice -> 'music', '{}'::jsonb);
  v_voice_note jsonb := v_music_voice -> 'voiceNote';
  v_confirmed_skips jsonb := pg_catalog.coalesce(v_snapshot -> 'confirmedSkips', '{}'::jsonb);
  v_legal_consents jsonb := pg_catalog.coalesce(v_snapshot -> 'legalConsents', '{}'::jsonb);
  v_effective_editable_until timestamptz;
  v_next_editable_until timestamptz;
  v_next_refund_until timestamptz;
  v_next_edits_used integer;
  v_next_status text;
  v_submission_kind text;
  v_next_review_ready_at timestamptz;
  v_next_editing_closed_at timestamptz;
  v_next_editing_closed_reason text;
begin
  if p_setup_token is null
    or pg_catalog.btrim(p_setup_token) = ''
    or p_submission_snapshot is null
    or p_site_passcode_hash is null
    or pg_catalog.btrim(p_site_passcode_hash) = ''
    or p_site_passcode_hint is null
    or pg_catalog.btrim(p_site_passcode_hint) = ''
    or p_site_passcode_set_at is null then
    raise exception 'Invalid StoryOfUs setup finalization input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions
  where setup_token = pg_catalog.btrim(p_setup_token)::uuid
  for update;

  if not found then
    raise exception 'StoryOfUs setup link is invalid or could not be found.';
  end if;

  if v_submission.payment_status <> 'paid' then
    raise exception 'StoryOfUs setup form is not active until payment is approved.';
  end if;

  if pg_catalog.coalesce(v_submission.refund_status, 'none') in (
    'requested',
    'under_review',
    'approved',
    'processing',
    'refunded'
  ) then
    raise exception 'This setup form is not editable while refund review is active.';
  end if;

  if v_submission.status = 'draft' then
    v_submission_kind := 'first_submit';
    v_next_editable_until := v_now + interval '3 hours';
    v_next_refund_until := v_next_editable_until;
    v_next_edits_used := 0;
    v_next_status := 'submitted';
    v_next_review_ready_at := null;
    v_next_editing_closed_at := null;
    v_next_editing_closed_reason := null;
  elsif v_submission.status = 'submitted' then
    v_effective_editable_until := v_submission.editable_until;

    if v_effective_editable_until is null
      or v_effective_editable_until <= v_now
      or v_submission.editing_closed_at is not null then
      raise exception 'This setup form has already been submitted or is not editable.';
    end if;

    if v_submission.edits_used >= v_submission.edit_limit then
      raise exception 'This setup form has reached its edit limit.';
    end if;

    v_next_edits_used := v_submission.edits_used + 1;
    v_next_editable_until := v_submission.editable_until;
    v_next_refund_until := pg_catalog.coalesce(
      v_submission.refund_request_until,
      v_submission.editable_until
    );

    if v_next_edits_used >= v_submission.edit_limit then
      v_submission_kind := 'edit_limit_reached';
      v_next_status := 'in_review';
      v_next_review_ready_at := pg_catalog.coalesce(v_submission.review_ready_at, v_now);
      v_next_editing_closed_at := pg_catalog.coalesce(v_submission.editing_closed_at, v_now);
      v_next_editing_closed_reason := 'edit_limit_reached';
    else
      v_submission_kind := 'edit_submit';
      v_next_status := 'submitted';
      v_next_review_ready_at := null;
      v_next_editing_closed_at := null;
      v_next_editing_closed_reason := null;
    end if;
  else
    raise exception 'This setup form has already been submitted or is not editable.';
  end if;

  if v_submission.status = 'draft'
    and (
      p_service_start_consent is null
      or p_service_start_consent ->> 'accepted' is distinct from 'true'
    ) then
    raise exception 'Service start consent is required.';
  end if;

  perform public.storyofus_validate_finalization_media(v_submission.id, v_snapshot);

  delete from public.storyofus_couple_details
  where submission_id = v_submission.id;

  delete from public.storyofus_music
  where submission_id = v_submission.id;

  delete from public.storyofus_timeline_items
  where submission_id = v_submission.id;

  delete from public.storyofus_letters
  where submission_id = v_submission.id;

  if v_confirmed_skips #>> '{photos,confirmed}' = 'true' then
    delete from public.storyofus_media
    where submission_id = v_submission.id
      and section = 'gallery';
  end if;

  if v_confirmed_skips #>> '{puzzle,confirmed}' = 'true' then
    delete from public.storyofus_media
    where submission_id = v_submission.id
      and section = 'puzzle';
  end if;

  if v_confirmed_skips #>> '{voiceNote,confirmed}' = 'true' then
    delete from public.storyofus_media
    where submission_id = v_submission.id
      and section = 'voice_note';
  end if;

  update public.storyofus_media
  set is_puzzle_source = false
  where submission_id = v_submission.id
    and is_puzzle_source = true;

  insert into public.storyofus_couple_details (
    submission_id,
    customer_name,
    customer_email,
    contact_phone,
    partner_name,
    couple_display_name,
    relationship_start_date,
    special_date_label,
    recipient_nickname,
    relationship_story
  )
  values (
    v_submission.id,
    public.storyofus_empty_to_null(v_contact ->> 'customerName'),
    public.storyofus_empty_to_null(v_contact ->> 'customerEmail'),
    public.storyofus_empty_to_null(v_contact ->> 'contactPhone'),
    public.storyofus_empty_to_null(v_contact ->> 'partnerName'),
    public.storyofus_empty_to_null(v_contact ->> 'coupleDisplayName'),
    public.storyofus_to_date(v_contact ->> 'relationshipStartDate'),
    public.storyofus_empty_to_null(v_contact ->> 'specialDateLabel'),
    public.storyofus_empty_to_null(v_contact ->> 'recipientNickname'),
    public.storyofus_empty_to_null(v_contact ->> 'relationshipStory')
  );

  if v_confirmed_skips #>> '{music,confirmed}' is distinct from 'true'
    and (
      public.storyofus_empty_to_null(v_music ->> 'spotifyUrl') is not null
      or public.storyofus_empty_to_null(v_music ->> 'songTitle') is not null
      or public.storyofus_empty_to_null(v_music ->> 'artistName') is not null
    ) then
    insert into public.storyofus_music (
      submission_id,
      spotify_url,
      spotify_track_id,
      song_title,
      artist_name,
      start_at_seconds
    )
    values (
      v_submission.id,
      public.storyofus_empty_to_null(v_music ->> 'spotifyUrl'),
      public.storyofus_empty_to_null(v_music ->> 'spotifyTrackId'),
      public.storyofus_empty_to_null(v_music ->> 'songTitle'),
      public.storyofus_empty_to_null(v_music ->> 'artistName'),
      public.storyofus_to_nonnegative_integer(v_music ->> 'startAtSeconds')
    );
  end if;

  perform public.storyofus_apply_media_metadata(v_submission.id, v_snapshot);

  if v_confirmed_skips #>> '{timeline,confirmed}' is distinct from 'true' then
    insert into public.storyofus_timeline_items (
      submission_id,
      title,
      event_date,
      description,
      sort_order
    )
    select
      v_submission.id,
      public.storyofus_empty_to_null(item.value ->> 'title'),
      public.storyofus_to_date(item.value ->> 'eventDate'),
      public.storyofus_empty_to_null(item.value ->> 'description'),
      public.storyofus_to_nonnegative_integer(item.value ->> 'sortOrder')
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(v_snapshot -> 'timeline') = 'array'
          then v_snapshot -> 'timeline'
        else '[]'::jsonb
      end
    ) as item(value)
    where public.storyofus_empty_to_null(item.value ->> 'title') is not null;
  end if;

  insert into public.storyofus_letters (
    submission_id,
    letter_type,
    title,
    body,
    sort_order
  )
  select
    v_submission.id,
    case when item.value ->> 'type' = 'love_letter' then 'love_letter' else 'open_when' end,
    pg_catalog.coalesce(public.storyofus_empty_to_null(item.value ->> 'title'), 'Mektup'),
    pg_catalog.coalesce(public.storyofus_empty_to_null(item.value ->> 'body'), ''),
    public.storyofus_to_nonnegative_integer(item.value ->> 'sortOrder')
  from pg_catalog.jsonb_array_elements(
    case
      when pg_catalog.jsonb_typeof(v_snapshot -> 'letters') = 'array'
        then v_snapshot -> 'letters'
      else '[]'::jsonb
    end
  ) as item(value);

  update public.storyofus_submissions as updated_submission
  set
    order_reference = public.storyofus_empty_to_null(v_snapshot ->> 'orderReference'),
    customer_email = public.storyofus_empty_to_null(v_contact ->> 'customerEmail'),
    customer_name = public.storyofus_empty_to_null(v_contact ->> 'customerName'),
    contact_phone = public.storyofus_empty_to_null(v_contact ->> 'contactPhone'),
    status = v_next_status,
    confirmed_skips = v_confirmed_skips,
    legal_consents = v_legal_consents,
    submission_snapshot = v_snapshot,
    submitted_at = case
      when v_submission.status = 'draft' then v_now
      else v_submission.submitted_at
    end,
    editable_until = v_next_editable_until,
    refund_request_until = v_next_refund_until,
    edit_limit = v_submission.edit_limit,
    edits_used = v_next_edits_used,
    editing_closed_at = v_next_editing_closed_at,
    editing_closed_reason = v_next_editing_closed_reason,
    review_ready_at = v_next_review_ready_at,
    service_start_consent = case
      when v_submission.status = 'draft' then p_service_start_consent
      else updated_submission.service_start_consent
    end,
    last_resubmitted_at = case
      when v_submission.status = 'draft' then null
      else v_now
    end,
    site_passcode_hash = p_site_passcode_hash,
    site_passcode_hint = public.storyofus_empty_to_null(p_site_passcode_hint),
    site_passcode_set_at = p_site_passcode_set_at,
    updated_at = v_now
  where updated_submission.id = v_submission.id
  returning
    updated_submission.id,
    updated_submission.setup_token,
    updated_submission.status,
    updated_submission.edits_used,
    updated_submission.edit_limit,
    updated_submission.editable_until,
    updated_submission.refund_request_until,
    updated_submission.editing_closed_at,
    updated_submission.editing_closed_reason,
    updated_submission.review_ready_at
  into
    submission_id,
    setup_token,
    status,
    edits_used,
    edit_limit,
    editable_until,
    refund_request_until,
    editing_closed_at,
    editing_closed_reason,
    review_ready_at;

  submission_kind := v_submission_kind;
  return next;
end;
$$;

create or replace function public.storyofus_empty_to_null(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select nullif(pg_catalog.btrim(p_value), '')
$$;

create or replace function public.storyofus_to_date(p_value text)
returns date
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  if p_value is null or pg_catalog.btrim(p_value) = '' then
    return null;
  end if;

  return p_value::date;
exception
  when others then
    return null;
end;
$$;

create or replace function public.storyofus_to_nonnegative_integer(p_value text)
returns integer
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_number integer;
begin
  if p_value is null or pg_catalog.btrim(p_value) = '' then
    return 0;
  end if;

  v_number := p_value::integer;
  return pg_catalog.greatest(v_number, 0);
exception
  when others then
    return 0;
end;
$$;

create or replace function public.storyofus_validate_media_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  if p_value is null
    or p_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'StoryOfUs durable media is required.';
  end if;

  return p_value::uuid;
end;
$$;

create or replace function public.storyofus_require_media_row(
  p_submission_id uuid,
  p_media_id text,
  p_section text,
  p_semantic_key text,
  p_section_item_id text,
  p_media_type text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_media_id uuid := public.storyofus_validate_media_uuid(p_media_id);
begin
  if not exists (
    select 1
    from public.storyofus_media
    where id = v_media_id
      and submission_id = p_submission_id
      and section = p_section
      and semantic_key = p_semantic_key
      and section_item_id = p_section_item_id
      and media_type = p_media_type
      and storage_bucket = 'storyofus-media'
      and storage_path is not null
      and storage_path <> ''
      and storage_path not like 'blob:%'
      and storage_path not like 'http://%'
      and storage_path not like 'https://%'
      and storage_path not like 'data:%'
  ) then
    raise exception 'StoryOfUs durable media is required.';
  end if;
end;
$$;

create or replace function public.storyofus_validate_finalization_media(
  p_submission_id uuid,
  p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_media jsonb := pg_catalog.coalesce(p_snapshot -> 'media', '{}'::jsonb);
  v_confirmed_skips jsonb := pg_catalog.coalesce(p_snapshot -> 'confirmedSkips', '{}'::jsonb);
  v_music_voice jsonb := pg_catalog.coalesce(p_snapshot -> 'musicVoice', '{}'::jsonb);
  v_photo jsonb;
  v_item jsonb;
  v_gallery_match jsonb;
begin
  v_photo := v_media #> '{openingPhotos,firstPerson}';
  if v_photo is not null and v_photo <> 'null'::jsonb then
    perform public.storyofus_require_media_row(
      p_submission_id,
      v_photo ->> 'mediaId',
      'opening',
      'hero_left',
      'firstPerson',
      'photo'
    );
  end if;

  v_photo := v_media #> '{openingPhotos,secondPerson}';
  if v_photo is not null and v_photo <> 'null'::jsonb then
    perform public.storyofus_require_media_row(
      p_submission_id,
      v_photo ->> 'mediaId',
      'opening',
      'hero_right',
      'secondPerson',
      'photo'
    );
  end if;

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(v_media -> 'promptPhotos') = 'array'
          then v_media -> 'promptPhotos'
        else '[]'::jsonb
      end
    )
  loop
    v_photo := v_item -> 'photo';
    if v_photo is not null and v_photo <> 'null'::jsonb then
      perform public.storyofus_require_media_row(
        p_submission_id,
        v_photo ->> 'mediaId',
        'memory_prompt',
        v_item ->> 'id',
        v_item ->> 'id',
        'photo'
      );
    end if;
  end loop;

  if v_confirmed_skips #>> '{photos,confirmed}' is distinct from 'true' then
    for v_photo in
      select value
      from pg_catalog.jsonb_array_elements(
        case
          when pg_catalog.jsonb_typeof(v_media -> 'photos') = 'array'
            then v_media -> 'photos'
          else '[]'::jsonb
        end
      )
    loop
      perform public.storyofus_require_media_row(
        p_submission_id,
        v_photo ->> 'mediaId',
        'gallery',
        'gallery_photo',
        v_photo ->> 'id',
        'photo'
      );
    end loop;
  end if;

  v_photo := v_media -> 'loveLetterPhoto';
  perform public.storyofus_require_media_row(
    p_submission_id,
    v_photo ->> 'mediaId',
    'letter',
    'love_letter_side_photo',
    'loveLetterPhoto',
    'photo'
  );

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(p_snapshot -> 'timeline') = 'array'
          then p_snapshot -> 'timeline'
        else '[]'::jsonb
      end
    )
  loop
    v_photo := v_item -> 'photo';
    if v_photo is not null and v_photo <> 'null'::jsonb then
      perform public.storyofus_require_media_row(
        p_submission_id,
        v_photo ->> 'mediaId',
        'timeline',
        'timeline_item',
        v_item ->> 'id',
        'photo'
      );
    end if;
  end loop;

  if v_confirmed_skips #>> '{voiceNote,confirmed}' is distinct from 'true'
    and v_music_voice -> 'voiceNote' is not null
    and v_music_voice -> 'voiceNote' <> 'null'::jsonb then
    v_photo := v_music_voice -> 'voiceNote';
    perform public.storyofus_require_media_row(
      p_submission_id,
      v_photo ->> 'mediaId',
      'voice_note',
      'voice_note',
      'voiceNote',
      'voice_note'
    );
  end if;

  if v_confirmed_skips #>> '{puzzle,confirmed}' is distinct from 'true'
    and v_media #>> '{puzzle,sourceType}' = 'separate'
    and v_media #> '{puzzle,puzzlePhoto}' is not null
    and v_media #> '{puzzle,puzzlePhoto}' <> 'null'::jsonb then
    v_photo := v_media #> '{puzzle,puzzlePhoto}';
    perform public.storyofus_require_media_row(
      p_submission_id,
      v_photo ->> 'mediaId',
      'puzzle',
      'puzzle_source',
      'puzzlePhoto',
      'puzzle_photo'
    );
  elsif v_confirmed_skips #>> '{puzzle,confirmed}' is distinct from 'true'
    and v_media #>> '{puzzle,sourceType}' = 'gallery' then
    select value
    into v_gallery_match
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(v_media -> 'photos') = 'array'
          then v_media -> 'photos'
        else '[]'::jsonb
      end
    )
    where value ->> 'id' = v_media #>> '{puzzle,selectedPhotoId}'
    limit 1;

    if v_gallery_match is null then
      raise exception 'StoryOfUs durable media is required.';
    end if;

    perform public.storyofus_require_media_row(
      p_submission_id,
      v_gallery_match ->> 'mediaId',
      'gallery',
      'gallery_photo',
      v_gallery_match ->> 'id',
      'photo'
    );
  end if;
end;
$$;

create or replace function public.storyofus_update_media_row(
  p_submission_id uuid,
  p_photo jsonb,
  p_section text,
  p_semantic_key text,
  p_section_item_id text,
  p_sort_order integer,
  p_media_type text,
  p_is_puzzle_source boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_media_id uuid;
  v_updated_count integer := 0;
begin
  if p_photo is null or p_photo = 'null'::jsonb then
    return;
  end if;

  v_media_id := public.storyofus_validate_media_uuid(p_photo ->> 'mediaId');

  update public.storyofus_media
  set
    caption = public.storyofus_empty_to_null(p_photo ->> 'caption'),
    sort_order = p_sort_order,
    semantic_key = p_semantic_key,
    section_item_id = p_section_item_id,
    is_puzzle_source = p_is_puzzle_source
  where id = v_media_id
    and submission_id = p_submission_id
    and section = p_section
    and media_type = p_media_type;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> 1 then
    raise exception 'StoryOfUs durable media is required.';
  end if;
end;
$$;

create or replace function public.storyofus_apply_media_metadata(
  p_submission_id uuid,
  p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_media jsonb := pg_catalog.coalesce(p_snapshot -> 'media', '{}'::jsonb);
  v_confirmed_skips jsonb := pg_catalog.coalesce(p_snapshot -> 'confirmedSkips', '{}'::jsonb);
  v_music_voice jsonb := pg_catalog.coalesce(p_snapshot -> 'musicVoice', '{}'::jsonb);
  v_item jsonb;
  v_photo jsonb;
  v_sort_order integer;
  v_selected_gallery_id text := v_media #>> '{puzzle,selectedPhotoId}';
  v_should_mark_gallery_puzzle boolean :=
    v_confirmed_skips #>> '{puzzle,confirmed}' is distinct from 'true'
    and v_media #>> '{puzzle,sourceType}' = 'gallery'
    and v_selected_gallery_id is not null
    and v_selected_gallery_id <> '';
begin
  perform public.storyofus_update_media_row(
    p_submission_id,
    v_media #> '{openingPhotos,firstPerson}',
    'opening',
    'hero_left',
    'firstPerson',
    0,
    'photo',
    false
  );

  perform public.storyofus_update_media_row(
    p_submission_id,
    v_media #> '{openingPhotos,secondPerson}',
    'opening',
    'hero_right',
    'secondPerson',
    1,
    'photo',
    false
  );

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(v_media -> 'promptPhotos') = 'array'
          then v_media -> 'promptPhotos'
        else '[]'::jsonb
      end
    )
  loop
    perform public.storyofus_update_media_row(
      p_submission_id,
      v_item -> 'photo',
      'memory_prompt',
      v_item ->> 'id',
      v_item ->> 'id',
      public.storyofus_to_nonnegative_integer(v_item ->> 'sortOrder'),
      'photo',
      false
    );
  end loop;

  if v_confirmed_skips #>> '{photos,confirmed}' is distinct from 'true' then
    for v_photo in
      select value
      from pg_catalog.jsonb_array_elements(
        case
          when pg_catalog.jsonb_typeof(v_media -> 'photos') = 'array'
            then v_media -> 'photos'
          else '[]'::jsonb
        end
      )
    loop
      perform public.storyofus_update_media_row(
        p_submission_id,
        v_photo,
        'gallery',
        'gallery_photo',
        v_photo ->> 'id',
        public.storyofus_to_nonnegative_integer(v_photo ->> 'sortOrder'),
        'photo',
        v_should_mark_gallery_puzzle and v_photo ->> 'id' = v_selected_gallery_id
      );
    end loop;
  end if;

  perform public.storyofus_update_media_row(
    p_submission_id,
    v_media -> 'loveLetterPhoto',
    'letter',
    'love_letter_side_photo',
    'loveLetterPhoto',
    0,
    'photo',
    false
  );

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(p_snapshot -> 'timeline') = 'array'
          then p_snapshot -> 'timeline'
        else '[]'::jsonb
      end
    )
  loop
    v_sort_order := public.storyofus_to_nonnegative_integer(v_item ->> 'sortOrder');
    perform public.storyofus_update_media_row(
      p_submission_id,
      v_item -> 'photo',
      'timeline',
      'timeline_item',
      v_item ->> 'id',
      v_sort_order,
      'photo',
      false
    );
  end loop;

  if v_confirmed_skips #>> '{puzzle,confirmed}' is distinct from 'true'
    and v_media #>> '{puzzle,sourceType}' = 'separate' then
    perform public.storyofus_update_media_row(
      p_submission_id,
      v_media #> '{puzzle,puzzlePhoto}',
      'puzzle',
      'puzzle_source',
      'puzzlePhoto',
      0,
      'puzzle_photo',
      true
    );
  end if;

  if v_confirmed_skips #>> '{voiceNote,confirmed}' is distinct from 'true' then
    perform public.storyofus_update_media_row(
      p_submission_id,
      v_music_voice -> 'voiceNote',
      'voice_note',
      'voice_note',
      'voiceNote',
      0,
      'voice_note',
      false
    );
  end if;
end;
$$;

create or replace function public.storyofus_commit_setup_media_upload(
  p_setup_token text,
  p_media_type text,
  p_section text,
  p_semantic_key text,
  p_section_item_id text,
  p_storage_bucket text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_caption text,
  p_sort_order integer
)
returns table (
  result text,
  media_id uuid,
  storage_path text,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  replaced_storage_paths text[]
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_submission public.storyofus_submissions%rowtype;
  v_effective_editable_until timestamptz;
  v_inserted public.storyofus_media%rowtype;
  v_replaced_storage_paths text[] := array[]::text[];
begin
  result := 'edit_closed';
  media_id := null;
  storage_path := null;
  original_filename := null;
  mime_type := null;
  size_bytes := null;
  replaced_storage_paths := array[]::text[];

  if p_setup_token is null
    or pg_catalog.btrim(p_setup_token) = ''
    or p_media_type not in ('photo', 'puzzle_photo', 'voice_note')
    or p_section not in (
      'opening',
      'memory_prompt',
      'gallery',
      'timeline',
      'letter',
      'puzzle',
      'voice_note'
    )
    or p_semantic_key is null
    or pg_catalog.btrim(p_semantic_key) = ''
    or p_section_item_id is null
    or pg_catalog.btrim(p_section_item_id) = ''
    or p_storage_bucket <> 'storyofus-media'
    or p_storage_path is null
    or pg_catalog.btrim(p_storage_path) = ''
    or p_storage_path like 'blob:%'
    or p_storage_path like 'http://%'
    or p_storage_path like 'https://%'
    or p_storage_path like 'data:%'
    or p_size_bytes is null
    or p_size_bytes < 0 then
    raise exception 'Invalid StoryOfUs media upload input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions
  where setup_token = pg_catalog.btrim(p_setup_token)::uuid
  for update;

  if not found then
    return next;
    return;
  end if;

  if v_submission.payment_status <> 'paid'
    or pg_catalog.coalesce(v_submission.refund_status, 'none') in (
      'requested',
      'under_review',
      'approved',
      'processing',
      'refunded'
    ) then
    return next;
    return;
  end if;

  if v_submission.status = 'draft' then
    null;
  elsif v_submission.status = 'submitted' then
    v_effective_editable_until := v_submission.editable_until;

    if v_effective_editable_until is null
      or v_effective_editable_until <= v_now
      or v_submission.editing_closed_at is not null
      or v_submission.edits_used >= v_submission.edit_limit then
      return next;
      return;
    end if;
  else
    return next;
    return;
  end if;

  with locked_existing as (
    select existing.id, existing.storage_path
    from public.storyofus_media as existing
    where existing.submission_id = v_submission.id
      and existing.section = p_section
      and existing.semantic_key = p_semantic_key
      and existing.section_item_id = p_section_item_id
    for update
  )
  select pg_catalog.coalesce(pg_catalog.array_agg(locked_existing.storage_path), array[]::text[])
  into v_replaced_storage_paths
  from locked_existing;

  insert into public.storyofus_media (
    submission_id,
    media_type,
    section,
    semantic_key,
    section_item_id,
    storage_bucket,
    storage_path,
    original_filename,
    mime_type,
    size_bytes,
    caption,
    sort_order,
    is_puzzle_source
  )
  values (
    v_submission.id,
    p_media_type,
    p_section,
    p_semantic_key,
    p_section_item_id,
    p_storage_bucket,
    pg_catalog.btrim(p_storage_path),
    public.storyofus_empty_to_null(p_original_filename),
    public.storyofus_empty_to_null(p_mime_type),
    p_size_bytes,
    public.storyofus_empty_to_null(p_caption),
    pg_catalog.greatest(pg_catalog.coalesce(p_sort_order, 0), 0),
    p_section = 'puzzle' or (p_section = 'gallery' and p_semantic_key = 'puzzle_source')
  )
  returning *
  into v_inserted;

  delete from public.storyofus_media
  where submission_id = v_submission.id
    and section = p_section
    and semantic_key = p_semantic_key
    and section_item_id = p_section_item_id
    and id <> v_inserted.id;

  result := 'committed';
  media_id := v_inserted.id;
  storage_path := v_inserted.storage_path;
  original_filename := v_inserted.original_filename;
  mime_type := v_inserted.mime_type;
  size_bytes := v_inserted.size_bytes;
  replaced_storage_paths := v_replaced_storage_paths;
  return next;
end;
$$;

create or replace function public.storyofus_remove_setup_media(
  p_setup_token text,
  p_section text,
  p_semantic_key text,
  p_section_item_id text
)
returns table (
  result text,
  removed_count integer,
  removed_storage_paths text[]
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_submission public.storyofus_submissions%rowtype;
  v_effective_editable_until timestamptz;
  v_removed_storage_paths text[] := array[]::text[];
  v_removed_count integer := 0;
begin
  result := 'edit_closed';
  removed_count := 0;
  removed_storage_paths := array[]::text[];

  if p_setup_token is null
    or pg_catalog.btrim(p_setup_token) = ''
    or p_section not in (
      'opening',
      'memory_prompt',
      'gallery',
      'timeline',
      'letter',
      'puzzle',
      'voice_note'
    )
    or p_semantic_key is null
    or pg_catalog.btrim(p_semantic_key) = ''
    or p_section_item_id is null
    or pg_catalog.btrim(p_section_item_id) = '' then
    raise exception 'Invalid StoryOfUs media removal input.';
  end if;

  select *
  into v_submission
  from public.storyofus_submissions
  where setup_token = pg_catalog.btrim(p_setup_token)::uuid
  for update;

  if not found then
    return next;
    return;
  end if;

  if v_submission.payment_status <> 'paid'
    or pg_catalog.coalesce(v_submission.refund_status, 'none') in (
      'requested',
      'under_review',
      'approved',
      'processing',
      'refunded'
    ) then
    return next;
    return;
  end if;

  if v_submission.status = 'draft' then
    null;
  elsif v_submission.status = 'submitted' then
    v_effective_editable_until := v_submission.editable_until;

    if v_effective_editable_until is null
      or v_effective_editable_until <= v_now
      or v_submission.editing_closed_at is not null
      or v_submission.edits_used >= v_submission.edit_limit then
      return next;
      return;
    end if;
  else
    return next;
    return;
  end if;

  with locked_existing as (
    select existing.id, existing.storage_path
    from public.storyofus_media as existing
    where existing.submission_id = v_submission.id
      and existing.section = p_section
      and existing.semantic_key = p_semantic_key
      and existing.section_item_id = p_section_item_id
    for update
  )
  select pg_catalog.coalesce(pg_catalog.array_agg(locked_existing.storage_path), array[]::text[])
  into v_removed_storage_paths
  from locked_existing;

  delete from public.storyofus_media
  where submission_id = v_submission.id
    and section = p_section
    and semantic_key = p_semantic_key
    and section_item_id = p_section_item_id;

  get diagnostics v_removed_count = row_count;

  result := 'removed';
  removed_count := v_removed_count;
  removed_storage_paths := v_removed_storage_paths;
  return next;
end;
$$;

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
  v_batch_limit integer := pg_catalog.least(pg_catalog.greatest(coalesce(p_batch_limit, 50), 1), 100);
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
    and coalesce(refund_status, 'none') in ('none', 'rejected')
    and editing_closed_at is null;

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
      and editing_closed_at is null
    order by editable_until asc, created_at asc, id asc
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
      and submission.editing_closed_at is null
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
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) is null
    or coalesce(v_submission.refund_request_until, v_submission.editable_until) > v_now
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

  if not exists (
    select 1
    from public.storyofus_media
    where submission_id = v_submission.id
      and section = 'letter'
      and semantic_key = 'love_letter_side_photo'
      and section_item_id = 'loveLetterPhoto'
      and media_type = 'photo'
      and storage_bucket = 'storyofus-media'
      and storage_path is not null
      and storage_path <> ''
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
    and coalesce(refund_request_until, editable_until) is not null
    and coalesce(refund_request_until, editable_until) <= v_now
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

revoke all privileges on function public.storyofus_finalize_setup_submission(text, jsonb, text, text, timestamptz, jsonb)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_empty_to_null(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_to_date(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_to_nonnegative_integer(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_validate_media_uuid(text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_require_media_row(uuid, text, text, text, text, text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_validate_finalization_media(uuid, jsonb)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_update_media_row(uuid, jsonb, text, text, text, integer, text, boolean)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_apply_media_metadata(uuid, jsonb)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_commit_setup_media_upload(text, text, text, text, text, text, text, text, text, bigint, text, integer)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_remove_setup_media(text, text, text, text)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_promote_review_ready_orders(integer, boolean)
from public, anon, authenticated;

revoke all privileges on function public.storyofus_publish_final_site(uuid, text, text, text)
from public, anon, authenticated;

grant execute on function public.storyofus_finalize_setup_submission(text, jsonb, text, text, timestamptz, jsonb)
to service_role;

grant execute on function public.storyofus_commit_setup_media_upload(text, text, text, text, text, text, text, text, text, bigint, text, integer)
to service_role;

grant execute on function public.storyofus_remove_setup_media(text, text, text, text)
to service_role;

grant execute on function public.storyofus_promote_review_ready_orders(integer, boolean)
to service_role;

grant execute on function public.storyofus_publish_final_site(uuid, text, text, text)
to service_role;

grant select, insert, update, delete on table public.storyofus_submissions to service_role;
grant select, insert, update, delete on table public.storyofus_couple_details to service_role;
grant select, insert, update, delete on table public.storyofus_music to service_role;
grant select, insert, update, delete on table public.storyofus_media to service_role;
grant select, insert, update, delete on table public.storyofus_timeline_items to service_role;
grant select, insert, update, delete on table public.storyofus_letters to service_role;
grant select, insert on table public.storyofus_email_outbox to service_role;

commit;
