-- Trigger fonksiyonu birden fazla tabloya bağlıdır. Her tabloyu ayrı dalda
-- ele alarak `quick_statuses` satırında bulunmayan `old.status` alanına
-- erişilmesini önler.
create or replace function public.record_social_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
  v_actor uuid;
  v_couple uuid;
  v_entity uuid;
begin
  if tg_table_name = 'mood_entries' then
    v_type := 'mood_updated';
    v_actor := new.created_by;
    v_couple := new.couple_id;
    v_entity := new.id;
  elsif tg_table_name = 'memory_highlights' then
    v_type := 'highlight_created';
    v_actor := new.created_by;
    v_couple := new.couple_id;
    v_entity := new.id;
  elsif tg_table_name = 'memory_highlight_items' then
    v_type := 'highlight_item_added';
    v_actor := new.created_by;
    v_couple := new.couple_id;
    v_entity := new.highlight_id;
  elsif tg_table_name = 'quick_statuses' then
    if new.status_type <> 'hunger' or not new.active then return new; end if;
    v_type := 'hunger_alert';
    v_actor := new.created_by;
    v_couple := new.couple_id;
    v_entity := new.id;
  elsif tg_table_name = 'plan_requests' then
    if tg_op = 'INSERT' then
      v_type := 'plan_proposed';
      v_actor := new.created_by;
    elsif old.status = 'pending' and new.status <> 'pending' then
      v_type := case
        when new.status = 'accepted' then 'plan_accepted'
        else 'plan_rejected'
      end;
      v_actor := new.recipient_id;
    else
      return new;
    end if;
    v_couple := new.couple_id;
    v_entity := new.id;
  else
    return new;
  end if;

  insert into public.activities(
    couple_id, actor_id, activity_type, entity_id, metadata
  ) values (v_couple, v_actor, v_type, v_entity, '{}'::jsonb);
  return new;
end;
$$;
