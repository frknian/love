-- Açık kayıt ve davet kodu ile eşleşme.
-- Önceki mimaride couples/profiles yalnızca manuel seed SQL ile
-- oluşturuluyordu (bkz. supabase/seed.example.sql). Bu migration, herhangi
-- bir kullanıcının kayıt olup kendi çiftini oluşturmasına veya bir davet
-- koduyla mevcut bir çifte partner olarak katılmasına izin verir.

alter table public.couples add column if not exists invite_code text unique;

alter table public.profiles
  add column if not exists role text not null default 'partner'
  check (role in ('owner', 'partner'));

-- Mevcut satırlar için: her çiftte en erken oluşturulan profil 'owner' kabul edilir.
with ranked as (
  select id, row_number() over (partition by couple_id order by created_at asc) as rn
  from public.profiles
)
update public.profiles p
set role = 'owner'
from ranked r
where p.id = r.id and r.rn = 1;

create index if not exists couples_invite_code_idx on public.couples(invite_code);

create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))
$$;

-- Henüz bir çifte ait olmayan kullanıcı için yeni bir çift ve owner
-- profili oluşturur. security definer: bootstraplama anında kullanıcının
-- couple_id'si henüz yok, normal RLS politikaları bu adımı yapamaz.
create or replace function public.create_couple_and_profile(
  p_display_name text,
  p_avatar_url text default null
)
returns table (couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_code text;
  v_attempt int := 0;
begin
  if v_user_id is null then
    raise exception 'Oturum bulunamadı.';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Zaten bir çifte aitsin.';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := public.generate_invite_code();
    begin
      insert into public.couples (name, invite_code)
      values (p_display_name || '''nin Hikâyesi', v_code)
      returning id into v_couple_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'Davet kodu oluşturulamadı, tekrar dene.';
      end if;
    end;
  end loop;

  insert into public.profiles (id, couple_id, display_name, avatar_url, role)
  values (v_user_id, v_couple_id, p_display_name, p_avatar_url, 'owner');

  return query select v_couple_id, v_code;
end;
$$;

revoke execute on function public.create_couple_and_profile(text, text) from public;
grant execute on function public.create_couple_and_profile(text, text) to authenticated;

-- Davet koduyla mevcut bir çifte partner olarak katılır.
create or replace function public.join_couple_by_code(
  p_code text,
  p_display_name text,
  p_avatar_url text default null
)
returns table (couple_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'Oturum bulunamadı.';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Zaten bir çifte aitsin.';
  end if;

  select id into v_couple_id
  from public.couples
  where invite_code = upper(trim(p_code));

  if v_couple_id is null then
    raise exception 'Geçersiz davet kodu.';
  end if;

  select count(*) into v_member_count
  from public.profiles
  where couple_id = v_couple_id;

  if v_member_count >= 2 then
    raise exception 'Bu çift zaten tamamlanmış.';
  end if;

  insert into public.profiles (id, couple_id, display_name, avatar_url, role)
  values (v_user_id, v_couple_id, p_display_name, p_avatar_url, 'partner');

  return query select v_couple_id;
end;
$$;

revoke execute on function public.join_couple_by_code(text, text, text) from public;
grant execute on function public.join_couple_by_code(text, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can view avatars"
on storage.objects for select to public
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "Users can update their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);
