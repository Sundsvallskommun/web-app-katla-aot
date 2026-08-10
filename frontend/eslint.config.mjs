import js from '@eslint/js';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Motsvarar tidigare .eslintignore; endast .ts/.tsx lintas (som med `next lint --ext`)
    ignores: ['.next/**', '**/dist/**', 'coverage/**', '**/*.jsx', '**/*.d.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['generateMetadata', 'generateStaticParams'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      // TODO: Nya React Compiler-regler i Next 16.3 — befintliga träffar kräver
      // komponentrefaktorering och hanteras separat. Höj till 'error' när de är åtgärdade.
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
);
