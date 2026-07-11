# Bizim Hikâyemiz

Çiftlerin ortak anılarını, notlarını ve özel anlarını zamanla tek bir yerde biriktirmesi için tasarlanmış mobil öncelikli PWA arayüzü.

## Teknolojiler

- Next.js 15 ve App Router
- TypeScript
- Tailwind CSS
- shadcn/ui uyumlu bileşen altyapısı
- Lucide Icons ve Framer Motion
- ESLint ve Prettier
- Web App Manifest ve Service Worker

## Kurulum

Node.js 20.9 veya üzerini kullanın.

```bash
npm install
```

Ardından örnek ortam değişkenlerini kopyalayın ve kendi Supabase proje bilgilerinizle doldurun:

```bash
cp .env.example .env.local
```

`.env.local` dosyasındaki `ALLOWED_USER_EMAILS` alanına yalnızca uygulamayı kullanacak iki e-posta adresini virgülle ayırarak ekleyin. `APP_OWNER_EMAIL`, bu iki kişiden `owner` rolüne sahip olanın adresidir; diğeri otomatik olarak `partner` olur.

## Supabase kurulumu ve giriş

1. [Supabase Dashboard](https://supabase.com/dashboard) üzerinde bir proje oluşturun.
2. **Connect** ekranından proje URL'sini ve publishable key'i alın. Eski projelerde anon key de kullanılabilir.
3. Bu değerleri sırasıyla `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` olarak `.env.local` dosyasına ekleyin.
4. Dashboard'da **Authentication > Providers > Email** ayarından yeni kullanıcı kayıtlarını kapatın.
5. **Authentication > Users** üzerinden iki kullanıcıyı e-posta/şifre ile manuel oluşturun. Bu e-postalar `ALLOWED_USER_EMAILS` ile birebir eşleşmelidir.
6. **Authentication > URL Configuration** içinde yerel geliştirme adresini (`http://localhost:3000`) ve production domain'inizi izinli yönlendirme adresleri olarak ekleyin.

Uygulama, Supabase SSR cookie tabanlı session yönetimini kullanır. Middleware her istekte oturumu yeniler; giriş yapmamış veya izinli listede olmayan kullanıcıları `/login` sayfasına yönlendirir. İzinli e-posta listesi yalnızca sunucu ortam değişkeninden okunur ve tarayıcıya gönderilmez.

## Database, RLS ve Anılar

`supabase/migrations/20260711140000_create_memories_schema.sql` aşağıdaki yapıyı kurar:

- `couples`, `profiles`, `albums` ve `memories` tabloları ile ilişkileri
- Tüm tablolarda RLS politikaları
- Private `memories` Storage bucket'ı; 10 MB'a kadar JPEG, PNG ve WebP dosyaları
- Dosyalar için `memories/{couple_id}/{user_id}/{uuid}` yol şeması

Migration'ı Supabase CLI ile uygulamak için:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

İlk kullanıcı çiftini oluşturmak için [`supabase/seed.example.sql`](/Users/furkan/Documents/AŞK/supabase/seed.example.sql) içindeki UUID ve isimleri Dashboard'daki Auth kullanıcılarınızla değiştirin; ardından SQL Editor'da bir kez çalıştırın. Bu başlangıç kaydı, iki kullanıcının aynı `couple_id` altında güvenli biçimde eşleşmesini sağlar.

Görseller private bucket'ta kalır; uygulama listeleme sırasında kısa süreli signed URL üretir. RLS hem veritabanında hem Storage nesnelerinde yalnızca aynı `couple_id` kapsamındaki erişime izin verir.

## Ortak notlar ve Realtime

`supabase/migrations/20260711150000_create_notes.sql`, `notes` tablosunu, RLS politikalarını, `updated_at` trigger'ını ve `supabase_realtime` yayınına eklemeyi içerir. Migration uygulandıktan sonra iki kullanıcı arasında ekleme, düzenleme ve silme olayları sayfa yenilenmeden senkronize olur.

İstemci tarafındaki `useNotes` hook'u çift kimliğiyle filtrelenen Postgres Changes kanalına abone olur. INSERT ve UPDATE olayları doğrudan yerel nota yazılır; DELETE olayında mevcut listedeki eşleşen kimlik kaldırılır. Kanal, bileşen ayrıldığında kapatılır ve geçici bağlantı sorunlarında kullanıcıya bilgi gösterilir.

Not erişimi RLS ile korunur: çift üyeleri notları okuyabilir ve silebilir; yalnızca notun yazarı içerik, renk ve sabitlenme durumunu güncelleyebilir.

## Duygusal Bildirimler, Takvim ve Geri Sayımlar

`supabase/migrations/20260711160000_create_engagement_schema.sql` üç yeni tabloyu kurar:

- `notifications`: çift içi duygusal etkileşimler (`notification_type`, `title`, `message`, `icon`, `animation`, `is_read`, `delivered_at`)
- `events`: özel günler ve planlar (`event_type`, `event_date`, `repeat_yearly`, opsiyonel `cover_image`)
- `countdowns`: geri sayımlar (`icon`, `target_date`, opsiyonel `cover_image`)

Üç tablo da RLS ile yalnızca aynı `couple_id` kapsamına açıktır ve `supabase_realtime` yayınına eklidir. Bildirimlerde ek güvenceler vardır: gönderen yalnızca kendi kimliğiyle, alıcı yalnızca aynı çiftin üyesi olacak şekilde ekleme yapılabilir (`profile_in_current_couple` yardımcı fonksiyonu); güncelleme yalnızca alıcıya açıktır ve bir trigger içerik alanlarının değiştirilmesini engeller — yalnızca `is_read` ve `delivered_at` değişebilir.

### Bildirim mimarisi

- **Etkileşim kataloğu** (`lib/notifications/interactions.ts`): 15 hazır duygusal etkileşim (Seni Özledim, Sarıldım, Öpücük, Çiçek, Kahve, Günaydın, İyi Geceler, Not, Anı, Sürpriz, Şarkı, Başarılar, Kutlama, Doğum Günü, Yıldönümü). Her kayıt ikon, animasyon anahtarı, renk sınıfları, başlık, açıklama ve titreşim deseni taşır. Yeni tip eklemek için kataloğa bir kayıt eklemek yeterlidir; hiçbir bileşen değişmez.
- **Gönderim** (`services/notifications/notifications-service.ts`): Zod ile doğrulanan insert; ardından push sağlayıcı katmanı tetiklenir.
- **Push hazırlığı** (`services/notifications/push-provider.ts`): `PushProvider` arayüzü ve şimdilik no-op sağlayıcı. Web Push/FCM eklemek istediğinizde yalnızca yeni bir sağlayıcı sınıfı yazılır; gönderim akışı değişmez.
- **Animasyonlar** (`components/notifications/notification-animation.tsx`): Framer Motion tabanlı parçacık sahneleri — uçan kalpler, düşen yapraklar, konfeti, ay-yıldız, güneş ışınları vb. Her animasyon anahtarı bir preset'e eşlenir.
- **Haptic feedback** (`lib/notifications/haptics.ts`): `navigator.vibrate` destekleyen cihazlarda bildirim tipine özgü titreşim desenleri.
- **Geçmiş ve filtreler** (`app/bildirimler`): Hepsi / Okunmayanlar / Gönderdiklerim / Bana Gelenler filtreleri; karta tıklanınca animasyonlu detay modalı açılır ve bildirim okundu işaretlenir.

### Realtime akışı

1. Gönderen, ana ekrandaki "Bugün ona ne göndermek istersin?" kartından bir etkileşime dokunur; kayıt `notifications` tablosuna yazılır.
2. `PageShell` içine monte edilen `RealtimeNotificationListener`, alıcının `receiver_id` filtresiyle Postgres Changes kanalını dinler.
3. INSERT geldiği anda alıcıda titreşim tetiklenir, `delivered_at` işaretlenir ve animasyonlu bildirim modalı açılır; modal kapatılınca bildirim okundu sayılır.
4. Bildirim geçmişi (`useNotifications`), takvim (`useEvents`) ve geri sayımlar (`useCountdowns`) aynı desenle couple kanallarına abone olur; iki cihaz sayfa yenilenmeden senkron kalır.
5. Header'daki zil (`NotificationBell`) okunmamış sayacını canlı günceller.

### Etkinlik sistemi

- `app/takvim` sayfası Ay / Hafta / Liste görünümleri sunar; ay görünümünde günler etkinlik tipine göre renkli noktalar taşır, seçilen günün etkinlikleri altta listelenir.
- 10 etkinlik türü (`lib/events/event-types.ts`): Doğum Günü, Yıldönümü, İlk Tanışma, İlk Buluşma, Seyahat, Tatil, Film Gecesi, Kahve Randevusu, Özel Gün, Diğer. Katalog tabanlıdır, kolayca genişletilir.
- FAB ile açılan bottom sheet'te başlık, açıklama, tarih, kategori, opsiyonel kapak görseli URL'si ve "her yıl tekrar etsin" seçeneği bulunur; Zod ile doğrulanır.
- Yıllık tekrar eden etkinlikler takvimde her yıla, liste görünümünde bir sonraki gerçekleşme tarihine yansıtılır (`lib/events/calendar.ts`).
- Detay modalı başlık, tarih, kalan gün, açıklama, oluşturan kişi ve kapak görselini gösterir; düzenleme ve silme buradan yapılır.

### Geri sayım sistemi

- `app/geri-sayimlar` sayfası kapak görselli kartlar halinde tüm geri sayımları listeler; her kartta kalan gün/saat/dakika/saniye canlı ilerler (`useNow` hook'u, sayfa yenilenmeden), oluşturulma anından hedefe yüzdelik ilerleme çubuğu bulunur.
- Ana sayfada en yakın geri sayımlar `💍 48 Gün` biçiminde yatay kart şeridinde gösterilir.
- Hesaplamalar `lib/countdowns/countdown-math.ts` içinde saf fonksiyonlardır: kalan süre ayrıştırma, yüzde ilerleme ve sıralama.

### Ana sayfa dashboard'u

Ana sayfa; etkileşim gönderme kartı, geri sayım şeridi ve özet kartlarla (Yaklaşan Etkinlikler, Son Etkileşim, Son Günlük, Bucket List İlerlemesi, Yaklaşan Time Capsule, Son Geri Sayım) gerçek verilerden beslenir.

## Bucket List, Ortak Günlük, Time Capsule, Profil, Ayarlar ve Tema

`supabase/migrations/20260711170000_create_lifestyle_schema.sql` beş yeni tabloyu kurar:

- `bucket_lists` / `bucket_items`: Liste başına kapak, renk; madde başına öncelik (`priority`), sıralama pozisyonu (`position`), tamamlanma bilgisi. `priority` ve `position` alanları madde 3-4'ün gerektirdiği ama tablo listesinde yer almayan alanlar olduğu için eklendi.
- `journals`: Ortak günlük kayıtları; `images` bir depolama yolu dizisi (jsonb) olarak tutulur.
- `time_capsules`: Başlık her zaman görünür; `message`/`attachments` kolonları `authenticated` rolünden `REVOKE` edilmiştir ve yalnızca `get_time_capsule_content()` adlı `security definer` fonksiyonu, `unlock_date <= now()` olduğunda bu kolonları döndürür. Bu, kuralın yalnızca arayüzde değil veritabanı seviyesinde zorunlu olmasını sağlar.
- `user_settings`: Tema, bildirim/titreşim/animasyon anahtarları, dil ve `notification_preferences` (9 bildirim türü için ayrı aç/kapat — madde 17 tablo alan listesinde yoktu, granüler tercih için eklendi).

### RLS politikaları

- `bucket_lists`, `bucket_items`, `journals`: mevcut `current_user_couple_id()` deseniyle çift kapsamı.
- `user_settings`: yalnızca `user_id = auth.uid()` — sahibi dışında kimse okuyamaz/güncelleyemez.
- `time_capsules`: satır her zaman görünür (metadata), ama kolon bazlı `REVOKE`/`GRANT` ile içerik gizlenir; güncelleme yalnızca `opened`/`opened_at` kolonlarına ve yalnızca `unlock_date <= now()` olduğunda izin verilir. Depolamada da aynı kural: `capsule_attachment_unlocked()` fonksiyonu, ek dosyalar için storage RLS'sinde açılma tarihi kontrolü yapar — ekler açılmadan indirilemez.
- `time_capsules` kasıtlı olarak `supabase_realtime` yayınına eklenmez: Postgres Changes payload'ları RLS'yi atlayabileceğinden mesaj içeriği sızabilir. Açılma anı bunun yerine istemci tarafında `useNow` ile zaman karşılaştırmasıyla saptanır (bkz. `hooks/use-capsule.ts`).

### Bucket List

`app/bucket-list` sayfası birden fazla liste oluşturmayı destekler (kapak görseli, 6 renkten biri). Liste detayında maddeler HTML5 native drag-and-drop ile sürüklenip bırakılabilir (`bucket_items.position` güncellenir); "Tamamlananları alta taşı" anahtarı `localStorage`'da saklanan isteğe bağlı bir sıralama ayarıdır. Her liste kartı tamamlanma yüzdesi, progress bar, tamamlanan/kalan madde sayısını gösterir; ana sayfada küçük bir özet kartı bulunur.

### Ortak Günlük

`app/gunluk` sayfası zaman çizelgesi (timeline) görünümünde günlük kayıtlarını listeler. Her kayıt başlık, içerik, tarih, yazan kişi, 7 ruh halinden biri (`lib/journal/journal-catalog.ts`) ve isteğe bağlı hava durumu/fotoğraflar taşır. Arama çubuğu başlık/içerik/yazan/tarih alanlarında filtreleyebilir (`hooks/use-journal.ts`).

### Time Capsule

`app/zaman-kapsulu` sayfası kilitli kartlar halinde kapsülleri listeler; açılma tarihinden önce yalnızca başlık, tarih ve oluşturan kişi görünür. Açılma anı geldiğinde konfeti + kalpler + blur geçişli bir kutlama modalı (`CapsuleUnlockModal`, mevcut `NotificationAnimation` motoru yeniden kullanılır) açılır; kullanıcı "Şimdi Aç" veya "Daha Sonra" seçebilir. Ekler (fotoğraf/video/PDF) `capsules` private bucket'ında saklanır ve yalnızca açıldıktan sonra indirilebilir.

### Profil ve İstatistikler

`app/profil`, çift adı, ilişki başlangıç tarihinden hesaplanan gün sayacı ve dört istatistik kartı (paylaşılan anı, yazılan not, gönderilen etkileşim, tamamlanan bucket maddesi) gösterir (`lib/profile/queries.ts`).

### Tema Sistemi

`ThemeProvider` (`components/settings/theme-provider.tsx`) açık/koyu/sistem temasını yönetir: tercih `user_settings.theme`'de saklanır, `prefers-color-scheme` değişikliklerini dinler ve `<html>` üzerinde `dark` class'ını değiştirir (Tailwind `darkMode:["class"]` ile uyumlu). `app/layout.tsx` içindeki senkron script, hydration öncesi doğru temayı uygulayarak flaş (FOUC) oluşmasını engeller.

**Kapsam notu**: Bu görevde eklenen tüm yeni modüller (Bucket List, Günlük, Time Capsule, Profil, Ayarlar) ve paylaşılan kabuk bileşenleri (`Card`, `AppHeader`, `BottomNavigation`, `globals.css`) tam karanlık tema desteğiyle yazıldı. Daha önceki promptlarda (Notlar, Anılar, Takvim, Geri Sayımlar, Bildirimler) sabit `slate-*`/`rose-*` renkleriyle yazılmış sayfalar bu görev kapsamında geriye dönük olarak karanlık temaya uyarlanmadı; bu sayfalar açık temada beklendiği gibi çalışmaya devam eder ama koyu modda ayrı bir geçiş gerektirir.

### Ayarlar

`app/ayarlar` tema seçici, bildirim/animasyon/titreşim anahtarları, dil seçici (TR/EN), 9 bildirim türü için ayrı aç/kapat listesi ve oturum kapatma bölümünü içerir. Tüm değişiklikler `useSettings` hook'u üzerinden anında kaydedilir ve başarı/hata durumları toast ile bildirilir (`components/ui/toast-provider.tsx`).

### Global Arama

Header'daki arama ikonu (`components/search/global-search-button.tsx`) Anılar, Notlar, Günlük, Bucket List ve Etkinlikler tablolarında paralel `ilike` sorguları çalıştırır (`services/search/global-search-service.ts`); sonuçlar kategoriye göre gruplanıp linklenir. RLS zaten çift kapsamını uyguladığı için sorgular ek bir yetkilendirme filtresi gerektirmez.

### Navigasyon değişikliği

Modül sayısı arttıkça alt navigasyon taşacağından, sabit 4 sekme (Ana Sayfa, Takvim, Anılar, Profil) + genişleyebilir bir "Diğer" bottom sheet'e geçildi (`components/navigation/more-menu-sheet.tsx`). Diğer menüsü Notlar, Ortak Günlük, Bucket List, Zaman Kapsülü, Geri Sayımlar, Bildirimler ve Ayarlar'ı listeler; yeni modüller buraya tek satırla eklenir.

## Çalıştırma

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır. Mobil tarayıcıdan “Ana Ekrana Ekle” seçeneğiyle kurulabilir.

## Production build

```bash
npm run build
npm run start
```

Kod kalitesi kontrolleri:

```bash
npm run lint
npm run format:check
```

## Production hazırlığı

Uygulama private bir çift alanı olduğu için arama motorları `robots.ts` ile engellenir. Production deploy öncesi aşağıdaki komutların tamamı başarılı olmalıdır:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### PWA, offline ve güncellemeler

- Service worker; uygulama kabuğu ve statik varlıklarda **Cache First**, rota geçişlerinde **Network First**, görsel/Next image kaynaklarında **Stale While Revalidate** uygular.
- Kullanıcı çevrimdışıyken son görüntülenen ekranlar cache'den gösterilir; hiç cache yoksa `/offline` ekranı açılır.
- Yeni service worker beklemeye alındığında kullanıcıya “Güncelleme hazır” uyarısı verilir. Onaydan sonra uygulama güvenli biçimde yenilenir.
- Çevrimdışıyken oluşturulan notlar cihazın IndexedDB kuyruğuna alınır ve bağlantı geldiğinde tekrar gönderilir. Service worker, destekleyen tarayıcılarda senkronizasyon isteğini açık istemciye iletir; Supabase oturum anahtarları service worker içinde saklanmaz.
- Çıkışta private runtime ve görsel cache'leri temizlenir.

### Güvenlik

- Supabase RLS; tüm çift verilerini `couple_id` kapsamında izole eder. Storage bucket'ları private'tır.
- Production header'ları CSP, HSTS, `nosniff`, frame engelleme, sıkı referrer ve izin politikalarını içerir.
- Girdi doğrulaması tüm yazma servislerinde Zod ile yapılır; dosya türü/boyutu istemci ve Storage politikaları tarafından sınırlandırılır.
- `lib/security/rate-limit.ts`, ileride Route Handler veya Server Action eklendiğinde bir Redis/Vercel KV adaptörüyle değiştirilebilecek bellek içi geliştirme katmanıdır. Çoklu Vercel instance'larında tek başına dağıtık rate limiting sağlamaz.
- `lib/monitoring/logger.ts`, token/şifre/secret alanlarını loglardan ayıklayan Sentry uyumlu bir soyutlama sağlar.

### Test ve CI

Unit testler saf geri sayım hesaplarını, not doğrulamasını ve rate limit davranışını kapsar. GitHub Actions iş akışı her push ve pull request'te `npm ci`, lint, typecheck, test ve build çalıştırır: [ci.yml](/Users/furkan/Documents/AŞK/.github/workflows/ci.yml).

## Vercel'e deploy

1. Projeyi GitHub, GitLab veya Bitbucket'a gönderin.
2. [Vercel](https://vercel.com/new) üzerinde depoyu içe aktarın.
3. Vercel proje ayarlarında **Environment Variables** bölümüne `.env.local` içindeki dört değişkeni ekleyin.
4. Supabase **Authentication > URL Configuration** ayarlarına Vercel production URL'nizi ekleyin.
5. Framework olarak Next.js otomatik seçilir; **Deploy** seçeneğine basın.

## Mimari

- `app/`: App Router rotaları ve uygulama kabuğu
- `components/`: Tek sorumluluklu, tekrar kullanılabilir arayüz bileşenleri
- `lib/`: Yardımcı fonksiyonlar ve geçici mock veri
- `types/`: Paylaşılan TypeScript modelleri
- `public/`: PWA manifest, service worker, ikonlar ve statik varlıklar
- `lib/supabase/`: Tarayıcı, sunucu ve middleware için ayrı Supabase istemcileri
- `components/auth/`: Giriş, çıkış, profil ve istemci tarafı auth durum bileşenleri
- `components/memories/`: Albüm oluşturma, fotoğraf yükleme ve anı kartları
- `components/notes/`: Not kartları, bottom sheet formu ve not çalışma alanı
- `components/notifications/`: Etkileşim kartı, bildirim geçmişi, detay modalı, animasyon motoru, zil ve global realtime dinleyici
- `components/events/`: Takvim görünümleri (ay/hafta/liste), etkinlik formu ve detay modalı
- `components/countdowns/`: Geri sayım kartları, canlı sayaç ve oluşturma formu
- `components/bucket/`: Liste kartı/formu, madde satırı (drag-and-drop), liste detayı ve genel workspace
- `components/journal/`: Zaman çizelgesi kartı, arama çubuğu, yazma formu ve detay modalı
- `components/capsule/`: Kilitli kart, açılma kutlaması, içerik modalı ve oluşturma formu
- `components/profile/`: Çift bilgisi kartı ve istatistik grid'i
- `components/settings/`: Tema sağlayıcı/anahtarı, dil seçici, bildirim tercihleri ve genel toggle satırı
- `components/search/`: Global arama butonu ve diyaloğu
- `components/navigation/`: Alt navigasyon ve genişleyebilir "Diğer" bottom sheet
- `hooks/`: `useNotifications`, `useEvents`, `useCountdowns`, `useBucketList`, `useJournal`, `useCapsule`, `useSettings`, `useNow` dahil tekrar kullanılabilir React hook'ları
- `lib/notifications/`, `lib/events/`, `lib/countdowns/`, `lib/bucket/`, `lib/journal/`, `lib/capsule/`, `lib/settings/`, `lib/profile/`: Kataloglar, mapper'lar, tema/tarih hesaplamaları ve sunucu sorguları
- `services/notes/`: Zod ile doğrulanan not yazma işlemleri
- `services/notifications/`: Bildirim gönderimi, okundu/teslim işaretleme ve push sağlayıcı soyutlaması
- `services/events/`, `services/countdowns/`: Zod ile doğrulanan etkinlik ve geri sayım yazma işlemleri
- `services/bucket/`, `services/journal/`, `services/capsule/`, `services/settings/`: Zod ile doğrulanan yazma işlemleri ve dosya yükleme akışları
- `services/search/`: Global arama sorgu servisi
- `supabase/migrations/`: Şemayı, RLS'yi ve Storage politikalarını sürümlü biçimde oluşturan SQL migration'ları

### Migration adımları

Beş migration sıralı çalışır: çekirdek şema (`...140000`), notlar (`...150000`), bildirim/etkinlik/geri sayım (`...160000`), bucket list/günlük/time capsule/ayarlar (`...170000`) ve couple/profile ilişkisel bütünlük kısıtları (`...180000`).

```bash
npx supabase db push
```

Yeni migration ayrıca `journal-media` (10 MB, görsel) ve `capsules` (50 MB, görsel/video/PDF) private Storage bucket'larını ve bunların RLS politikalarını oluşturur.

Yeni tabloların Realtime yayını migration içinde tanımlıdır; ek Dashboard ayarı gerekmez.
