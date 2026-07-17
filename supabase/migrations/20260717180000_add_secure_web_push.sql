-- Safari, iOS ve standart Push API cihaz abonelikleri.
-- Endpoint ve şifreleme anahtarları yalnızca cihaz sahibine açıktır.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique
    check (char_length(endpoint) between 20 and 4096),
  expiration_time bigint,
  p256dh text not null check (char_length(p256dh) between 20 and 512),
  auth text not null check (char_length(auth) between 8 and 256),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute procedure public.set_updated_at();

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete
  on public.push_subscriptions to authenticated;

create policy "Users can read their push subscriptions"
on public.push_subscriptions for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their push subscriptions"
on public.push_subscriptions for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their push subscriptions"
on public.push_subscriptions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their push subscriptions"
on public.push_subscriptions for delete to authenticated
using (user_id = (select auth.uid()));

-- Partnerler ve tarayıcı istemcileri başka kullanıcıların push
-- endpoint'lerini hiçbir sorguyla göremez. Gönderim yalnızca server-side
-- secret ile çalışan Route Handler üzerinden yapılır.
