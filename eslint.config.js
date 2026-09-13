import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/venv/**', 'scripts/vendor/**']),
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
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^[A-Z_]' }]
    }
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'react-refresh/only-export-components': 'off' }
  },
  {
    files: ['standalone/**/cli/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node }
  },
  {
    files: [
      '**/CertificateStudioTool.jsx',
      '**/TemplateOverlayView.jsx',
      '**/OmniConvertView.jsx',
      '**/consular/ProcedureGuidePane.jsx',
      '**/consular/StructuredFormEditor.jsx',
      '**/navigator/JapanLifeNavigatorView.jsx',
      '**/business-card/LanguageContext.jsx'
    ],
    rules: {
      // These editors restore persisted data or synchronize derived selection state.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off'
    }
  },
  {
    files: ['**/GoogleFontPicker.jsx', '**/i18n/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  {
    files: ['**/business-card/EditorStep.jsx'],
    rules: {
      // The keyboard listener intentionally reads the latest history snapshot.
      'react-hooks/exhaustive-deps': 'off'
    }
  }
]);
