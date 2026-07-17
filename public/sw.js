const CACHE_VERSION = "v5";
const SHELL_CACHE = `our-space-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `our-space-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `our-space-images-${CACHE_VERSION}`;
const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
];

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok)
    (await caches.open(IMAGE_CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok)
      (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("/offline"));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached || network;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) => ![SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key),
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_PRIVATE_CACHE")
    event.waitUntil(
      Promise.all([caches.delete(RUNTIME_CACHE), caches.delete(IMAGE_CACHE)]),
    );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "our-space-sync")
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: "FLUSH_OFFLINE_QUEUE" }),
          ),
        ),
    );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: "Bizim Hikâyemiz",
      body: "Yeni bir bildirimin var.",
    };
  }

  // Safari görünmez push'a izin vermez. Her push olayı, aynı event içinde
  // kullanıcıya görünür bir bildirime dönüştürülür.
  event.waitUntil(
    self.registration.showNotification(payload.title || "Bizim Hikâyemiz", {
      body: payload.body || "Yeni bir bildirimin var.",
      icon: payload.icon || "/icons/icon-192.png",
      tag: payload.tag || "our-story-notification",
      data: { url: payload.url || "/bildirimler" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "/bildirimler";
  const target = new URL(requestedUrl, self.location.origin);
  const safeUrl =
    target.origin === self.location.origin ? target.href : "/bildirimler";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => "focus" in client);
        if (existing)
          return existing
            .navigate(safeUrl)
            .then((navigatedClient) => navigatedClient?.focus());
        return self.clients.openWindow(safeUrl);
      }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isSupabaseStorage =
    url.hostname.endsWith("supabase.co") &&
    url.pathname.startsWith("/storage/v1/");
  if (url.origin !== self.location.origin && !isSupabaseStorage) return;
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (url.pathname.startsWith("/_next/image") || isSupabaseStorage) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
