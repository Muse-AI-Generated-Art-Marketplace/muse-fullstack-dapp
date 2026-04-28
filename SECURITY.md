# Security Policy

## Reporting a Vulnerability

We take the security of the Muse AI Art Marketplace seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Issue

**DO NOT** open a public GitHub issue for security issues. Instead, please email us directly:

📧 **Security Team Email**: security@muse-art-marketplace.example.com

Please include:
- A description of the vulnerability and its impact
- Steps to reproduce (code samples, requests, etc.)
- Any potential mitigations you've identified
- Your contact information (optional)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Fix Timeline**: Depends on severity (critical issues patched within 72 hours)

We will work with you to understand the issue and coordinate a fix. Once a fix is ready, we will:
1. Release a security patch
2. Acknowledge your report (credit if desired)
3. Publish a security advisory (if appropriate)

### Supported Versions

| Version | Supported Until | Notes |
|---------|----------------|-------|
| 1.x     | Actively maintained | Critical security fixes |
| < 1.0   | Unsupported | Please upgrade to latest |

## Security Scanning in CI/CD

This repository implements automated security scanning that runs on every push and pull request:

### Scans Performed

1. **Dependency Vulnerability Audit** (`npm audit`)
   - Scans all workspace dependencies for known vulnerabilities
   - Runs at high severity level
   - Fails on high/critical vulnerabilities

2. **CodeQL Analysis**
   - Static application security testing (SAST)
   - Detects code injection, XSS, SQL/NoSQL injection, path traversal, and more
   - Supports TypeScript/JavaScript
   - Results appear in GitHub Security tab

3. **Security Linting (ESLint)**
   - Runs security-specific ESLint rules
   - Detects object injection, eval usage, timing attacks, unsafe regex
   - Node.js-specific rules via `eslint-plugin-node-security`

4. **Secret Scanning (Gitleaks)**
   - Scans for accidentally committed secrets (API keys, passwords, tokens)
   - Custom rules for project-specific secrets (JWT, OpenAI, Stability AI, MongoDB, etc.)
   - Prevents credential leakage

5. **Security Headers Validation**
   - Tests that backend enforces CSP, Helmet, HSTS, and other security headers
   - Automated integration test in CI

### Running Security Scans Locally

```bash
# Run all security checks
npm run security:scan

# Run just dependency audit
npm run audit

# Run security linting
npm run lint:security

# Run full test suite including security tests
npm run test
```

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Review security findings** - Address all high/critical issues
4. **Test security headers** - Ensure headers are present in production

## Responsible Disclosure

We follow responsible disclosure guidelines. We appreciate the work of security researchers and will acknowledge contributions.

---

**Last Updated**: April 27, 2026
