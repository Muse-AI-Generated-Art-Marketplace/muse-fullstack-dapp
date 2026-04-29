module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '.eslintrc.*',
    '*.config.js',
    '*.config.ts'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'security',
    'node-security'
  ],
  rules: {
    // Security Rules
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',

    // Node.js Security
    'node-security/detect-eval-with-expression': 'error',
    'node-security/detect-non-literal-fs-filename': 'error',
    'node-security/detect-non-literal-require': 'error',
    'node-security/detect-possible-timing-attacks': 'error',
    'node-security/detect-unsafe-regex': 'error',

    // TypeScript recommended rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],

    // General best practices
    'no-console': ['warn', { 'allow': ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error'
  },
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'node-security/detect-non-literal-require': 'off'
      }
    }
  ]
};
