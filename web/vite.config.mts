import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Vite CSS HMR for this file sometimes injects an empty stylesheet and collapses the page. */
function reloadOnAppCss(): Plugin {
  return {
    name: 'reload-on-app-css',
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, '/').endsWith('/src/app.css')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), reloadOnAppCss()],
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
