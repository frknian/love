-- Replace the placeholders with IDs from Authentication > Users, then run once in Supabase SQL Editor.
insert into public.couples (id, name, anniversary_date)
values ('00000000-0000-0000-0000-000000000000', 'Bizim Hikâyemiz', '2025-01-01');

insert into public.profiles (id, couple_id, display_name)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Owner'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Partner');
