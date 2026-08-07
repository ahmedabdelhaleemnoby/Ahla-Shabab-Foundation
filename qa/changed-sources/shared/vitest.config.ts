import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // exFAT hosts create AppleDouble '._*' sidecar files — never treat them as tests.
    include: ['src/**/*.test.ts'],
    exclude: ['**/._*', '**/node_modules/**'],
  },
});
