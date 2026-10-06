import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  build: {
    // Yalnızca açılışta gereken büyük ve sabit kütüphaneler ayrılır:
    // paralel indirilir ve tekrar girişlerde tarayıcı önbelleğinden gelir.
    // Kalan paketleme varsayılan bölme mantığında kalır (sayfalar ayrı indirilir).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('livekit')) return 'vendor-livekit';
          // Ağır ve seyrek kullanılan kütüphaneler ayrı dosyaya alınır: ana sayfa bunları indirmez.
          if (id.includes('node_modules/three')) return 'vendor-three';
          if (id.includes('recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('quill')) return 'vendor-editor';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export';
          if (id.includes('@tanstack') || id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler') || id.includes('@base44')) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
});