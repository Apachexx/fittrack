/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigation (index.html) is NEVER cached — always from network
// This ensures deploys are picked up immediately
registerRoute(new NavigationRoute(new NetworkOnly()));

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() as { title?: string; body?: string; url?: string } | undefined;
  event.waitUntil(
    self.registration.showNotification(data?.title ?? 'V&S', {
      body: data?.body ?? 'Supplement zamanı!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'supplement-reminder',
      renotify: true,
      data: { url: data?.url ?? '/supplements' },
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
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) { client.navigate(url); return client.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
