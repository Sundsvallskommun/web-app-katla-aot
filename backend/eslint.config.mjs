import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  {
    // Genererade API-klienter redigeras aldrig för hand; byggutdata och coverage är inte källkod.
    // `*.d.ts` är ambient-typtillägg; genererade klienter granskas inte som handskriven kod.
    ignores: ['dist/**', 'coverage/**', 'data/**', 'src/data-contracts/**', '**/*.d.ts'],
  },
  eslint.configs.recommended,
  // Maximal, typmedveten strikthet — samma uppsättning som web-app-starter.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    // Registrera .ts som lintad filändelse (flat config default är bara .js) och koppla
    // de typmedvetna reglerna + parser-projektet till TypeScript-källorna.
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Dedikerad tsconfig som även inkluderar tester/konfig så typmedvetna regler har typinfo.
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // Inget `any` i handskriven kod.
      '@typescript-eslint/no-explicit-any': 'error',
      // Oanvänt hanteras av unused-imports (autofixbart + `_`-undantag).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // console.log är förbjudet, warn/error tillåtna (backend: använd winston-loggern).
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Primitiver i template-literals är ok; objekt och `unknown` flaggas fortfarande
      // så vi inte råkar interpolera "[object Object]".
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      // Av: regeln motarbetar legitima defensiva kontroller av externdata/`any`-data.
      // Övriga typmedvetna regler är fortsatt på.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  // Måste ligga sist: stänger av stilregler som krockar med Prettier.
  eslintConfigPrettier,
);
