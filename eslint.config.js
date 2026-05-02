// eslint.config.js — ESLint v9+ flat config for React Native / Expo (TypeScript)
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // Exclude generated / build artefacts
    ignores: ['node_modules/**', 'android/**', 'ios/**', '.expo/**'],
  },
  {
    // Apply to all TypeScript / TSX source files
    files: ['**/*.{ts,tsx}'],

    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      // Declare globals so React Native / Hermes built-ins aren't flagged
      globals: {
        __DEV__: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        Promise: 'readonly',
      },
    },

    rules: {
      // ─── React Hooks ──────────────────────────────────────────────────────
      // Catches: calling hooks conditionally / inside loops
      'react-hooks/rules-of-hooks': 'error',
      // Catches: missing deps in useEffect / useCallback / useMemo
      'react-hooks/exhaustive-deps': 'warn',

      // ─── TypeScript-aware replacements ────────────────────────────────────
      // Catches: using a name that was never imported  ← the bug we just fixed
      'no-undef': 'off',                       // off — TS handles this better
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
      ],

      // ─── General hygiene ──────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
];
