-- Günlük mod, hızlı durum, plan önerisi ve çoktan-çoğa anı öne çıkanları.
create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null,
  mood text not null check (mood in (
    'good','happy','great','in_love','excited','calm','tired','sleepy',
    'bad','sad','low','stressed','angry','missing','sick','period'
  )),
  created_at timestamptz not null default now(),
  foreign key (created_by, couple_id)
    references public.profiles(id, couple_id) on delete cascade
);
create index mood_entries_couple_user_created_idx
  on public.mood_entries(couple_id, created_by, created_at desc);

create table public.quick_statuses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null,
  status_type text not null check (status_type in ('period','hunger','bored')),
  details text check (details is null or char_length(details) <= 160),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, status_type),
  foreign key (created_by, couple_id)
    references public.profiles(id, couple_id) on delete cascade
);
create index quick_statuses_couple_active_idx
  on public.quick_statuses(couple_id, active, updated_at desc);
create trigger set_quick_statuses_updated_at before update on public.quick_statuses
for each row execute procedure public.set_updated_at();

create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null,
  recipient_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  plan_date date not null,
  plan_time time,
  meeting_type text not null check (meeting_type in ('online','in_person')),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected')),
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (created_by <> recipient_id),
  foreign key (created_by, couple_id)
    references public.profiles(id, couple_id) on delete cascade,
  foreign key (recipient_id, couple_id)
    references public.profiles(id, couple_id) on delete cascade
);
create index plan_requests_couple_created_idx
  on public.plan_requests(couple_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'memories_id_couple_id_key'
  ) then
    alter table public.memories
      add constraint memories_id_couple_id_key unique (id, couple_id);
  end if;
end;
$$;

create table public.memory_highlights (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 60),
  cover_memory_id uuid,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, couple_id),
  foreign key (created_by, couple_id)
    references public.profiles(id, couple_id) on delete restrict,
  foreign key (cover_memory_id, couple_id)
    references public.memories(id, couple_id)
    on delete set null (cover_memory_id)
);
create trigger set_memory_highlights_updated_at
before update on public.memory_highlights
for each row execute procedure public.set_updated_at();
create index memory_highlights_couple_position_idx
  on public.memory_highlights(couple_id, position, created_at);

create table public.memory_highlight_items (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null,
  couple_id uuid not null references public.couples(id) on delete cascade,
  memory_id uuid not null,
  position integer not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (highlight_id, memory_id),
  foreign key (highlight_id, couple_id)
    references public.memory_highlights(id, couple_id) on delete cascade,
  foreign key (memory_id, couple_id)
    references public.memories(id, couple_id) on delete cascade,
  foreign key (created_by, couple_id)
    references public.profiles(id, couple_id) on delete restrict
);
create index memory_highlight_items_group_position_idx
  on public.memory_highlight_items(highlight_id, position, created_at);

alter table public.mood_entries enable row level security;
alter table public.quick_statuses enable row level security;
alter table public.plan_requests enable row level security;
alter table public.memory_highlights enable row level security;
alter table public.memory_highlight_items enable row level security;

grant select, insert on public.mood_entries to authenticated;
grant select, insert, update, delete on public.quick_statuses to authenticated;
grant select, insert on public.plan_requests to authenticated;
grant select, insert, update, delete on public.memory_highlights to authenticated;
grant select, insert, update, delete on public.memory_highlight_items to authenticated;

create policy "Couple members read moods" on public.mood_entries for select
to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Users create own moods" on public.mood_entries for insert
to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);
create policy "Couple members read quick statuses" on public.quick_statuses
for select to authenticated
using (couple_id = (select public.current_user_couple_id()));
create policy "Users create own quick statuses" on public.quick_statuses
for insert to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);
create policy "Users update own quick statuses" on public.quick_statuses
for update to authenticated using (created_by = (select auth.uid()))
with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);
create policy "Users delete own quick statuses" on public.quick_statuses
for delete to authenticated using (created_by = (select auth.uid()));
create policy "Couple members read plans" on public.plan_requests for select
to authenticated using (couple_id = (select public.current_user_couple_id()));
create policy "Users propose plans" on public.plan_requests for insert
to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
  and (select public.profile_in_current_couple(recipient_id))
);
create policy "Couple members read highlights" on public.memory_highlights
for select to authenticated
using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members create highlights" on public.memory_highlights
for insert to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);
create policy "Couple members update highlights" on public.memory_highlights
for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));
create policy "Couple members delete highlights" on public.memory_highlights
for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members read highlight items"
on public.memory_highlight_items for select to authenticated
using (couple_id = (select public.current_user_couple_id()));
create policy "Couple members create highlight items"
on public.memory_highlight_items for insert to authenticated with check (
  couple_id = (select public.current_user_couple_id())
  and created_by = (select auth.uid())
);
create policy "Couple members update highlight items"
on public.memory_highlight_items for update to authenticated
using (couple_id = (select public.current_user_couple_id()))
with check (couple_id = (select public.current_user_couple_id()));
create policy "Couple members delete highlight items"
on public.memory_highlight_items for delete to authenticated
using (couple_id = (select public.current_user_couple_id()));

