module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'security',
    'node-security'
  ],
  extends: [
    '@typescript-eslint/recommended'
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  rules: {
    // ── Strict Security Rules ────────────────────────────────────────────────────
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',

    'node-security/detect-eval-with-expression': 'error',
    'node-security/detect-non-literal-fs-filename': 'error',
    'node-security/detect-non-literal-require': 'error',
    'node-security/detect-possible-timing-attacks': 'error',
    'node-security/detect-unsafe-regex': 'error',

    // ── Disable all other rule warnings ────────────────────────────────────────
    // We only want security-critical errors in CI security scans
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/prefer-async-await': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-loss-of-precision': 'off',
    '@typescript-eslint/no-dupe-class-members': 'off',
    '@typescript-eslint/no-duplicate-enum-values': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-alert': 'off',
    'no-empty': 'off',
    'no-fallthrough': 'off',
    'no-redeclare': 'off',
    'no-unused-vars': 'off',
    'no-constant-condition': 'off'
  }
}
