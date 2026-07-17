-- Cinsiyet yalnızca özellik yetkilendirmesi için tutulur. Mevcut kullanıcılar
-- güvenli varsayılan olan `undisclosed` ile başlar.
alter table public.profiles
  add column if not exists gender text not null default 'undisclosed'
  check (gender in ('female', 'male', 'undisclosed'));

-- Ortak profil sorguları cinsiyet sütununu okuyamaz. Kullanıcı kendi değerini
-- aşağıdaki güvenli RPC üzerinden okur ve değiştirir.
revoke select on public.profiles from anon, authenticated;
grant select (id, couple_id, display_name, avatar_url, created_at, role)
  on public.profiles to authenticated;
revoke update (gender) on public.profiles from authenticated;

create or replace function public.get_my_gender()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gender text;
begin
  if auth.uid() is null then raise exception 'Oturum bulunamadı.'; end if;
  select profile_row.gender into v_gender
  from public.profiles as profile_row
  where profile_row.id = auth.uid();
  return coalesce(v_gender, 'undisclosed');
end;
$$;
revoke execute on function public.get_my_gender() from public;
grant execute on function public.get_my_gender() to authenticated;

create or replace function public.set_my_gender(p_gender text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Oturum bulunamadı.'; end if;
  if p_gender not in ('female', 'male', 'undisclosed') then
    raise exception 'Geçersiz cinsiyet seçimi.';
  end if;
  update public.profiles set gender = p_gender where id = auth.uid();
  if not found then raise exception 'Profil bulunamadı.'; end if;
  return p_gender;
end;
$$;
revoke execute on function public.set_my_gender(text) from public;
grant execute on function public.set_my_gender(text) to authenticated;

create or replace function public.profile_can_use_period_mode(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_profile_id and gender = 'female'
  )
$$;
revoke execute on function public.profile_can_use_period_mode(uuid) from public;
grant execute on function public.profile_can_use_period_mode(uuid) to authenticated;

-- RLS, normal istemci/API çağrılarında erkek ve undisclosed kullanıcıların
-- regl modu ya da regl hızlı durumu oluşturmasını engeller.
drop policy if exists "Users create own moods" on public.mood_entries;
create policy "Users create own moods" on public.mood_entries for insert
to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
  and (mood <> 'period' or (select public.profile_can_use_period_mode(auth.uid())))
);

drop policy if exists "Users create own quick statuses" on public.quick_statuses;
create policy "Users create own quick statuses" on public.quick_statuses
for insert to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
  and (
    status_type <> 'period'
    or (select public.profile_can_use_period_mode(auth.uid()))
  )
);

drop policy if exists "Users update own quick statuses" on public.quick_statuses;
create policy "Users update own quick statuses" on public.quick_statuses
for update to authenticated using (created_by = (select auth.uid()))
with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
  and (
    status_type <> 'period'
    or (select public.profile_can_use_period_mode(auth.uid()))
  )
);

-- Trigger katmanı service-role veya yanlışlıkla eklenen başka bir backend
-- yolunun RLS'yi aşması halinde de regl kaydını reddeder.
create or replace function public.enforce_period_gender()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'mood_entries' then
    if new.mood = 'period'
      and not public.profile_can_use_period_mode(new.created_by) then
      raise exception 'Regl modu yalnızca kadın profiller tarafından kullanılabilir.';
    end if;
  elsif tg_table_name = 'quick_statuses' then
    if new.status_type = 'period'
      and not public.profile_can_use_period_mode(new.created_by) then
      raise exception 'Regl modu yalnızca kadın profiller tarafından kullanılabilir.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_mood_period_gender on public.mood_entries;
create trigger enforce_mood_period_gender
before insert on public.mood_entries
for each row execute function public.enforce_period_gender();

drop trigger if exists enforce_quick_status_period_gender on public.quick_statuses;
create trigger enforce_quick_status_period_gender
before insert or update on public.quick_statuses
for each row execute function public.enforce_period_gender();

-- Kadın dışındaki bir seçime geçildiğinde aktif/historik regl verisi anında
-- kaldırılır; Realtime silme olayları diğer cihazı da günceller.
create or replace function public.clear_period_state_after_gender_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.gender = 'female' and new.gender <> 'female' then
    delete from public.quick_statuses
    where created_by = new.id and status_type = 'period';
    delete from public.mood_entries
    where created_by = new.id and mood = 'period';
  end if;
  return new;
end;
$$;

drop trigger if exists clear_period_state_on_gender_change on public.profiles;
create trigger clear_period_state_on_gender_change
after update of gender on public.profiles
for each row execute function public.clear_period_state_after_gender_change();

-- Migration anında mevcut profiller undisclosed olduğu için eski yetkisiz
-- regl kayıtları temizlenir.
delete from public.quick_statuses where status_type = 'period';
delete from public.mood_entries where mood = 'period';

-- Bootstrap RPC'leri cinsiyeti doğrular ve profil oluşturulurken atomik yazar.
drop function if exists public.create_couple_and_profile(text, text);
create function public.create_couple_and_profile(
  p_display_name text,
  p_avatar_url text default null,
  p_gender text default 'undisclosed'
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
  if v_user_id is null then raise exception 'Oturum bulunamadı.'; end if;
  if p_gender not in ('female', 'male', 'undisclosed') then
    raise exception 'Geçersiz cinsiyet seçimi.';
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
  insert into public.profiles (
    id, couple_id, display_name, avatar_url, role, gender
  ) values (
    v_user_id, v_couple_id, p_display_name, p_avatar_url, 'owner', p_gender
  );
  return query select v_couple_id, v_code;
end;
$$;
revoke execute on function public.create_couple_and_profile(text, text, text) from public;
grant execute on function public.create_couple_and_profile(text, text, text) to authenticated;

drop function if exists public.join_couple_by_code(text, text, text);
create function public.join_couple_by_code(
  p_code text,
  p_display_name text,
  p_avatar_url text default null,
  p_gender text default 'undisclosed'
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
  if v_user_id is null then raise exception 'Oturum bulunamadı.'; end if;
  if p_gender not in ('female', 'male', 'undisclosed') then
    raise exception 'Geçersiz cinsiyet seçimi.';
  end if;
  if exists (select 1 from public.profiles as profile_row where profile_row.id = v_user_id) then
    raise exception 'Zaten bir çifte aitsin.';
  end if;
  select couple_row.id into v_couple_id
  from public.couples as couple_row
  where couple_row.invite_code = upper(trim(p_code))
  for update;
  if v_couple_id is null then raise exception 'Geçersiz davet kodu.'; end if;
  select count(*) into v_member_count
  from public.profiles as profile_row
  where profile_row.couple_id = v_couple_id;
  if v_member_count >= 2 then raise exception 'Bu çift zaten tamamlanmış.'; end if;
  insert into public.profiles (
    id, couple_id, display_name, avatar_url, role, gender
  ) values (
    v_user_id, v_couple_id, p_display_name, p_avatar_url, 'partner', p_gender
  );
  return query select v_couple_id;
end;
$$;
revoke execute on function public.join_couple_by_code(text, text, text, text) from public;
grant execute on function public.join_couple_by_code(text, text, text, text) to authenticated;
