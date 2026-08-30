import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-vendor': ['@emotion/react', '@emotion/styled', '@mui/material'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'forms-vendor': ['@hookform/resolvers/zod', 'react-hook-form', 'zod'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
