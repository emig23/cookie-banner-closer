// ESLint flat config: catches likely bugs in TypeScript code.
// Prettier handles formatting, so formatting rules are turned off at the end.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Generated folders: build output, WXT's generated types, dependencies.
  globalIgnores(['.output/', '.wxt/', 'node_modules/']),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
  },

  // Keep this last so it can switch off rules that conflict with Prettier.
  prettier,
]);
