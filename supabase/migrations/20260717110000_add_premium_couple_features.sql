-- Sprint 2: ortak profil, hikâye, medya, içerik ve konum altyapısı.
alter table public.couples add column if not exists cover_image text;

alter table public.memories
  alter column image_url drop not null,
  add column if not exists media_type text not null default 'photo'
    check (media_type in ('photo', 'video', 'audio', 'note')),
  add column if not exists thumbnail_path text,
  add column if not exists note_content text,
  add column if not exists duration_seconds integer
    check (duration_seconds is null or duration_seconds between 0 and 86400),
  add column if not exists is_favorite boolean not null default false;

alter table public.memories drop constraint if exists memories_media_content_check;
alter table public.memories add constraint memories_media_content_check check (
  (media_type = 'note' and note_content is not null and char_length(trim(note_content)) between 1 and 4000)
  or (media_type <> 'note' and image_url is not null and char_length(trim(image_url)) > 0)
);
create index if not exists memories_couple_id_media_type_created_at_idx
  on public.memories(couple_id, media_type, created_at desc);
create index if not exists memories_couple_id_favorite_created_at_idx
  on public.memories(couple_id, is_favorite, created_at desc);

create table if not exists public.couple_stories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 12000),
  version integer not null default 1 check (version > 0),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.couple_story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.couple_stories(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  content text not null check (char_length(content) <= 12000),
  version integer not null check (version > 0),
  edited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (story_id, version)
);
create index if not exists couple_story_versions_story_id_version_idx
  on public.couple_story_versions(story_id, version desc);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  activity_type text not null check (activity_type in ('memory_added', 'story_updated', 'event_created', 'goal_completed', 'watch_item_added', 'watch_item_completed', 'game_completed', 'location_updated')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists activities_couple_id_created_at_idx on public.activities(couple_id, created_at desc);

create table if not exists public.watch_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete restrict,
  content_type text not null check (content_type in ('movie', 'series', 'anime', 'documentary')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  poster_path text,
  status text not null default 'planned' check (status in ('planned', 'watched')),
  watched_on date,
  rating integer check (rating is null or rating between 1 and 5),
  note text check (note is null or char_length(note) <= 1000),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists watch_items_couple_id_status_created_at_idx on public.watch_items(couple_id, status, created_at desc);

create table if not exists public.couple_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  sharing_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  check ((sharing_enabled = false) or (latitude between -90 and 90 and longitude between -180 and 180)),
  foreign key (user_id, couple_id) references public.profiles(id, couple_id) on delete cascade
);
create index if not exists couple_locations_couple_id_idx on public.couple_locations(couple_id);

alter table public.events add column if not exists reminder_offsets integer[] not null default array[30,14,7,5,3,1,0];
alter table public.events drop constraint if exists events_reminder_offsets_check;
alter table public.events add constraint events_reminder_offsets_check check (reminder_offsets <@ array[30,14,7,5,3,1,0]);

alter table public.couple_stories enable row level security;
alter table public.couple_story_versions enable row level security;
alter table public.activities enable row level security;
alter table public.watch_items enable row level security;
alter table public.couple_locations enable row level security;
grant select on public.couple_stories, public.couple_story_versions, public.activities, public.watch_items, public.couple_locations to authenticated;
grant insert, update, delete on public.watch_items to authenticated;
grant insert, update on public.couple_locations to authenticated;

create policy "Couple members can read shared story" on public.couple_stories for select to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can read story history" on public.couple_story_versions for select to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can read activity feed" on public.activities for select to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can read watch items" on public.watch_items for select to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can create watch items" on public.watch_items for insert to authenticated with check (couple_id = (select public.current_user_couple_id()) and added_by = (select auth.uid()));
create policy "Couple members can update watch items" on public.watch_items for update to authenticated using (couple_id = (select public.current_user_couple_id())) with check (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can delete watch items" on public.watch_items for delete to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members can read shared locations" on public.couple_locations for select to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Users can create their location" on public.couple_locations for insert to authenticated with check (user_id = (select auth.uid()) and couple_id = (select public.current_user_couple_id()));
create policy "Users can update their location" on public.couple_locations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and couple_id = (select public.current_user_couple_id()));

create or replace function public.save_couple_story(p_content text)
returns public.couple_stories language plpgsql security definer set search_path = public as $$
declare v_couple_id uuid := public.current_user_couple_id(); v_story public.couple_stories; v_content text := coalesce(p_content, '');
begin
  if v_couple_id is null then raise exception 'Bir çifte ait değilsin.'; end if;
  if char_length(v_content) > 12000 then raise exception 'Hikâye en fazla 12.000 karakter olabilir.'; end if;
  select * into v_story from public.couple_stories where couple_id = v_couple_id for update;
  if not found then
    insert into public.couple_stories(couple_id, content, updated_by) values (v_couple_id, v_content, auth.uid()) returning * into v_story;
  elsif v_story.content is distinct from v_content then
    insert into public.couple_story_versions(story_id, couple_id, content, version, edited_by) values (v_story.id, v_couple_id, v_story.content, v_story.version, v_story.updated_by);
    update public.couple_stories set content = v_content, version = v_story.version + 1, updated_by = auth.uid(), updated_at = now() where id = v_story.id returning * into v_story;
  end if;
  insert into public.activities(couple_id, actor_id, activity_type, entity_id, metadata) values (v_couple_id, auth.uid(), 'story_updated', v_story.id, '{}'::jsonb);
  return v_story;
end;
$$;
revoke execute on function public.save_couple_story(text) from public;
grant execute on function public.save_couple_story(text) to authenticated;

create or replace function public.record_premium_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'memories' then
    insert into public.activities(couple_id, actor_id, activity_type, entity_id, metadata) values (new.couple_id, new.uploaded_by, 'memory_added', new.id, jsonb_build_object('title', new.title, 'media_type', new.media_type));
  elsif tg_table_name = 'watch_items' then
    insert into public.activities(couple_id, actor_id, activity_type, entity_id, metadata) values (new.couple_id, new.added_by, 'watch_item_added', new.id, jsonb_build_object('title', new.title, 'content_type', new.content_type));
  end if;
  return new;
end;
$$;
drop trigger if exists record_memory_activity on public.memories;
create trigger record_memory_activity after insert on public.memories for each row execute procedure public.record_premium_activity();
drop trigger if exists record_watch_item_activity on public.watch_items;
create trigger record_watch_item_activity after insert on public.watch_items for each row execute procedure public.record_premium_activity();

alter table public.couple_stories replica identity full;
alter table public.activities replica identity full;
alter table public.watch_items replica identity full;
alter table public.couple_locations replica identity full;
alter publication supabase_realtime add table public.couple_stories;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.watch_items;
alter publication supabase_realtime add table public.couple_locations;

update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'] where id = 'memories';
