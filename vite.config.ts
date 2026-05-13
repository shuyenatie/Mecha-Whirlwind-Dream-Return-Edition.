import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  build: {
    target: 'es2020',
    outDir: path.resolve(rootDir, 'dist'),
    rollupOptions: {
      input: path.resolve(rootDir, 'index.html'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
