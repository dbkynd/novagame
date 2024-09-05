module.exports = {
  env: {
    node: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'no-console': ['warn', { allow: ['warn'] }], // Allow console.warn
    'no-global-assign': 'warn',
    'prettier/prettier': [
      'error',
      {
        semi: true,
        tabWidth: 2,
        singleQuote: true,
        printWidth: 120,
        trailingComma: 'all',
      },
    ],
  },
};
