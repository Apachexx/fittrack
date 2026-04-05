import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { router } from '@/router';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// ── Deploy-change detector ────────────────────────────────────────────────
// Fetches the server's startup version on every page load.
// If the version changed (= new deploy), wipes ALL caches and force-reloads.
// This is the only reliable way to bust stale SW caches on Android/iOS PWAs.
async function checkServerVersion() {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return;
    const { v } = await res.json() as { v: string };
    const stored = localStorage.getItem('__srv_v');

    if (stored && stored !== v) {
      // New deploy detected — unregister SW + nuke all caches, then reload
      // Unregistering forces the next load to hit the network directly (no SW interception)
      localStorage.setItem('__srv_v', v);
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      window.location.reload();
      return;
    }
    localStorage.setItem('__srv_v', v);
  } catch {
    // Offline or API not ready — skip silently
  }
}

checkServerVersion();

// ── SW registration ───────────────────────────────────────────────────────
// Track whether a SW update is pending — reload only at a safe moment
let swUpdatePending = false;

function safeReload() {
  // Don't reload if a modal/overlay is open (e.g. image viewer, dialogs)
  // Check for any open DaisyUI modals or our custom overlay
  const hasModal = document.querySelector('.modal-open, [data-viewer-open]');
  if (hasModal) {
    // Retry after next page visibility change instead
    swUpdatePending = true;
    return;
  }
  window.location.reload();
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New SW waiting — activate it, but reload only at a safe moment
    updateSW(true);
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Poll for SW updates every 60s (Android/iOS don't auto-poll for PWAs)
    setInterval(() => registration.update(), 60_000);
    // Also check whenever user switches back to the app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
    });
  },
});

// When a new SW takes control, reload — but wait for a safe moment
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    safeReload();
  });
}

// If a reload was deferred, do it next time the user comes back to the app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && swUpdatePending) {
    swUpdatePending = false;
    safeReload();
  }
});

// ── App ───────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // 24h — required for persistence
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'fittrack-query-cache',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <AuthProvider>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
