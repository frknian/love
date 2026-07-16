create policy "Couple members can update their couple"
on public.couples for update to authenticated
using (id = (select public.current_user_couple_id()))
with check (id = (select public.current_user_couple_id()));
