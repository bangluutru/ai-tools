import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/venv/**']),
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }]
    }
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'react-refresh/only-export-components': 'off' }
  },
  {
    files: [
      '**/CertificateStudioTool.jsx',
      '**/TemplateOverlayView.jsx'
    ],
    rules: {
      // These legacy editors derive synchronized preview state in effects.
      // They remain unavailable until their data model is redesigned.
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  {
    files: ['**/GoogleFontPicker.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' }
  }
]);
