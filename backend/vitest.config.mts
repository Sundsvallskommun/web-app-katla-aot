import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    // SWC krävs eftersom routing-controllers/class-validator behöver emitDecoratorMetadata,
    // vilket esbuild (Vitests standardtransform) inte stödjer.
    swc.vite({
      swcrc: false,
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
        keepClassNames: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@config': path.resolve(dirname, 'src/config'),
      '@controllers': path.resolve(dirname, 'src/controllers'),
      '@dtos': path.resolve(dirname, 'src/dtos'),
      '@exceptions': path.resolve(dirname, 'src/exceptions'),
      '@interfaces': path.resolve(dirname, 'src/interfaces'),
      '@middlewares': path.resolve(dirname, 'src/middlewares'),
      '@models': path.resolve(dirname, 'src/models'),
      '@services': path.resolve(dirname, 'src/services'),
      '@utils': path.resolve(dirname, 'src/utils'),
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 15000,
  },
});
