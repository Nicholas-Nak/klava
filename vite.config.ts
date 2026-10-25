import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/klava/',
  plugins: [react()],
  test: {
    pool: 'threads',
    environment: 'jsdom',
    maxWorkers: 1,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
