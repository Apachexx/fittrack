import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      // New deploy detected — nuke every cache, then reload
      localStorage.setItem('__srv_v', v);
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
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New SW is ready — activate immediately without prompting the user
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

// When a new SW takes control, reload to serve fresh assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// ── App ───────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
