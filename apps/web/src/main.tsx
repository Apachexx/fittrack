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

// ── SW registration ───────────────────────────────────────────────────────
let swUpdatePending = false;

function safeReload() {
  const hasModal = document.querySelector('.modal-open, [data-viewer-open]');
  if (hasModal) { swUpdatePending = true; return; }
  window.location.reload();
}

registerSW({
  immediate: true,
  onNeedRefresh() {},
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(() => registration.update(), 30_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
    });
  },
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => safeReload());
}

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
      gcTime: 1000 * 60 * 60 * 24,
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
