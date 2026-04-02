/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Precache all assets injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigation fallback — serve index.html for all navigation requests
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ networkTimeoutSeconds: 3, cacheName: 'navigation' })
  )
);

// Skip waiting on message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Push notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() as {
    title?: string;
    body?: string;
    url?: string;
  } | undefined;

  const title = data?.title ?? 'V&S';
  const body = data?.body ?? 'Supplement zamanı!';
  const url = data?.url ?? '/supplements';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'supplement-reminder',
      renotify: true,
      data: { url },
      actions: [
        { action: 'open', title: '💊 Görüntüle' },
        { action: 'dismiss', title: 'Kapat' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = (event.notification.data as { url?: string })?.url ?? '/supplements';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      })
  );
});
