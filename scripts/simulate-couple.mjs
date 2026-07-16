import { readFile } from "node:fs/promises";

function loadEnv(file) {
  const values = {};
  for (const line of file.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/gu, "");
  }
  return values;
}

const env = loadEnv(await readFile(".env.local", "utf8"));
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "DEV_DEMO_OWNER_EMAIL",
  "DEV_DEMO_OWNER_PASSWORD",
  "DEV_DEMO_PARTNER_EMAIL",
  "DEV_DEMO_PARTNER_PASSWORD",
];
const missing = required.filter((name) => !env[name]);
if (missing.length)
  throw new Error(`Eksik ortam değişkenleri: ${missing.join(", ")}`);

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message;
    throw new Error(
      `${response.status} ${path}${message ? `: ${message}` : ""}`,
    );
  }
  return data;
}

async function upsert(table, rows, conflict = "id") {
  return request(`/rest/v1/${table}?on_conflict=${conflict}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
}

async function ensureAuthUser(email, password, displayName, gender) {
  const result = await request("/auth/v1/admin/users?page=1&per_page=1000");
  const existing = (result?.users ?? []).find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
  if (existing) return existing.id;
  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName, gender },
    }),
  });
  return created.id;
}

try {
  await request("/rest/v1/couples?select=id&limit=1");
} catch (error) {
  if (String(error).includes("public.couples")) {
    throw new Error(
      "Supabase migration'ları uygulanmamış. Önce `npx supabase db push` çalıştırın, ardından `npm run simulate` komutunu tekrar deneyin.",
    );
  }
  throw error;
}

const ownerId = await ensureAuthUser(
  env.DEV_DEMO_OWNER_EMAIL,
  env.DEV_DEMO_OWNER_PASSWORD,
  "Mert",
  "male",
);
const partnerId = await ensureAuthUser(
  env.DEV_DEMO_PARTNER_EMAIL,
  env.DEV_DEMO_PARTNER_PASSWORD,
  "Elif",
  "female",
);

const coupleId = "11111111-1111-4111-8111-111111111111";
const albumId = "22222222-2222-4222-8222-222222222222";
const simulationInviteCode = "MERTELIF";

await upsert("couples", [
  {
    id: coupleId,
    name: "Mert & Elif",
    anniversary_date: "2024-06-15",
    invite_code: simulationInviteCode,
  },
]);
await upsert("profiles", [
  { id: ownerId, couple_id: coupleId, display_name: "Mert", role: "owner" },
  {
    id: partnerId,
    couple_id: coupleId,
    display_name: "Elif",
    role: "partner",
  },
]);
await upsert("albums", [
  {
    id: albumId,
    couple_id: coupleId,
    title: "İlk Anılarımız",
    cover_image: null,
  },
]);

const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
for (const [userId, fileName] of [
  [ownerId, "ilk-bulusma.png"],
  [partnerId, "sahil-anisi.png"],
]) {
  await request(
    `/storage/v1/object/memories/${coupleId}/${userId}/${fileName}`,
    {
      method: "POST",
      headers: { "Content-Type": "image/png", "x-upsert": "true" },
      body: pixel,
    },
  );
}
await upsert("memories", [
  {
    id: "33333333-3333-4333-8333-333333333331",
    album_id: albumId,
    couple_id: coupleId,
    uploaded_by: ownerId,
    image_url: `${coupleId}/${ownerId}/ilk-bulusma.png`,
    title: "İlk buluşmamız",
    description: "İkimizin de heyecandan ne söyleyeceğini unuttuğu gün.",
    location: "Kadıköy, İstanbul",
    memory_date: "2024-06-15",
  },
  {
    id: "33333333-3333-4333-8333-333333333332",
    album_id: albumId,
    couple_id: coupleId,
    uploaded_by: partnerId,
    image_url: `${coupleId}/${partnerId}/sahil-anisi.png`,
    title: "Sahil yürüyüşü",
    description: "Gün batımına kadar yürüyüp en sevdiğimiz şarkıları dinledik.",
    location: "Moda Sahili, İstanbul",
    memory_date: "2024-08-24",
  },
]);
await upsert("notes", [
  {
    id: "44444444-4444-4444-8444-444444444441",
    couple_id: coupleId,
    author_id: ownerId,
    title: "Bugün seni düşündüm",
    content: "Kahvemi alırken aklıma geldin. Akşam birlikte film seçelim mi?",
    color: "pink",
    pinned: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444442",
    couple_id: coupleId,
    author_id: partnerId,
    title: "Küçük hatırlatma",
    content: "Bir sonraki buluşmamız için o küçük kafeyi ayırttım. ❤️",
    color: "yellow",
    pinned: false,
  },
]);
await upsert("notifications", [
  {
    id: "55555555-5555-4555-8555-555555555551",
    couple_id: coupleId,
    sender_id: ownerId,
    receiver_id: partnerId,
    notification_type: "miss_you",
    title: "Seni Özledim",
    message: "Mert şu anda seni düşünüyor. ❤️",
    icon: "❤️",
    animation: "hearts",
    is_read: false,
  },
  {
    id: "55555555-5555-4555-8555-555555555552",
    couple_id: coupleId,
    sender_id: partnerId,
    receiver_id: ownerId,
    notification_type: "hug",
    title: "Sana sarıldım",
    message: "Elif sana sıcacık bir sarılma gönderdi.",
    icon: "🤗",
    animation: "hearts",
    is_read: true,
  },
]);
await upsert("events", [
  {
    id: "66666666-6666-4666-8666-666666666661",
    couple_id: coupleId,
    title: "İlk buluşmamız",
    description: "Her şeyin başladığı gün.",
    event_type: "first_date",
    event_date: "2024-06-15",
    repeat_yearly: true,
    created_by: ownerId,
  },
  {
    id: "66666666-6666-4666-8666-666666666662",
    couple_id: coupleId,
    title: "Bir sonraki seyahat",
    description: "Kapadokya için küçük bir kaçamak.",
    event_type: "travel",
    event_date: "2026-09-12",
    repeat_yearly: false,
    created_by: partnerId,
  },
]);
await upsert("countdowns", [
  {
    id: "77777777-7777-4777-8777-777777777771",
    couple_id: coupleId,
    title: "Kapadokya seyahatimiz",
    icon: "✈️",
    target_date: "2026-09-12T09:00:00+03:00",
    created_by: partnerId,
  },
]);
const bucketId = "88888888-8888-4888-8888-888888888881";
await upsert("bucket_lists", [
  {
    id: bucketId,
    couple_id: coupleId,
    title: "Birlikte yapmak istediklerimiz",
    description: "Küçük ve büyük hayallerimiz.",
    color: "rose",
    created_by: ownerId,
  },
]);
await upsert("bucket_items", [
  {
    id: "88888888-8888-4888-8888-888888888882",
    bucket_list_id: bucketId,
    couple_id: coupleId,
    title: "Kapadokya'da balon turu",
    priority: "high",
    position: 0,
    completed: false,
  },
  {
    id: "88888888-8888-4888-8888-888888888883",
    bucket_list_id: bucketId,
    couple_id: coupleId,
    title: "Birlikte yemek kursuna gitmek",
    priority: "medium",
    position: 1,
    completed: true,
    completed_at: "2025-02-08T18:30:00+03:00",
    completed_by: partnerId,
  },
]);
await upsert("journals", [
  {
    id: "99999999-9999-4999-8999-999999999991",
    couple_id: coupleId,
    author_id: ownerId,
    title: "Güzel bir yaz akşamı",
    content: "Bugün birlikte geçirdiğimiz her dakikayı saklamak istedim.",
    mood: "in_love",
    weather: "sunny",
    images: [],
  },
]);
await upsert("time_capsules", [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    couple_id: coupleId,
    author_id: partnerId,
    title: "Bir yıl sonraki bize",
    message: "Bu mesajı açtığınızda hâlâ birbirinize gülümsüyor olun.",
    attachments: [],
    unlock_date: "2027-06-15T00:00:00+03:00",
    opened: false,
  },
]);
await upsert(
  "user_settings",
  [
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", user_id: ownerId },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", user_id: partnerId },
  ],
  "user_id",
);

console.log("Simülasyon tamamlandı.");
console.log(`Çift: Mert & Elif | Davet kodu: ${simulationInviteCode}`);
console.log(
  "Modüller: anılar, notlar, bildirimler, takvim, sayaçlar, bucket list, günlük, zaman kapsülü, ayarlar.",
);
