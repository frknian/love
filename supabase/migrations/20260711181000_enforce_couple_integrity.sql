-- RLS'ye ek olarak ilişkisel bütünlük: bir kaydın profil/üst kaydı aynı couple_id'de olmalı.

alter table public.profiles
  add constraint profiles_id_couple_id_key unique (id, couple_id);

alter table public.memories
  add constraint memories_uploaded_by_couple_id_fkey
  foreign key (uploaded_by, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.notes
  add constraint notes_author_id_couple_id_fkey
  foreign key (author_id, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.notifications
  add constraint notifications_sender_id_couple_id_fkey
  foreign key (sender_id, couple_id)
  references public.profiles(id, couple_id) on delete cascade,
  add constraint notifications_receiver_id_couple_id_fkey
  foreign key (receiver_id, couple_id)
  references public.profiles(id, couple_id) on delete cascade;

alter table public.events
  add constraint events_created_by_couple_id_fkey
  foreign key (created_by, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.countdowns
  add constraint countdowns_created_by_couple_id_fkey
  foreign key (created_by, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.bucket_lists
  add constraint bucket_lists_id_couple_id_key unique (id, couple_id),
  add constraint bucket_lists_created_by_couple_id_fkey
  foreign key (created_by, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.bucket_items
  add constraint bucket_items_list_couple_id_fkey
  foreign key (bucket_list_id, couple_id)
  references public.bucket_lists(id, couple_id) on delete cascade;

alter table public.journals
  add constraint journals_author_id_couple_id_fkey
  foreign key (author_id, couple_id)
  references public.profiles(id, couple_id) on delete restrict;

alter table public.time_capsules
  add constraint time_capsules_author_id_couple_id_fkey
  foreign key (author_id, couple_id)
  references public.profiles(id, couple_id) on delete restrict;
