import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE || 'http://localhost:5000';
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    server: isDev
      ? {
          port: 5173,
          open: true,
          proxy: {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              secure: false
            }
          }
        }
      : undefined
  };
});
