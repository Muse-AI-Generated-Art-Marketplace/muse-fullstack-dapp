# Environment Configuration Guide

This document provides comprehensive instructions for configuring environment variables for the Muse AI Art Marketplace fullstack dApp.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration Files](#configuration-files)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Blockchain Configuration](#blockchain-configuration)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Development vs Production](#development-vs-production)

---

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/Muse-AI-Generated-Art-Marketplace/muse-fullstack-dapp.git
cd muse-fullstack-dapp
npm install
```

### 2. Create Environment Files
```bash
# In root directory
cp .env.example .env

# In backend directory
cp apps/backend/.env.example apps/backend/.env

# In frontend directory
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Fill in Required Values
Edit each `.env` file with your configuration values (see sections below).

### 4. Validate Environment
```bash
npm run validate-env
```

### 5. Start Development Server
```bash
# Terminal 1: Backend
cd apps/backend && npm run dev

# Terminal 2: Frontend
cd apps/frontend && npm run dev
```

---

## Configuration Files

### Root Level
- **`.env.example`**: Template for root environment configuration
- **`.env`**: Actual configuration (create from template, never commit)

### Backend
- **`apps/backend/.env.example`**: Backend template
- **`apps/backend/.env`**: Backend configuration
- **`apps/backend/.env.test`**: Test environment configuration

### Frontend
- **`apps/frontend/.env.example`**: Frontend template
- **`apps/frontend/.env`**: Frontend configuration (Vite variables start with `VITE_`)

### Smart Contracts
- **`packages/contracts/.env.example`**: Contract deployment configuration
- Deployment uses environment variables for network keys

---

## Backend Configuration

The backend is a Node.js/Express server that handles:
- REST API endpoints
- Database management
- Blockchain interactions
- AI service integration
- Authentication

### Core Variables

#### Server Setup
```env
PORT=3001                              # Server port
NODE_ENV=development                   # Environment mode
FRONTEND_URL=http://localhost:3000     # Frontend URL for CORS
```

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/muse
```

The backend uses MongoDB for storing:
- User profiles and authentication
- Artwork metadata
- Transaction records
- Marketplace listings
- User notifications
- Collections

**MongoDB Setup Options:**
- **Local**: Install MongoDB locally and use `mongodb://localhost:27017/muse`
- **Docker**: Run MongoDB in Docker: `docker run -d -p 27017:27017 mongo:6`
- **MongoDB Atlas**: Create free cluster at https://www.mongodb.com/cloud/atlas
  ```
  mongodb+srv://username:password@cluster.mongodb.net/muse?retryWrites=true&w=majority
  ```

#### Authentication
```env
JWT_SECRET=your_jwt_secret_here
```

**Generating a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:**
- Use a strong random value (minimum 32 characters)
- Use different secrets for development, staging, and production
- Never expose in logs or version control

#### Caching (Redis)
```env
REDIS_URL=redis://localhost:6379
# OR individual settings:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Redis Setup Options:**
- **Local**: Install Redis locally
- **Docker**: `docker run -d -p 6379:6379 redis:7`
- **Redis Cloud**: Free tier at https://redis.com/redis-cloud/

**Note:** If Redis is unavailable, the backend automatically falls back to in-memory caching.

#### Rate Limiting
```env
RATE_LIMIT_WINDOW=900000    # 15 minutes in milliseconds
RATE_LIMIT_MAX=100           # Max requests per window
```

#### Logging
```env
LOG_LEVEL=info    # error | warn | info | debug
```

#### Image Optimization
```env
IMAGE_CACHE_SIZE=500    # MB
```

---

## Frontend Configuration

The frontend is a React/TypeScript application using Vite.

### Frontend Variables (must start with VITE_)

```env
VITE_API_URL=http://localhost:3001                    # Backend API URL
VITE_SENTRY_DSN=https://key@sentry.io/project-id      # Error tracking (optional)
VITE_ENVIRONMENT=development                          # Environment name
```

**Important:**
- All frontend environment variables must start with `VITE_` to be exposed
- These values are embedded in the frontend bundle and visible to users
- Never include sensitive secrets (API keys) here

---

## Blockchain Configuration

### Stellar Network

```env
STELLAR_NETWORK=testnet              # testnet or mainnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=CA...            # Your deployed contract ID
```

**Getting Testnet Funds:**
1. Create Stellar testnet account via https://laboratory.stellar.org
2. Request testnet lumens from the faucet
3. Use the account address as `STELLAR_CONTRACT_ID`

### AI Services

#### OpenAI
```env
OPENAI_API_KEY=sk-...
```
- Get from: https://platform.openai.com/api-keys
- Billing setup required
- Models used: GPT-4, DALL-E 3 (or alternatives)

#### Stability AI
```env
STABILITY_API_KEY=sk-...
```
- Get from: https://api.stability.ai
- Provides image generation and editing
- API documentation: https://platform.stability.ai/docs

### Smart Contract Deployment

```env
DEPLOYER_PRIVATE_KEY=S...                 # Stellar private key
PRIVATE_KEY=0x...                         # Ethereum private key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
MAINNET_RPC_URL=https://mainnet.infura.io/v3/...
ETHERSCAN_API_KEY=...
REPORT_GAS=true
```

---

## Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3001 | Server port |
| NODE_ENV | Yes | development | Environment mode |
| FRONTEND_URL | Yes | - | Frontend URL for CORS |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret (32+ chars) |
| REDIS_URL | No | - | Redis connection URL |
| REDIS_HOST | No | localhost | Redis hostname |
| REDIS_PORT | No | 6379 | Redis port |
| REDIS_PASSWORD | No | - | Redis password |
| REDIS_DB | No | 0 | Redis database number |
| CACHE_TTL | No | 300 | Cache time-to-live (seconds) |
| RATE_LIMIT_WINDOW | No | 900000 | Rate limit window (ms) |
| RATE_LIMIT_MAX | No | 100 | Max requests per window |
| LOG_LEVEL | No | info | Logging level |
| IMAGE_CACHE_SIZE | No | 500 | Max image cache (MB) |
| STELLAR_NETWORK | Yes | testnet | Stellar network |
| STELLAR_RPC_URL | Yes | - | Stellar RPC endpoint |
| STELLAR_CONTRACT_ID | Yes | - | Contract address |
| OPENAI_API_KEY | No | - | OpenAI API key |
| STABILITY_API_KEY | No | - | Stability AI API key |
| CORS_ORIGINS | No | - | Allowed CORS origins |

### Frontend Variables (VITE_)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend API endpoint |
| VITE_SENTRY_DSN | No | Sentry error tracking |
| VITE_ENVIRONMENT | No | Environment descriptor |

---

## Security Best Practices

### 🔒 Secrets Management

1. **Never commit `.env` files**
   ```bash
   # Already in .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use strong random secrets**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Rotate secrets regularly** in production

4. **Use different secrets per environment**
   - Development: Less critical but still random
   - Staging: Realistic but isolated
   - Production: Highly secure, rotated frequently

5. **Environment-specific storage:**
   - **Local Development**: `.env` file (not committed)
   - **Staging/Production**: Environment variables in:
     - CI/CD platform (GitHub Actions secrets)
     - Cloud provider (Vercel, Heroku, AWS)
     - Secrets manager (HashiCorp Vault, AWS Secrets Manager)

### 🔑 API Keys

- **OpenAI & Stability AI**: Set spending limits in dashboard
- **Etherscan**: Regenerate if exposed
- **Private Keys**: Never share, use separate deployment accounts
- **Rate Limiting**: Implement on backend for protection

### 🛡️ CORS Configuration

```env
# Multiple origins
CORS_ORIGINS=http://localhost:3000,https://app.muse.com,https://staging.muse.com
```

### 📋 Database Security

- Use MongoDB Atlas with IP whitelist
- Enable TLS/SSL connections
- Use strong database passwords
- Regular backups

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module..." or "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. "MONGODB_URI not found" or "Connection refused"
```bash
# Check MongoDB is running
mongosh  # or mongo for older versions

# Or start with Docker
docker run -d -p 27017:27017 mongo:6

# Update .env with correct URI
MONGODB_URI=mongodb://localhost:27017/muse
```

#### 3. "Redis connection error"
```bash
# Redis is optional, backend falls back to in-memory cache
# But if needed, start Redis:
docker run -d -p 6379:6379 redis:7

# Or remove REDIS_URL to use fallback
# REDIS_URL=
```

#### 4. Environment variables not loading
```bash
# Check .env file exists and has correct name
ls -la apps/backend/.env

# Verify syntax (no spaces around =)
MONGODB_URI=mongodb://localhost:27017/muse  # ✓ Correct
MONGODB_URI = mongodb://localhost:27017/muse  # ✗ Wrong
```

#### 5. Frontend can't reach backend
```bash
# Check VITE_API_URL points to backend
VITE_API_URL=http://localhost:3001

# Check backend is running
curl http://localhost:3001/health

# Check CORS configuration
CORS_ORIGINS=http://localhost:3000
```

#### 6. "JWT_SECRET is undefined"
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in apps/backend/.env
JWT_SECRET=<generated-value>
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

Check logs:
```bash
# Backend
cd apps/backend && npm run dev

# Frontend
cd apps/frontend && npm run dev
```

---

## Development vs Production

### Development Configuration
```env
# apps/backend/.env (Development)
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/muse
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### Production Configuration
```env
# Deploy with environment variables (never use .env file)
NODE_ENV=production
PORT=3001
MONGODB_URI=<production-mongodb-uri>
REDIS_URL=<production-redis-uri>
LOG_LEVEL=info
JWT_SECRET=<secure-secret>
```

### Staging Configuration
```env
# Staging mirrors production but uses testnet
NODE_ENV=production
STELLAR_NETWORK=testnet
# Other vars same as production
```

---

## Docker Deployment

Example `docker-compose.yml`:
```yaml
version: '3.9'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: 3001
      MONGODB_URI: mongodb://admin:password@mongodb:27017/muse
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:3001
```

---

## Validation Script

A validation script is available to check environment configuration:

```bash
npm run validate-env
```

This checks:
- ✓ All required variables are set
- ✓ Variables have valid formats
- ✓ Services are reachable (optional)
- ✓ Secrets are properly configured

---

## Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [MongoDB Guide](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js dotenv](https://github.com/motdotla/dotenv)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [GitHub Issues](https://github.com/Muse-AI-Generated-Art-Marketplace/muse-fullstack-dapp/issues)
3. Create a new issue with `[ENVIRONMENT]` tag

---

Last Updated: March 27, 2026
