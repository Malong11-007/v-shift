import { defineConfig } from 'vite';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'server/', 'e2e/']
    },
    exclude: ['node_modules/', 'server/', 'e2e/']
  }
});
