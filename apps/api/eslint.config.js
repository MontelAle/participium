import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import path from 'path';
import typescript from 'typescript-eslint';
import { fileURLToPath } from 'url';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        tsconfigRootDir,
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // NestJS/Node-specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    ignores: ['node_modules', 'dist'],
  },
  eslintConfigPrettier, // Turn off all rules that might conflict with Prettier
];
