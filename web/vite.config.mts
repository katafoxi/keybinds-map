import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  base: './',
  resolve: {
    alias: {
      '@fixtures': path.resolve(root, '../test-fixtures'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(root, '..')],
    },
  },
});
