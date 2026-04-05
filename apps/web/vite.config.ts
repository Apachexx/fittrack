import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import type { Plugin } from 'vite';

// Injects a build timestamp into index.html so the app can detect stale SW cache
function injectBuildTs(): Plugin {
  const ts = Date.now().toString();
  return {
    name: 'inject-build-ts',
    transformIndexHtml(html) {
      const script = `<script>
(function(){
  var t='${ts}';
  var s=localStorage.getItem('__bts__');
  if(s&&s!==t){
    localStorage.setItem('__bts__',t);
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(rs){
        Promise.all(rs.map(function(r){return r.unregister();})).then(function(){
          caches.keys().then(function(ks){
            Promise.all(ks.map(function(k){return caches.delete(k);})).then(function(){
              location.reload();
            });
          });
        });
      });
    } else { location.reload(); }
    return;
  }
  localStorage.setItem('__bts__',t);
})();
</script>`;
      return html.replace('<div id="root">', script + '\n    <div id="root">');
    },
  };
}

export default defineConfig({
  plugins: [
    injectBuildTs(),
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vücut Geliştirme ve Sağlık',
        short_name: 'V&S',
        description: 'Vücut geliştirme, beslenme ve sağlık takibi',
        theme_color: '#080C14',
        background_color: '#080C14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
