import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'TeraNexus',
          short_name: 'TeraNexus',
          description: 'Plataforma de Gestão para Terapeutas TRG',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'fullscreen',
          start_url: '/',
          icons: [
            {
              src: '/logo-new.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: '/logo-new.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            },
            {
              src: '/logo-new.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // REMOVED FOR SECURITY
      // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // REMOVED FOR SECURITY
      'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'types': path.resolve(__dirname, './types.ts'),
      }
    }
  };
});
