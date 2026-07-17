-- Davet katılımı aynı çiftte iki kişinin eşzamanlı olarak üçüncü üye
-- oluşturmasını engeller; çift satırı transaction boyunca kilitlenir.
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

  if exists (select 1 from public.profiles as profile_row where profile_row.id = v_user_id) then
    raise exception 'Zaten bir çifte aitsin.';
  end if;

  select couple_row.id into v_couple_id
  from public.couples as couple_row
  where couple_row.invite_code = upper(trim(p_code))
  for update;

  if v_couple_id is null then
    raise exception 'Geçersiz davet kodu.';
  end if;

  select count(*) into v_member_count
  from public.profiles as profile_row
  where profile_row.couple_id = v_couple_id;

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

-- Rol ve sahiplik alanları istemci tarafından değiştirilemez.
revoke update (role) on public.profiles from authenticated;
revoke update (created_by) on public.events from authenticated;
revoke update (created_by) on public.countdowns from authenticated;
revoke update (created_by) on public.bucket_lists from authenticated;

-- completed_by, aynı çiftteki bir profile ait olmak zorunda.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bucket_items_completed_by_couple_id_fkey'
  ) then
    alter table public.bucket_items
      add constraint bucket_items_completed_by_couple_id_fkey
      foreign key (completed_by, couple_id)
      references public.profiles(id, couple_id) on delete set null;
  end if;
end;
$$;
