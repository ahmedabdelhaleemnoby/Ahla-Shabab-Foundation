import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * DEMO_BASE lets the dashboard be served under a sub-path so it can share one
 * origin with the mobile web build (scripts/demo-origin.mjs). Same origin means
 * one localStorage, which is what makes a CMS edit visible in the app — see
 * qa/DEFECTS.md D-18. Unset, everything behaves exactly as before.
 */
const base = process.env.DEMO_BASE ?? '/';

// The shared package is plain TypeScript source, so let Vite transpile it too.
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@ahla/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: false,
    // Behind the proxy the browser talks to :4000, so point HMR there.
    ...(process.env.DEMO_BASE ? { hmr: { clientPort: 4000 } } : {}),
  },
});
