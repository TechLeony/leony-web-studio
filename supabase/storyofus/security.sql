-- StoryOfUs security and storage setup

-- Keep all StoryOfUs tables protected by RLS.
-- No public anon policies are added intentionally.
-- Data writes/reads should go through server-side helpers using the service role key.

alter table public.storyofus_submissions enable row level security;
alter table public.storyofus_couple_details enable row level security;
alter table public.storyofus_music enable row level security;
alter table public.storyofus_media enable row level security;
alter table public.storyofus_timeline_items enable row level security;
alter table public.storyofus_letters enable row level security;

-- Private storage bucket for StoryOfUs photos, puzzle images and voice notes.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'storyofus-media',
  'storyofus-media',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;