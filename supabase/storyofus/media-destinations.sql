begin;

alter table public.storyofus_media
  add column if not exists semantic_key text,
  add column if not exists section_item_id text;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.storyofus_media'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%section%'
  loop
    execute format(
      'alter table public.storyofus_media drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.storyofus_media
  add constraint storyofus_media_section_check
  check (
    section in (
      'opening',
      'memory_prompt',
      'gallery',
      'timeline',
      'letter',
      'puzzle',
      'voice_note'
    )
  );

update public.storyofus_media
set
  semantic_key = coalesce(
    semantic_key,
    case
      when section = 'gallery' then 'gallery_photo'
      when section = 'puzzle' then 'puzzle_source'
      when section = 'voice_note' then 'voice_note'
      else null
    end
  ),
  section_item_id = coalesce(
    section_item_id,
    case
      when section = 'gallery' then id::text
      when section = 'puzzle' then 'puzzlePhoto'
      when section = 'voice_note' then 'voiceNote'
      else null
    end
  )
where semantic_key is null
  or section_item_id is null;

create index if not exists storyofus_media_submission_section_semantic_idx
on public.storyofus_media (submission_id, section, semantic_key, section_item_id);

commit;
