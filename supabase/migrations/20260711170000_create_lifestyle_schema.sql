-- Bucket list, ortak günlük, time capsule ve kullanıcı ayarları.

create table public.bucket_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  cover_image text check (cover_image is null or char_length(cover_image) <= 2048),
  color text not null default 'rose' check (
    color in ('rose', 'amber', 'sky', 'emerald', 'violet', 'slate')
  ),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  bucket_list_id uuid not null references public.bucket_lists(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  position integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (completed = false and completed_at is null and completed_by is null)
    or (completed = true)
  )
);

create table public.journals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  content text not null check (char_length(trim(content)) between 1 and 4000),
  mood text not null check (
    mood in ('happy', 'in_love', 'sad', 'sleepy', 'angry', 'cool', 'loved')
  ),
  weather text check (
    weather is null or weather in ('sunny', 'rainy', 'snowy', 'cloudy')
  ),
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 4000),
  attachments jsonb not null default '[]'::jsonb,
  unlock_date timestamptz not null,
  opened boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  check (unlock_date > created_at)
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notifications_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  animation_enabled boolean not null default true,
  language text not null default 'tr' check (language in ('tr', 'en')),
  notification_preferences jsonb not null default (
    '{
      "miss_you": true,
      "hug": true,
      "good_morning": true,
      "good_night": true,
      "new_note": true,
      "new_memory": true,
      "new_journal": true,
      "upcoming_event": true,
      "capsule_opened": true
    }'::jsonb
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bucket_lists_couple_id_created_at_idx on public.bucket_lists(couple_id, created_at desc);
create index bucket_items_bucket_list_id_position_idx on public.bucket_items(bucket_list_id, position);
create index bucket_items_couple_id_idx on public.bucket_items(couple_id);
create index journals_couple_id_created_at_idx on public.journals(couple_id, created_at desc);
create index journals_author_id_idx on public.journals(author_id);
create index time_capsules_couple_id_unlock_date_idx on public.time_capsules(couple_id, unlock_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_journals_updated_at
before update on public.journals
for each row execute procedure public.set_updated_at();

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

-- bucket_items.couple_id, referans verdiği listenin çiftiyle eşleşmeli.
create or replace function public.bucket_list_belongs_to_current_couple(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bucket_lists
    where id = target_list_id
      and couple_id = (select public.current_user_couple_id())
  )
$$;

revoke execute on function public.bucket_list_belongs_to_current_couple(uuid) from public;
grant execute on function public.bucket_list_belongs_to_current_couple(uuid) to authenticated;

-- Time capsule içeriği yalnızca açılma tarihi geldiğinde okunabilir.
create or replace function public.get_time_capsule_content(target_id uuid)
returns table (message text, attachments jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select tc.message, tc.attachments
  from public.time_capsules tc
  where tc.id = target_id
    and tc.couple_id = (select public.current_user_couple_id())
    and tc.unlock_date <= now()
$$;

revoke execute on function public.get_time_capsule_content(uuid) from public;
grant execute on function public.get_time_capsule_content(uuid) to authenticated;

-- Bir depolama nesnesinin ait olduğu kapsül açılmış mı kontrol eder.
create or replace function public.capsule_attachment_unlocked(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.time_capsules
    where couple_id = (select public.current_user_couple_id())
      and unlock_date <= now()
      and attachments @> jsonb_build_array(jsonb_build_object('path', object_name))
  )
$$;

revoke execute on function public.capsule_attachment_unlocked(text) from public;
grant execute on function public.capsule_attachment_unlocked(text) to authenticated;

alter table public.bucket_lists enable row level security;
alter table public.bucket_items enable row level security;
alter table public.journals enable row level security;
alter table public.time_capsules enable row level security;
alter table public.user_settings enable row level security;

grant select, insert, update, delete on public.bucket_lists to authenticated;
grant select, insert, update, delete on public.bucket_items to authenticated;
grant select, insert, update, delete on public.journals to authenticated;
grant insert, delete on public.time_capsules to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

-- time_capsules: mesaj/ek kolonları herkesten gizli; yalnızca metadata görünür.
grant select (
  id, couple_id, author_id, title, unlock_date, opened, opened_at, created_at
) on public.time_capsules to authenticated;
grant update (opened, opened_at) on public.time_capsules to authenticated;

-- bucket_lists
create policy "Couple members can read bucket lists"
on public.bucket_lists for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create bucket lists"
on public.bucket_lists for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);

create policy "Couple members can update bucket lists"
on public.bucket_lists for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can delete bucket lists"
on public.bucket_lists for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

-- bucket_items
create policy "Couple members can read bucket items"
on public.bucket_items for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create bucket items"
on public.bucket_items for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and (select public.bucket_list_belongs_to_current_couple(bucket_list_id))
);

create policy "Couple members can update bucket items"
on public.bucket_items for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (
  couple_id = (select public.current_user_couple_id())
  and (select public.bucket_list_belongs_to_current_couple(bucket_list_id))
);

create policy "Couple members can delete bucket items"
on public.bucket_items for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

-- journals
create policy "Couple members can read journals"
on public.journals for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create journals"
on public.journals for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and author_id = (select auth.uid())
);

create policy "Authors can update their journals"
on public.journals for update to authenticated
using (author_id = (select auth.uid()))
with check (
  couple_id = (select public.current_user_couple_id())
  and author_id = (select auth.uid())
);

create policy "Couple members can delete journals"
on public.journals for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

-- time_capsules
create policy "Couple members can read capsule metadata"
on public.time_capsules for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create capsules"
on public.time_capsules for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and author_id = (select auth.uid())
);

create policy "Couple members can mark unlocked capsules opened"
on public.time_capsules for update to authenticated
using (
  couple_id = (select public.current_user_couple_id())
  and unlock_date <= now()
)
with check (
  couple_id = (select public.current_user_couple_id())
  and unlock_date <= now()
);

create policy "Authors can delete their capsules"
on public.time_capsules for delete to authenticated
using (author_id = (select auth.uid()));

-- user_settings
create policy "Users can read their own settings"
on public.user_settings for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their own settings"
on public.user_settings for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own settings"
on public.user_settings for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter table public.bucket_lists replica identity full;
alter table public.bucket_items replica identity full;
alter table public.journals replica identity full;

alter publication supabase_realtime add table public.bucket_lists;
alter publication supabase_realtime add table public.bucket_items;
alter publication supabase_realtime add table public.journals;

-- time_capsules kasıtlı olarak realtime yayınına eklenmez: değişiklik
-- payload'ları RLS'yi atlayabileceğinden mesaj/ek içeriği sızabilir.
-- Açılma anı istemci tarafında unlock_date karşılaştırmasıyla saptanır.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-media',
  'journal-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capsules',
  'capsules',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime',
    'application/pdf'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Couple members can read journal media"
on storage.objects for select to authenticated
using (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
);

create policy "Users can upload their own journal media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);

create policy "Users can delete their own journal media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);

create policy "Couple members can read unlocked capsule attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'capsules'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and public.capsule_attachment_unlocked(name)
);

create policy "Users can upload their own capsule attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'capsules'
  and (storage.foldername(name))[1] = ((select public.current_user_couple_id())::text)
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);
