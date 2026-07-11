create table public.notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  color text not null default 'yellow' check (color in ('yellow', 'pink', 'blue', 'green', 'purple')),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_couple_id_pinned_updated_at_idx on public.notes(couple_id, pinned desc, updated_at desc);
create index notes_author_id_idx on public.notes(author_id);

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_notes_updated_at
before update on public.notes
for each row execute procedure public.set_notes_updated_at();

alter table public.notes enable row level security;

grant select, insert, update, delete on public.notes to authenticated;

create policy "Couple members can read notes"
on public.notes for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create their notes"
on public.notes for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and author_id = (select auth.uid())
);

create policy "Authors can update their notes"
on public.notes for update to authenticated
using (author_id = (select auth.uid()))
with check (
  couple_id = (select public.current_user_couple_id())
  and author_id = (select auth.uid())
);

create policy "Couple members can delete notes"
on public.notes for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

alter table public.notes replica identity full;
alter publication supabase_realtime add table public.notes;
