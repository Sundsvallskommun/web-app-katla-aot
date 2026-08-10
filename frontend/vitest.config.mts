import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  oxc: false,
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@app': path.resolve(dirname, 'src/app'),
      '@services': path.resolve(dirname, 'src/services'),
      '@components': path.resolve(dirname, 'src/components'),
      '@interfaces': path.resolve(dirname, 'src/interfaces'),
      '@contexts': path.resolve(dirname, 'src/contexts'),
      '@hooks': path.resolve(dirname, 'src/hooks'),
      '@layouts': path.resolve(dirname, 'src/layouts'),
      '@styles': path.resolve(dirname, 'src/styles'),
      '@utils': path.resolve(dirname, 'src/utils'),
      '@middlewares': path.resolve(dirname, 'src/utils/middlewares'),
      '@public': path.resolve(dirname, 'public'),
      '@data-contracts': path.resolve(dirname, 'src/data-contracts'),
      src: path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    // globals krävs för att @testing-library/react ska städa upp automatiskt mellan tester
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'lcov', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/**',
        'src/interfaces/**',
        'src/data-contracts/**',
        'src/proxy.ts',
        'src/generate-contracts.ts',
      ],
    },
  },
});
