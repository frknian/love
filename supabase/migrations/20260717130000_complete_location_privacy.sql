alter table public.couple_locations
  add column if not exists accuracy_meters double precision
    check (accuracy_meters is null or accuracy_meters >= 0),
  add column if not exists background_updates_enabled boolean not null default false,
  add column if not exists share_last_seen boolean not null default true,
  add column if not exists platform text not null default 'web'
    check (platform in ('web', 'android', 'ios'));

grant delete on public.couple_locations to authenticated;
create policy "Users can delete their location"
on public.couple_locations for delete to authenticated
using (user_id = (select auth.uid()));

revoke update (user_id, couple_id) on public.couple_locations from authenticated;
