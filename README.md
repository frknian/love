# Bizim Hikâyemiz · Our Story

> A private, real-time shared space for couples to preserve memories, plan meaningful moments, and stay connected.
>
> Çiftlerin anılarını saklayabildiği, özel anlarını planlayabildiği ve bağlarını canlı tutabildiği gizli, gerçek zamanlı ortak alan.

[English](#english) · [Türkçe](#türkçe)

---

## English

### Overview

Bizim Hikâyemiz is a mobile-first Progressive Web App built for two people. Each account belongs to a private couple space created through a secure invitation flow. Memories, notes, plans, interactions, and profile information are synchronized between both partners in real time.

The application combines a polished mobile experience with a security model enforced at the database and storage layers. Couple data is isolated with Supabase Row Level Security, media is stored in private buckets, and access is scoped to authenticated members of the same couple.

### Highlights

- **Secure couple pairing:** create a private couple space or join one with a unique invitation code.
- **Shared couple profile:** names, profile photo, relationship date, automatic day count, story, highlights, and statistics.
- **Memories and albums:** upload, browse, favorite, edit, and organize private photos.
- **Notes and shared journal:** write together with live updates and offline note recovery.
- **Calendar and countdowns:** manage important dates, recurring events, meetings, and milestones.
- **Emotional interactions:** send expressive in-app interactions with animations, haptics, unread state, and live delivery.
- **Browser notifications:** a user-controlled notification permission flow and infrastructure for web interactions.
- **Privacy-focused distance:** optional, battery-conscious location updates that show distance and freshness—never raw coordinates in the interface.
- **Bucket lists and time capsules:** track shared goals and keep messages or attachments locked until a chosen date.
- **Mood and quick status:** share lightweight personal states with partner-aware visibility and database-backed authorization.
- **Installable PWA:** responsive design, offline fallback, update prompts, and home-screen installation support.

### Technology

| Area               | Stack                                        |
| ------------------ | -------------------------------------------- |
| Application        | Next.js 15, React 19, App Router             |
| Language           | TypeScript                                   |
| Styling and motion | Tailwind CSS, Framer Motion, Lucide Icons    |
| Backend            | Supabase Auth, PostgreSQL, Storage, Realtime |
| Validation         | Zod                                          |
| Testing            | Vitest, ESLint, TypeScript                   |
| PWA                | Web App Manifest, Service Worker, IndexedDB  |

### Architecture

```text
app/                  Routes, layouts, loading and error boundaries
components/           Feature-oriented interface components
hooks/                Client state and realtime subscriptions
lib/                  Queries, validation, mapping and domain utilities
services/             Feature services and write operations
supabase/migrations/  Schema, functions, triggers and RLS policies
tests/unit/            Unit and regression tests
public/                PWA assets and service worker
```

UI components delegate mutations to typed services, reusable hooks manage client state and filtered realtime channels, and database policies remain the final authorization boundary.

### Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- Supabase CLI for database migrations

### Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your public Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

4. Link the database and apply migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

5. In Supabase Authentication settings, enable email registration and add `http://localhost:3000` to the allowed redirect URLs.

6. Start the application:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000` in your browser.

### Optional demo accounts

Development-only demo login can be configured in `.env.local`. These accounts must already exist in Supabase and have profile records associated with a couple.

```env
DEV_DEMO_OWNER_EMAIL=
DEV_DEMO_OWNER_PASSWORD=
DEV_DEMO_PARTNER_EMAIL=
DEV_DEMO_PARTNER_PASSWORD=
```

Create or refresh isolated demo data with `npm run simulate`. The demo login endpoint is disabled in production, and credentials are never exposed to the browser.

### Scripts

| Command                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the development server         |
| `npm run build`        | Create an optimized production build |
| `npm run start`        | Serve the production build           |
| `npm run lint`         | Run static analysis                  |
| `npm run typecheck`    | Validate TypeScript types            |
| `npm test`             | Run the test suite once              |
| `npm run test:watch`   | Run tests in watch mode              |
| `npm run format`       | Format the project                   |
| `npm run format:check` | Check formatting without changes     |
| `npm run simulate`     | Create or update isolated demo data  |

### Security and privacy

- Couple-owned tables are protected by Row Level Security.
- Reads and writes are restricted to authenticated members of the same couple.
- Invitation functions validate membership, capacity, and duplicate profiles on the server.
- Private media uses couple- and user-scoped paths with short-lived signed URLs.
- Location sharing is opt-in; the interface exposes distance and freshness, not exact coordinates.
- Gender data is used only for feature authorization and is not displayed in shared views.
- Sensitive time-capsule content remains inaccessible until its unlock date.
- Production headers enforce HTTPS, content restrictions, frame protection, referrer policy, and explicit browser permissions.
- Service workers do not store Supabase sessions or secrets.

> Client-side checks improve the experience; database policies and validated server-side functions enforce access control.

### Quality checks

Run the complete verification suite before publishing:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Continuous integration runs the same core checks for every push and pull request.

### Production deployment

Build the application with `npm run build` and deploy it to any hosting platform that supports Next.js. Configure the public Supabase variables in the hosting environment, use HTTPS, and add the production domain to the allowed redirect URLs in Supabase Authentication settings.

Never commit `.env.local`, service-role keys, demo passwords, or any other secret.

---

## Türkçe

### Genel Bakış

Bizim Hikâyemiz, iki kişi için geliştirilmiş mobil öncelikli bir Progressive Web App'tir. Her hesap, güvenli davet akışıyla oluşturulan özel bir çift alanına bağlanır. Anılar, notlar, planlar, etkileşimler ve profil bilgileri iki partner arasında gerçek zamanlı olarak senkronize edilir.

Uygulama, modern mobil deneyimi veritabanı ve depolama katmanlarında uygulanan güvenlik modeliyle birleştirir. Çift verileri Supabase Row Level Security politikalarıyla birbirinden ayrılır, medya dosyaları private bucket'larda saklanır ve erişim yalnızca aynı çiftin doğrulanmış üyeleriyle sınırlanır.

### Öne Çıkanlar

- **Güvenli çift eşleşmesi:** özel bir çift alanı oluşturun veya benzersiz davet koduyla partnerinize katılın.
- **Ortak çift profili:** isimler, profil fotoğrafı, ilişki tarihi, otomatik gün sayacı, ortak hikâye, favoriler ve istatistikler.
- **Anılar ve albümler:** özel fotoğrafları yükleyin, görüntüleyin, favorileyin, düzenleyin ve albümlerde organize edin.
- **Notlar ve ortak günlük:** canlı güncellemeler ve çevrimdışı not kurtarma desteğiyle birlikte yazın.
- **Takvim ve geri sayımlar:** özel tarihleri, tekrarlayan etkinlikleri, buluşmaları ve yaklaşan anları yönetin.
- **Duygusal etkileşimler:** animasyon, titreşim, okunmamış durumu ve canlı teslimat desteğiyle etkileşim gönderin.
- **Tarayıcı bildirimleri:** kullanıcı kontrollü izin akışı ve web etkileşimleri için hazır altyapı.
- **Gizlilik odaklı mesafe:** ham koordinatları arayüzde göstermeden, isteğe bağlı ve pil dostu konum güncellemeleriyle partnerler arasındaki mesafe.
- **Ortak hedefler ve zaman kapsülleri:** birlikte yapılacakları takip edin; mesaj ve ekleri belirlenen tarihe kadar kilitli tutun.
- **Ruh hali ve hızlı durum:** partner odaklı görünürlük ve veritabanı seviyesinde yetkilendirmeyle anlık durum paylaşın.
- **Kurulabilir PWA:** responsive arayüz, çevrimdışı ekran, güncelleme bildirimi ve ana ekrana ekleme desteği.

### Teknolojiler

| Alan              | Teknoloji                                    |
| ----------------- | -------------------------------------------- |
| Uygulama          | Next.js 15, React 19, App Router             |
| Dil               | TypeScript                                   |
| Stil ve animasyon | Tailwind CSS, Framer Motion, Lucide Icons    |
| Backend           | Supabase Auth, PostgreSQL, Storage, Realtime |
| Doğrulama         | Zod                                          |
| Test ve kalite    | Vitest, ESLint, TypeScript                   |
| PWA               | Web App Manifest, Service Worker, IndexedDB  |

### Mimari

```text
app/                  Rotalar, layout'lar, loading ve error sınırları
components/           Özellik odaklı arayüz bileşenleri
hooks/                İstemci durumu ve Realtime abonelikleri
lib/                  Sorgular, doğrulama, dönüştürme ve domain araçları
services/             Özellik servisleri ve yazma işlemleri
supabase/migrations/  Şema, fonksiyonlar, trigger'lar ve RLS politikaları
tests/unit/            Birim ve regresyon testleri
public/                PWA dosyaları ve service worker
```

Arayüz bileşenleri veri değişikliklerini tipli servislere devreder, yeniden kullanılabilir hook'lar istemci durumunu ve filtrelenmiş Realtime kanallarını yönetir, veritabanı politikaları ise son yetkilendirme sınırını oluşturur.

### Gereksinimler

- Node.js 20.9 veya daha yeni bir sürüm
- npm
- Bir Supabase projesi
- Veritabanı migration'ları için Supabase CLI

### Yerel Kurulum

1. Bağımlılıkları kurun:

   ```bash
   npm install
   ```

2. Yerel ortam dosyasını oluşturun:

   ```bash
   cp .env.example .env.local
   ```

3. Public Supabase bilgilerini ekleyin:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

4. Veritabanını bağlayıp migration'ları uygulayın:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

5. Supabase Authentication ayarlarından e-posta ile kaydı etkinleştirin ve izin verilen yönlendirme adreslerine `http://localhost:3000` ekleyin.

6. Uygulamayı başlatın:

   ```bash
   npm run dev
   ```

Tarayıcınızdan `http://localhost:3000` adresini açın.

### İsteğe Bağlı Demo Hesapları

Yalnızca geliştirme ortamında kullanılan hızlı demo girişi `.env.local` içinde yapılandırılabilir. Bu hesapların Supabase'de oluşturulmuş ve bir çifte bağlı profil kayıtlarına sahip olması gerekir.

```env
DEV_DEMO_OWNER_EMAIL=
DEV_DEMO_OWNER_PASSWORD=
DEV_DEMO_PARTNER_EMAIL=
DEV_DEMO_PARTNER_PASSWORD=
```

İzole demo verisini `npm run simulate` komutuyla oluşturabilir veya yenileyebilirsiniz. Demo giriş endpoint'i production ortamında kapalıdır ve parolalar tarayıcıya gönderilmez.

### Komutlar

| Komut                  | Açıklama                                     |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Geliştirme sunucusunu başlatır               |
| `npm run build`        | Optimize production build'ini oluşturur      |
| `npm run start`        | Production build'ini çalıştırır              |
| `npm run lint`         | Statik kod analizini çalıştırır              |
| `npm run typecheck`    | TypeScript tiplerini kontrol eder            |
| `npm test`             | Test paketini bir kez çalıştırır             |
| `npm run test:watch`   | Testleri izleme modunda çalıştırır           |
| `npm run format`       | Projeyi biçimlendirir                        |
| `npm run format:check` | Dosyaları değiştirmeden biçimi kontrol eder  |
| `npm run simulate`     | İzole demo verisini oluşturur veya günceller |

### Güvenlik ve Gizlilik

- Çifte ait tablolar Row Level Security ile korunur.
- Okuma ve yazma işlemleri yalnızca aynı çiftteki doğrulanmış kullanıcılara açıktır.
- Davet fonksiyonları üyeliği, çift kapasitesini ve yinelenen profilleri sunucu tarafında denetler.
- Özel medya dosyaları çift ve kullanıcı kapsamındaki yollarda saklanır; kısa süreli signed URL ile açılır.
- Konum paylaşımı isteğe bağlıdır; arayüz kesin koordinatlar yerine mesafe ve güncellik bilgisini gösterir.
- Cinsiyet bilgisi yalnızca özellik yetkilendirmesi için kullanılır ve ortak görünümlerde yayımlanmaz.
- Zaman kapsülü içeriğine açılma tarihinden önce erişilemez.
- Production header'ları HTTPS, içerik kısıtlamaları, frame koruması, referrer politikası ve açık tarayıcı izinleri uygular.
- Service worker, Supabase oturumunu veya gizli anahtarları saklamaz.

> İstemci kontrolleri kullanıcı deneyimini iyileştirir; asıl erişim kontrolü veritabanı politikaları ve doğrulanan sunucu fonksiyonları tarafından uygulanır.

### Kalite Kontrolleri

Production build'ini yayımlamadan önce eksiksiz doğrulama paketini çalıştırın:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Sürekli entegrasyon, her push ve pull request için aynı temel kontrolleri çalıştırır.

### Production Dağıtımı

Uygulamayı `npm run build` komutuyla derleyin ve Next.js destekleyen herhangi bir barındırma platformunda yayımlayın. Public Supabase ortam değişkenlerini barındırma ortamına ekleyin, HTTPS kullanın ve production alan adını Supabase Authentication içindeki izin verilen yönlendirme adreslerine tanımlayın.

`.env.local`, service-role anahtarları, demo parolaları veya başka bir gizli bilgiyi Git deposuna eklemeyin.

---

Built with care for shared moments. · Ortak anlar için özenle geliştirildi.
