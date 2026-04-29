# ============================================================================
# ENVIRONMENT SETUP CHECKLIST
# ============================================================================
# Use this checklist to ensure all environment variables are properly configured
# for each component of the Muse dApp
#
# Date Started: ___________________
# Date Completed: ___________________
# Environment: [ ] Development [ ] Staging [ ] Production
# ============================================================================

## 📋 Pre-Setup

- [ ] Node.js v18+ installed: `node --version`
- [ ] npm v9+ installed: `npm --version`
- [ ] Git cloned: Repository present
- [ ] Dependencies installed: `npm install` completed
- [ ] Read ENVIRONMENT_SETUP.md

---

## 🔧 Backend Configuration (apps/backend/.env)

### Server Setup
- [ ] PORT set (default: 3001)
- [ ] NODE_ENV set to correct value
- [ ] FRONTEND_URL configured for CORS

### Database
- [ ] MongoDB URI configured
  - [ ] Local: `mongodb://localhost:27017/muse`
  - [ ] Docker: `docker run -d -p 27017:27017 mongo:6`
  - [ ] Cloud: MongoDB Atlas connection string
- [ ] Database is accessible: `npm run validate-env`

### Authentication
- [ ] JWT_SECRET generated (32+ characters)
  - Generated with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] JWT_SECRET copied to .env
- [ ] Different secrets for different environments

### Caching (Redis - Optional)
- [ ] Redis configuration decided:
  - [ ] Skip (use in-memory fallback)
  - [ ] Local: Redis installed and running
  - [ ] Docker: `docker run -d -p 6379:6379 redis:7`
  - [ ] Cloud: Redis Cloud connection
- [ ] REDIS_URL or individual settings configured
- [ ] Connection tested or fallback confirmed

### Rate Limiting
- [ ] RATE_LIMIT_WINDOW set
- [ ] RATE_LIMIT_MAX appropriate for use case

### Logging
- [ ] LOG_LEVEL appropriate for environment
  - [ ] Development: debug or info
  - [ ] Production: warn or error

### Image Optimization
- [ ] IMAGE_CACHE_SIZE set reasonably

---

## ⛓️ Blockchain Configuration (Backend)

### Stellar Network
- [ ] STELLAR_NETWORK configured
  - [ ] Development: testnet
  - [ ] Production: mainnet
- [ ] STELLAR_RPC_URL set correctly
- [ ] STELLAR_CONTRACT_ID obtained
  - [ ] Contract deployed to network
  - [ ] Address verified on block explorer

### AI Services
- [ ] OpenAI API Key configured
  - [ ] Account created at platform.openai.com
  - [ ] API key generated
  - [ ] Spending limit set
  - [ ] Key copied to OPENAI_API_KEY
- [ ] Stability AI API Key configured
  - [ ] Account created at stability.ai
  - [ ] API key generated
  - [ ] Key copied to STABILITY_API_KEY

---

## 🎨 Frontend Configuration (apps/frontend/.env)

- [ ] VITE_API_URL points to backend
  - [ ] Development: http://localhost:3001
  - [ ] Production: api.muse.example.com
- [ ] VITE_ENVIRONMENT set
- [ ] VITE_SENTRY_DSN (optional)
  - [ ] Sentry project created
  - [ ] DSN copied to .env

---

## 🚀 Smart Contracts (packages/contracts/.env)

- [ ] DEPLOYER_PRIVATE_KEY configured
  - [ ] Stellar account created
  - [ ] Testnet XLM requested from faucet
  - [ ] Private key kept secure
- [ ] STELLAR_NETWORK matches backend
- [ ] RPC URLs configured
- [ ] ETHERSCAN_API_KEY (if needed)

---

## ✅ Validation & Testing

### Environment Validation
```bash
npm run validate-env
```
- [ ] All required variables validated
- [ ] All variable formats correct
- [ ] No critical warnings

### Manual Verification
- [ ] `npm run dev` starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:3001/health
- [ ] No environment variable errors in console

### Database Connectivity
```bash
mongosh
> use muse
> show collections
```
- [ ] MongoDB connection successful
- [ ] Can read/write test data

### Service Integration Tests
- [ ] [ ] AI service (OpenAI/Stability) callable
- [ ] [ ] Blockchain network reachable
- [ ] [ ] Redis (if enabled) working

---

## 🔐 Security Review

### Secrets Verification
- [ ] JWT_SECRET is random 32+ characters
- [ ] Private keys NOT in version control
- [ ] .env files in .gitignore
- [ ] No hardcoded secrets in code

### Common Mistakes Check
- [ ] [ ] No spaces around `=` in .env
- [ ] [ ] No quotes around values unless needed
- [ ] [ ] Comments start with `#`
- [ ] [ ] No trailing spaces or comments on same line

Example of CORRECT formatting:
```env
JWT_SECRET=abcdef123456789...  # Correct
PORT=3001                       # Correct
MONGODB_URI=mongodb://localhost:27017/muse  # Correct
```

Example of INCORRECT formatting:
```env
JWT_SECRET = abcdef123456789   # Wrong (spaces around =)
PORT = "3001"                  # Wrong (unnecessary quotes)
MONGODB_URI: mongodb://localhost:27017/muse  # Wrong (uses :)
```

### Deployment Readiness
- [ ] Separate secrets for production
- [ ] Secrets stored in CI/CD platform
- [ ] No .env files committed to repo
- [ ] Documentation shared with team

---

## 📱 Development Setup Complete!

### Next Steps
1. [ ] Start development server: `npm run dev`
2. [ ] Test frontend at http://localhost:3000
3. [ ] Test API at http://localhost:3001
4. [ ] Read [ENVIRONMENT_SETUP.md](../ENVIRONMENT_SETUP.md) for detailed info
5. [ ] Set up IDE with environment variable support
6. [ ] Create feature branch for development

### Useful Commands
```bash
# Start development
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Run tests
npm run test

# Validate environment
npm run validate-env

# View logs
npm run dev -- --verbose

# Format code
npm run lint
```

---

## 💾 Backup & Recovery

- [ ] Configuration backed up securely
- [ ] Private keys stored in password manager
- [ ] .env files documented (description, not values)
- [ ] Recovery procedure documented

---

## 📝 Notes

Use this section to document any custom configuration or special setup for your environment:

```
Environment: ___________________
Database: ___________________
Blockchain Network: ___________________
Special Notes: ___________________
Date: ___________________
```

---

## ❓ Troubleshooting

If issues occur, check:

1. [ ] Environment file syntax is correct
2. [ ] All required variables are set
3. [ ] Services (MongoDB, Redis) are running
4. [ ] Ports not in use (3000, 3001, 27017, 6379)
5. [ ] API keys are valid and not expired
6. [ ] Network connectivity to services
7. [ ] Firewall not blocking connections

See [ENVIRONMENT_SETUP.md#troubleshooting](../ENVIRONMENT_SETUP.md#troubleshooting) for detailed solutions.

---

**Environment Setup Completed By**: ___________________
**Date**: ___________________
**Status**: [ ] Ready for Development [ ] Ready for Testing [ ] Ready for Production
