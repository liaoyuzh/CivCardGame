import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@civ/core': resolve(__dirname, '../core/src'),
    },
  },
  build: {
    outDir: '../../build/web',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
