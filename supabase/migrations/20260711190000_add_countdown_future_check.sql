-- Geri sayımlar için de time_capsules ile tutarlı olacak şekilde
-- hedef tarihin oluşturulma anından ileride olmasını zorunlu kılar.
-- İstemci tarafı Zod doğrulaması zaten bunu uyguluyordu; bu, doğrudan
-- API/RPC çağrılarına karşı sunucu tarafı güvence sağlar.
alter table public.countdowns
  add constraint countdowns_target_date_future_check
  check (target_date > created_at);
