module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-console': 'off',
    'no-undef': 'off',
    'no-setter-return': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
