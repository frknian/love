-- Anı fotoğrafına dokunan her çift üyesi başlık, açıklama, konum ve tarihi
-- güncelleyebilir; fotoğrafın yükleyicisi değiştirilemez.
drop policy if exists "Uploaders can update their memories" on public.memories;
drop policy if exists "Couple members can update their memories" on public.memories;

revoke update (uploaded_by) on public.memories from authenticated;

create policy "Couple members can update their memories"
on public.memories for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (
  couple_id = (select public.current_user_couple_id())
  and (select public.album_belongs_to_current_couple(album_id))
);
