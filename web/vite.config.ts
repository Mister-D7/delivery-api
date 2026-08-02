import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  plugins: [mdx(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('react-router') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('framer-motion')) return 'anim';
          if (id.includes('grapesjs')) return 'grapesjs';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
          if (id.includes('leaflet')) return 'maps';
          if (id.includes('three')) return 'three';
          if (id.includes('@mdx-js')) return 'mdx';
        },
      },
    },
  },
  server: {
    port: 3001,
    allowedHosts: ['delivery.mister-dr.shop', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
