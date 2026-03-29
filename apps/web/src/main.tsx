import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { router } from '@/router';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Auto-reload when new SW activates so stale assets are never served
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true); // true = reload page after SW update
  },
  onOfflineReady() { /* PWA ready for offline */ },
  immediate: true,
});

// Fallback: reload on SW controller change (skipWaiting + clientsClaim flow)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
