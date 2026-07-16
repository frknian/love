create extension if not exists "pgcrypto";

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  anniversary_date date
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  cover_image text,
  created_at timestamptz not null default now(),
  unique (id, couple_id)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null,
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  image_url text not null check (char_length(trim(image_url)) > 0),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  location text,
  memory_date date,
  created_at timestamptz not null default now(),
  foreign key (album_id, couple_id) references public.albums(id, couple_id) on delete cascade
);

create index profiles_couple_id_idx on public.profiles(couple_id);
create index albums_couple_id_created_at_idx on public.albums(couple_id, created_at desc);
create index memories_couple_id_created_at_idx on public.memories(couple_id, created_at desc);
create index memories_album_id_created_at_idx on public.memories(album_id, created_at desc);
create index memories_uploaded_by_idx on public.memories(uploaded_by);

create or replace function public.current_user_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.album_belongs_to_current_couple(target_album_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.albums
    where id = target_album_id
      and couple_id = (select public.current_user_couple_id())
  )
$$;

revoke execute on function public.current_user_couple_id() from public;
revoke execute on function public.album_belongs_to_current_couple(uuid) from public;
grant execute on function public.current_user_couple_id() to authenticated;
grant execute on function public.album_belongs_to_current_couple(uuid) to authenticated;

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.memories enable row level security;

create policy "Couple members can read their couple"
on public.couples for select to authenticated
using (id = (select public.current_user_couple_id()));

create policy "Couple members can read member profiles"
on public.profiles for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and couple_id = (select public.current_user_couple_id()));

create policy "Couple members can read albums"
on public.albums for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create albums"
on public.albums for insert to authenticated
with check (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can update albums"
on public.albums for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can delete albums"
on public.albums for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can read memories"
on public.memories for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create memories"
on public.memories for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and uploaded_by = (select auth.uid())
  and (select public.album_belongs_to_current_couple(album_id))
);

revoke update (uploaded_by) on public.memories from authenticated;

create policy "Couple members can update their memories"
on public.memories for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (
  couple_id = (select public.current_user_couple_id())
  and (select public.album_belongs_to_current_couple(album_id))
);

create policy "Uploaders can delete their memories"
on public.memories for delete to authenticated
using (uploaded_by = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Couple members can read memory files"
on storage.objects for select to authenticated
using (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
);

create policy "Users can upload their own memory files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);

create policy "Users can update their own memory files"
on storage.objects for update to authenticated
using (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
)
with check (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);

create policy "Users can delete their own memory files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);
