import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The shared package is plain TypeScript source, so let Vite transpile it too.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ahla/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: { port: 5173, open: false },
});
