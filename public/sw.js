// ─── Cache config
const CACHE = "vouch-shell-v1";

// Static assets we want cached immediately on install.
const PRECACHE = ["/", "/logo.png"];

// ─── Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept cross-origin requests (e.g. Cloudinary images).
  if (url.origin !== self.location.origin) return;

  // Never intercept server actions, API routes, or Next.js internals.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // Cache-first for static public assets (logo, icons, sw itself).
  const isStatic =
    url.pathname === "/logo.png" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json";

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request)),
    );
    return;
  }

  // Network-first for everything else (pages, data).
  // Falls back to cache if offline, so users see a stale page rather than a crash.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit ?? Response.error()),
      ),
  );
});

// ─── Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Vouch", body: event.data.text(), url: "/chats" };
  }

  const { title = "Vouch", body = "", url = "/chats" } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/chats";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
