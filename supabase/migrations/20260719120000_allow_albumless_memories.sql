-- Anılar bir albüme bağlı olmadan da saklanabilir. Albüm seçildiğinde mevcut
-- çift doğrulaması aynen korunur; albümsüz kayıtlarda çift RLS kontrolü yeterlidir.
alter table public.memories
alter column album_id drop not null;

drop policy if exists "Couple members can create memories" on public.memories;
create policy "Couple members can create memories"
on public.memories for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and uploaded_by = (select auth.uid())
  and (
    album_id is null
    or (select public.album_belongs_to_current_couple(album_id))
  )
);

drop policy if exists "Couple members can update their memories" on public.memories;
create policy "Couple members can update their memories"
on public.memories for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (
  couple_id = (select public.current_user_couple_id())
  and (
    album_id is null
    or (select public.album_belongs_to_current_couple(album_id))
  )
);
