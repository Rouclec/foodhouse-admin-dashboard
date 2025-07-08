import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    ignores: [
      'client/',
      '**/*.config.*',
      'eslint.config.mjs',
      'node_modules/',
      'dist/',
      '.next/',
      '.vscode/',
      '__tests__/',
      'package.json',
      'yarn.lock',
      '**/*.mjs',
      '**/*.cjs',
      'tsconfig.json',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        require: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'no-unused-vars': 'off', // base rule off
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-var-requires': 'error', // enabled generally
      '@typescript-eslint/no-explicit-any': 'error',
      'prettier/prettier': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
      'import/namespace': 'off',
      'no-duplicate-imports': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
];
