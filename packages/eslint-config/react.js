import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * A custom ESLint configuration for React projects.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactConfig = [
  // 1. Inherit everything from base (TS, Prettier, Turbo, etc.)
  ...baseConfig,

  // 2. Add React-specific configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      // "env" is replaced by "globals"
      globals: {
        ...globals.browser, // Needed for window, document, etc.
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Allow JSX parsing
        },
      },
    },
    // "plugins" uses objects, not strings
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    // "extends" is replaced by manually spreading the rules
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React 17+ doesn't need React in scope
      'react/react-in-jsx-scope': 'off',

      // Your custom overrides
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
