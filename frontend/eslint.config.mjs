import js from '@eslint/js';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      // data-contracts genereras av swagger-typescript-api och lintas därför inte
      'src/data-contracts/**',
    ],
  },
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['generateMetadata', 'generateStaticParams'] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // Regler som tillkom med ESLint 9/eslint-config-next 16 och slår på befintlig kod.
      // Nedgraderade till varningar tills koden åtgärdats separat.
      'no-constant-binary-expression': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
