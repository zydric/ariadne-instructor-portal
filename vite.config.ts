import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: "./",
  root: resolve(__dirname, 'web'),
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
});
