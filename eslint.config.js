import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['node_modules/*', 'dist/*']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    rules: {
      // * Enforce ES6+ patterns
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': ['error', { array: true, object: true }],
      'symbol-description': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // * Disallow CommonJS
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='require']",
          message: "Use ES6 'import' instead of 'require'.",
        },
        {
          selector:
            "MemberExpression[object.name='module'][property.name='exports']",
          message: "Use ES6 'export' instead of 'module.exports'.",
        },
        {
          selector: "AssignmentExpression[left.object.name='exports']",
          message: "Use ES6 'export' instead of 'exports.*'.",
        },
      ],

      // * Additional helpful rules
      'no-console': [
        'warn',
        { allow: ['warn', 'error', 'info', 'group', 'groupEnd'] },
      ],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-expressions': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    extends: ['markdown/recommended'],
  },
]);
