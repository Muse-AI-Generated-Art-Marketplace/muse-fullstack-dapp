# Environment Configuration Quick Reference

## ⚡ Quick Copy-Paste Setup

### 1. Create Environment Files
```bash
# Root
cp .env.example .env

# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env

# Contracts
cp packages/contracts/.env.example packages/contracts/.env
```

### 2. Generate Secrets
```bash
# Generate JWT secret (copy output to apps/backend/.env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Services (Docker)
```bash
# MongoDB
docker run -d -p 27017:27017 --name muse-mongo mongo:6

# Redis (optional)
docker run -d -p 6379:6379 --name muse-redis redis:7
```

### 4. Configure & Validate
```bash
# Edit configuration
nano apps/backend/.env

# Validate setup
npm run validate-env

# Start development
npm run dev
```

---

## 🔍 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module 'mongodb'` | Mongoose not installed | `npm install` in backend |
| `MONGODB_URI is undefined` | .env file missing | `cp apps/backend/.env.example apps/backend/.env` |
| `connection refused 127.0.0.1:27017` | MongoDB not running | `docker run -d -p 27017:27017 mongo:6` |
| `JWT_SECRET is too short` | Less than 32 characters | Use generator: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `Port 3001 already in use` | Another service on port | Change PORT in .env or kill process |
| `Cannot reach http://localhost:3001` | Backend not started | `npm run dev:backend` or check firewall |
| `CORS error from frontend` | Wrong FRONTEND_URL | Check CORS_ORIGINS in backend .env matches frontend URL |
| `Connection to Redis failed` | Redis not running | Install Redis or use fallback (leave REDIS_URL empty) |
| `API key invalid` | OpenAI/Stability key incorrect | Verify key at platform.openai.com or stability.ai |
| `Contract ID not found` | Stellar contract not deployed | Deploy contract or use testnet test ID |

---

## 📝 What Goes Where

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/muse
JWT_SECRET=generated_secret_here
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_ENVIRONMENT=development
```

### Connection Strings

#### MongoDB Local
```
mongodb://localhost:27017/muse
```

#### MongoDB Atlas
```
mongodb+srv://user:password@cluster.mongodb.net/muse?retryWrites=true&w=majority
```

#### Redis Local
```
redis://localhost:6379
```

#### Redis Cloud
```
redis://:password@host:port
```

---

## 🔐 Secret Generation

```bash
# Generate JWT Secret (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a7f3d1e9b2c6f4a8d5e0c2b9f1d7a4e6c8f0b3d5e7a9c1e3f5b7d9e1f3a5c7
```

Copy this to `apps/backend/.env` as:
```env
JWT_SECRET=a7f3d1e9b2c6f4a8d5e0c2b9f1d7a4e6c8f0b3d5e7a9c1e3f5b7d9e1f3a5c7
```

---

## 🚀 First Run Checklist

```bash
# 1. Install dependencies
npm install

# 2. Create .env files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Start MongoDB (if local)
# macOS: brew services start mongodb-community
# Docker: docker run -d -p 27017:27017 mongo:6
# Cloud: Create MongoDB Atlas cluster

# 4. Edit configuration
# Update MONGODB_URI if not using localhost
# Set OPENAI_API_KEY if available
# Set STELLAR_CONTRACT_ID if deployed

# 5. Validate
npm run validate-env

# 6. Start
npm run dev

# 7. Test
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health
```

---

## 🐛 Debugging

### Check Environment Variables Loaded
```bash
# In Node.js backend
console.log(process.env.MONGODB_URI);
console.log(process.env.JWT_SECRET);
```

### Check Frontend Environment
```bash
# In browser console (Vite exposes VITE_ variables)
console.log(import.meta.env.VITE_API_URL);
```

### Verify Service Connectivity
```bash
# MongoDB
mongosh "mongodb://localhost:27017/muse"

# Redis
redis-cli ping  # Should return PONG

# Backend API
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

---

## 📋 Environment Variables Overview

### Must Have
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Password for tokens
- `VITE_API_URL` - Frontend backend connection

### Should Have
- `OPENAI_API_KEY` - AI generation
- `STELLAR_CONTRACT_ID` - Blockchain address

### Optional
- `REDIS_URL` - Caching (has fallback)
- `VITE_SENTRY_DSN` - Error tracking

---

## 🔧 File Locations Reference

```
.env                           # Root (optional)
apps/backend/.env              # Backend (required)
apps/backend/.env.test         # Testing (optional)
apps/frontend/.env             # Frontend (required)
packages/contracts/.env        # Contracts (optional)

scripts/validate-env.js        # Validator script
ENVIRONMENT_SETUP.md           # Full documentation
ENVIRONMENT_SETUP_CHECKLIST.md # Interactive checklist
```

---

## 💡 Pro Tips

1. **Use different secrets per environment**
   - Dev: Local secrets, less critical
   - Prod: Highly secure, rotated regularly

2. **Keep .env locally, never commit**
   ```bash
   git status  # Should NOT show .env
   ```

3. **Test configuration before running**
   ```bash
   npm run validate-env
   ```

4. **Use Docker for services**
   ```bash
   docker-compose up  # If provided
   ```

5. **Generate strong JWT secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **Monitor logs for errors**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

---

## 🆘 Need Help?

1. **Review Documentation**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
2. **Check Checklist**: [ENVIRONMENT_SETUP_CHECKLIST.md](./ENVIRONMENT_SETUP_CHECKLIST.md)
3. **Validate Setup**: `npm run validate-env`
4. **Check Logs**: Look for error messages in console
5. **Verify Services**: Test MongoDB, Redis connectivity
6. **GitHub Issues**: Search existing issues or create new one

---

## 📊 Environment Matrix

| Variable | Backend | Frontend | Contracts | Required? |
|----------|---------|----------|-----------|-----------|
| PORT | ✅ | - | - | No (default: 3001) |
| NODE_ENV | ✅ | - | - | Yes |
| MONGODB_URI | ✅ | - | - | Yes |
| JWT_SECRET | ✅ | - | - | Yes |
| VITE_API_URL | - | ✅ | - | Yes |
| OPENAI_API_KEY | ✅ | - | - | No |
| STELLAR_NETWORK | ✅ | - | ✅ | Yes |
| STELLAR_CONTRACT_ID | ✅ | - | - | Yes |
| DEPLOYER_PRIVATE_KEY | - | - | ✅ | No |

---

## 🎓 Learning Path

1. **Start Here**: README.md Quick Start section
2. **Setup Guide**: ENVIRONMENT_SETUP.md for detailed instructions
3. **Interactive**: ENVIRONMENT_SETUP_CHECKLIST.md to verify setup
4. **Reference**: This document for quick lookup
5. **Troubleshooting**: ENVIRONMENT_SETUP.md troubleshooting section

---

**Last Updated**: March 27, 2026
**For Full Documentation**: See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
