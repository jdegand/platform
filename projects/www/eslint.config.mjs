import { FlatCompat } from '@eslint/eslintrc';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },

  // TypeScript override with parserOptions
  ...compat
    .config({
      extends: [
        'plugin:@nx/angular',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
    })
    .map((config) => ({
      ...config,
      files: ['projects/www/**/*.ts'],
      languageOptions: {
        parserOptions: {
          project: resolve(__dirname, 'projects/www/tsconfig.app.json'),
          tsconfigRootDir: __dirname,
        },
      },
      rules: {
        ...config.rules,
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'Www',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'www',
            style: 'kebab-case',
          },
        ],
      },
    })),

  // HTML override
  ...compat
    .config({
      extends: ['plugin:@nx/angular-template'],
    })
    .map((config) => ({
      ...config,
      files: ['projects/www/**/*.html'],
      rules: {
        ...config.rules,
      },
    })),
];
