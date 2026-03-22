/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals', './base.js'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
  },
};
