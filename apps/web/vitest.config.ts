import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
  resolve: {
    alias: [
      {
        find: 'next-intl/server',
        replacement: path.resolve(__dirname, './__mocks__/next-intl-server.ts'),
      },
      {
        find: 'next-intl/plugin',
        replacement: path.resolve(__dirname, './__mocks__/next-intl-server.ts'),
      },
      {
        find: 'next-intl',
        replacement: path.resolve(__dirname, './__mocks__/next-intl.tsx'),
      },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
});
