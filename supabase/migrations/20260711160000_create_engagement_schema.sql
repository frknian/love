-- Duygusal bildirimler, etkinlik takvimi ve geri sayımlar.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (char_length(trim(notification_type)) between 1 and 60),
  title text not null check (char_length(trim(title)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 500),
  icon text not null check (char_length(trim(icon)) between 1 and 16),
  animation text not null check (char_length(trim(animation)) between 1 and 60),
  is_read boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  event_type text not null check (char_length(trim(event_type)) between 1 and 60),
  event_date date not null,
  repeat_yearly boolean not null default false,
  cover_image text check (cover_image is null or char_length(cover_image) <= 2048),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.countdowns (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  icon text not null default '⏳' check (char_length(trim(icon)) between 1 and 16),
  target_date timestamptz not null,
  cover_image text check (cover_image is null or char_length(cover_image) <= 2048),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index notifications_couple_id_created_at_idx
  on public.notifications(couple_id, created_at desc);
create index notifications_receiver_unread_idx
  on public.notifications(receiver_id) where is_read = false;
create index events_couple_id_event_date_idx
  on public.events(couple_id, event_date);
create index countdowns_couple_id_target_date_idx
  on public.countdowns(couple_id, target_date);

-- Bildirim alıcısının aynı çiftin üyesi olduğunu doğrular.
create or replace function public.profile_in_current_couple(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and couple_id = (select public.current_user_couple_id())
  )
$$;

revoke execute on function public.profile_in_current_couple(uuid) from public;
grant execute on function public.profile_in_current_couple(uuid) to authenticated;

-- Güncellemede yalnızca okunma durumunun değişmesine izin verir; içerik sabit kalır.
create or replace function public.protect_notification_content()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.couple_id is distinct from old.couple_id
    or new.sender_id is distinct from old.sender_id
    or new.receiver_id is distinct from old.receiver_id
    or new.notification_type is distinct from old.notification_type
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.icon is distinct from old.icon
    or new.animation is distinct from old.animation
    or new.created_at is distinct from old.created_at then
    raise exception 'Bildirim içeriği güncellenemez; yalnızca okunma durumu değişebilir.';
  end if;
  return new;
end;
$$;

create trigger protect_notification_content
before update on public.notifications
for each row execute procedure public.protect_notification_content();

alter table public.notifications enable row level security;
alter table public.events enable row level security;
alter table public.countdowns enable row level security;

grant select, insert, update on public.notifications to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.countdowns to authenticated;

-- notifications
create policy "Couple members can read notifications"
on public.notifications for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Members can send notifications to their partner"
on public.notifications for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and sender_id = (select auth.uid())
  and (select public.profile_in_current_couple(receiver_id))
);

create policy "Receivers can update read state"
on public.notifications for update to authenticated
using (receiver_id = (select auth.uid()))
with check (
  couple_id = (select public.current_user_couple_id())
  and receiver_id = (select auth.uid())
);

-- events
create policy "Couple members can read events"
on public.events for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create events"
on public.events for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);

create policy "Couple members can update events"
on public.events for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can delete events"
on public.events for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

-- countdowns
create policy "Couple members can read countdowns"
on public.countdowns for select to authenticated
using (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can create countdowns"
on public.countdowns for insert to authenticated
with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);

create policy "Couple members can update countdowns"
on public.countdowns for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));

create policy "Couple members can delete countdowns"
on public.countdowns for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

alter table public.notifications replica identity full;
alter table public.events replica identity full;
alter table public.countdowns replica identity full;

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.countdowns;
