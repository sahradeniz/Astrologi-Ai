import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const fallbackApi = 'https://astrolog-ai.onrender.com';
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || fallbackApi;
  const proxyTarget = env.VITE_API_BASE || apiUrl;
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: isDev
      ? {
          port: 5173,
          open: true,
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