create or replace function public.respond_to_plan(
  p_plan_id uuid,
  p_response text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_plan public.plan_requests;
  v_event_id uuid;
begin
  if p_response not in ('accepted','rejected') then
    raise exception 'Geçersiz plan yanıtı.';
  end if;
  select * into v_plan from public.plan_requests
  where id = p_plan_id for update;
  if v_plan.id is null
    or v_plan.recipient_id <> auth.uid()
    or v_plan.couple_id <> public.current_user_couple_id() then
    raise exception 'Bu planı yanıtlama yetkin yok.';
  end if;
  if v_plan.status <> 'pending' then raise exception 'Plan zaten yanıtlandı.'; end if;
  if p_response = 'accepted' then
    insert into public.events (
      couple_id, title, description, event_type, event_date,
      repeat_yearly, created_by
    ) values (
      v_plan.couple_id,
      v_plan.title,
      concat_ws(' · ', v_plan.description, case
        when v_plan.meeting_type = 'online' then 'Online plan'
        else 'Yüz yüze plan' end,
        case when v_plan.plan_time is not null
          then to_char(v_plan.plan_time, 'HH24:MI') end),
      'special', v_plan.plan_date, false, v_plan.created_by
    ) returning id into v_event_id;
  end if;
  update public.plan_requests set
    status = p_response,
    event_id = v_event_id,
    responded_at = now()
  where id = p_plan_id;
  return v_event_id;
end;
$$;
revoke execute on function public.respond_to_plan(uuid, text) from public;
grant execute on function public.respond_to_plan(uuid, text) to authenticated;

create or replace function public.record_social_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type text;
  v_actor uuid;
  v_couple uuid;
  v_entity uuid;
begin
  if tg_table_name = 'mood_entries' then
    v_type := 'mood_updated'; v_actor := new.created_by;
    v_couple := new.couple_id; v_entity := new.id;
  elsif tg_table_name = 'memory_highlights' then
    v_type := 'highlight_created'; v_actor := new.created_by;
    v_couple := new.couple_id; v_entity := new.id;
  elsif tg_table_name = 'memory_highlight_items' then
    v_type := 'highlight_item_added'; v_actor := new.created_by;
    v_couple := new.couple_id; v_entity := new.highlight_id;
  elsif tg_table_name = 'quick_statuses'
    and new.status_type = 'hunger' and new.active then
    v_type := 'hunger_alert'; v_actor := new.created_by;
    v_couple := new.couple_id; v_entity := new.id;
  elsif tg_table_name = 'plan_requests' and tg_op = 'INSERT' then
    v_type := 'plan_proposed'; v_actor := new.created_by;
    v_couple := new.couple_id; v_entity := new.id;
  elsif tg_table_name = 'plan_requests'
    and old.status = 'pending' and new.status <> 'pending' then
    v_type := case when new.status = 'accepted'
      then 'plan_accepted' else 'plan_rejected' end;
    v_actor := new.recipient_id; v_couple := new.couple_id; v_entity := new.id;
  else
    return new;
  end if;
  insert into public.activities(
    couple_id, actor_id, activity_type, entity_id, metadata
  ) values (v_couple, v_actor, v_type, v_entity, '{}'::jsonb);
  return new;
end;
$$;
create trigger record_mood_activity after insert on public.mood_entries
for each row execute procedure public.record_social_activity();
create trigger record_quick_status_activity
after insert or update on public.quick_statuses
for each row execute procedure public.record_social_activity();
create trigger record_plan_activity
after insert or update on public.plan_requests
for each row execute procedure public.record_social_activity();
create trigger record_highlight_activity
after insert on public.memory_highlights
for each row execute procedure public.record_social_activity();
create trigger record_highlight_item_activity
after insert on public.memory_highlight_items
for each row execute procedure public.record_social_activity();

alter table public.activities
  drop constraint if exists activities_activity_type_check;
alter table public.activities add constraint activities_activity_type_check
check (activity_type in (
  'memory_added','story_updated','event_created','goal_completed',
  'watch_item_added','watch_item_completed','game_completed','location_updated',
  'mood_updated','highlight_created','highlight_item_added',
  'hunger_alert','plan_proposed','plan_accepted','plan_rejected'
));

alter table public.mood_entries replica identity full;
alter table public.quick_statuses replica identity full;
alter table public.plan_requests replica identity full;
alter table public.memory_highlights replica identity full;
alter table public.memory_highlight_items replica identity full;
alter publication supabase_realtime add table public.mood_entries;
alter publication supabase_realtime add table public.quick_statuses;
alter publication supabase_realtime add table public.plan_requests;
alter publication supabase_realtime add table public.memory_highlights;
alter publication supabase_realtime add table public.memory_highlight_items;

update public.user_settings set notification_preferences =
  notification_preferences || '{
    "mood_changed": true,
    "partner_call": true,
    "hunger_alert": true,
    "plan_request": true,
    "plan_response": true,
    "highlight_memory": true
  }'::jsonb;
