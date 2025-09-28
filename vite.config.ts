import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://n8n.srv782553.hstgr.cloud',
        changeOrigin: true,
        secure: true,
        timeout: 120000,
        rewrite: (path) => {
          if (path.includes('/generate-document')) {
            return path.replace(/^\/api\/n8n\/generate-document/, '/webhook/generate-document');
          }
          if (path.includes('/quotes/generate')) {
            // CORRIGÉ: Nouvelle URL du workflow Generate Quote PDF - ENV FIXED
            return path.replace(/^\/api\/n8n\/quotes\/generate/, '/webhook/quotes/generate');
          }
          if (path.includes('/quotes/send')) {
            return '/webhook/quotes/send';
          }
          if (path.includes('/template/upload')) {
            return path.replace(/^\/api\/n8n\/template\/upload/, '/webhook/template/upload');
          }
          // Fallback vers les nouveaux webhooks
          return path.replace(/^\/api\/n8n/, '/webhook');
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Erreur proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Requête proxy:', req.method, req.url);
          });
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});