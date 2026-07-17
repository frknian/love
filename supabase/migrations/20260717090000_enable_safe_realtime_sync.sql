-- Realtime yalnızca RLS ile okunabilen, hassas içerik taşımayan metadata
-- tablolarında etkinleştirilir. time_capsules özellikle hariç tutulur:
-- mesaj ve ek payload'ları canlı akışa hiç girmez.
alter table public.albums replica identity full;
alter table public.memories replica identity full;
alter table public.couples replica identity full;
alter table public.profiles replica identity full;
alter table public.user_settings replica identity full;

alter publication supabase_realtime add table public.albums;
alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.couples;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.user_settings;

-- İstemci yalnızca düzenleyebileceği alanları değiştirebilsin.
revoke update (couple_id, role, created_at) on public.profiles from authenticated;
revoke update (invite_code, created_at) on public.couples from authenticated;
