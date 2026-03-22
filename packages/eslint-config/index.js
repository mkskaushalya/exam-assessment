/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js', 'plugin:import/recommended', 'plugin:import/typescript'],
  rules: {
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
