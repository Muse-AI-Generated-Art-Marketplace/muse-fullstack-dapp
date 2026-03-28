# Environment Configuration - File Navigation Guide

This document helps you navigate the comprehensive environment configuration system for the Muse dApp.

## 🎯 Where To Start

### If You're New to the Project
**Start Here**: [README.md](./README.md) → [ENVIRONMENT_QUICK_REFERENCE.md](./ENVIRONMENT_QUICK_REFERENCE.md)

1. Read the Quick Start section in [README.md](./README.md)
2. Copy template files as shown in [ENVIRONMENT_QUICK_REFERENCE.md](./ENVIRONMENT_QUICK_REFERENCE.md)
3. Edit configuration files
4. Run `npm run validate-env`

### If You Need Detailed Information
**Go Here**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

Complete guide with:
- 2000+ words of documentation
- Step-by-step setup for each component
- Service configuration options
- Troubleshooting guide
- Docker examples

### If You Want to Follow a Checklist
**Use This**: [ENVIRONMENT_SETUP_CHECKLIST.md](./ENVIRONMENT_SETUP_CHECKLIST.md)

Interactive checklist to:
- Verify pre-requirements
- Check each component setup
- Validate configuration
- Review security

### If You Need Quick Answers
**Look Here**: [ENVIRONMENT_QUICK_REFERENCE.md](./ENVIRONMENT_QUICK_REFERENCE.md)

Quick reference for:
- Copy-paste commands
- Common errors and solutions
- Environment variable matrix
- Pro tips

---

## 📁 File Structure Overview

```
Documentation Files (for reading)
├── README.md                          # Main project README with env section
├── ENVIRONMENT_SETUP.md               # Primary comprehensive guide (2000+ lines)
├── ENVIRONMENT_SETUP_CHECKLIST.md     # Interactive step-by-step checklist
├── ENVIRONMENT_QUICK_REFERENCE.md     # Quick lookup reference
├── ENVIRONMENT_SETUP_NAVIGATION.md    # This file
├── ISSUE_70_RESOLUTION.md             # Resolution summary for GitHub
├── GITHUB_PR_SUMMARY.md               # PR description template
│
Configuration Templates (for copying)
├── .env.example                       # Root-level template
├── apps/backend/.env.example          # Backend configuration
├── apps/backend/.env.test             # Testing environment
├── apps/frontend/.env.example         # Frontend configuration
├── packages/contracts/.env.example    # Smart contracts configuration
│
Tools (for running)
└── scripts/validate-env.js            # Validation script (npm run validate-env)
```

---

## 📖 Documentation Files

### 1. README.md
**Purpose**: Main project README  
**When to Use**: First-time project setup  
**Time to Read**: 5-10 minutes  
**Contains**:
- Quick start guide
- Project structure overview
- Development commands
- Environment configuration overview
- Troubleshooting basics

### 2. ENVIRONMENT_SETUP.md ⭐ PRIMARY REFERENCE
**Purpose**: Comprehensive environment configuration guide  
**When to Use**: You want to understand everything  
**Time to Read**: 30 minutes  
**Contains**:
- Complete variable reference (48+ variables)
- Multi-environment setup (dev, staging, prod)
- Component-specific guides (backend, frontend, contracts)
- Service setup options (MongoDB, Redis, Stellar, OpenAI)
- Security best practices
- Docker deployment examples
- Detailed troubleshooting (15+ issues)
- Maintenance guidelines

### 3. ENVIRONMENT_SETUP_CHECKLIST.md
**Purpose**: Interactive setup verification  
**When to Use**: You're setting up for the first time  
**Time to Use**: 15-20 minutes  
**Contains**:
- Pre-setup requirements
- Component-by-component checklist
- Validation checkpoints
- Security review section
- Completion certificate section

### 4. ENVIRONMENT_QUICK_REFERENCE.md
**Purpose**: Quick lookup and common solutions  
**When to Use**: You need to find something fast  
**Time to Read**: 5-10 minutes  
**Contains**:
- Copy-paste quick setup commands
- Common errors with solutions
- Environment variable quick matrix
- Pro tips and tricks
- File location reference
- Debugging commands

### 5. ISSUE_70_RESOLUTION.md
**Purpose**: Document this issue resolution  
**When to Use**: Understanding what was delivered  
**Time to Read**: 10 minutes  
**Contains**:
- What was delivered
- Coverage analysis
- Documentation structure
- Implementation details
- Validation checklist

### 6. GITHUB_PR_SUMMARY.md
**Purpose**: Pull request description template  
**When to Use**: Creating the PR for GitHub  
**Time to Use**: 2 minutes (just copy-paste)  
**Contains**:
- PR overview
- Files modified/added
- Testing notes
- Benefits summary

---

## 🔧 Configuration Files

### Root Level: `.env.example`
**Purpose**: Application-wide environment template  
**Copy To**: `.env` in project root  
**Variables**: 50+ commented and categorized  
**When Needed**: Optional, most variables in component .env files

```bash
cp .env.example .env
```

### Backend: `apps/backend/.env.example`
**Purpose**: Backend API server configuration  
**Copy To**: `apps/backend/.env`  
**Critical Variables**: 10+
- MONGODB_URI
- JWT_SECRET
- STELLAR network config
- AI service keys

```bash
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env  # Edit with your values
```

### Backend Testing: `apps/backend/.env.test`
**Purpose**: Automated test environment configuration  
**Copy To**: `.env.test` in apps/backend  
**Used By**: `npm test`  
**Pre-configured For**: 
- Separate test database
- Disabled external services
- Fast test execution

```bash
cp apps/backend/.env.test apps/backend/.env.test
# Or auto-used if exists
```

### Frontend: `apps/frontend/.env.example`
**Purpose**: Frontend UI configuration  
**Copy To**: `apps/frontend/.env`  
**Important**: Variables must start with `VITE_`  
**Critical Variables**: 1-2
- VITE_API_URL (backend endpoint)

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

### Smart Contracts: `packages/contracts/.env.example`
**Purpose**: Blockchain contract deployment configuration  
**Copy To**: `packages/contracts/.env`  
**Critical Variables**: 3-5
- DEPLOYER_PRIVATE_KEY
- STELLAR network config
- Contract verification keys

```bash
cp packages/contracts/.env.example packages/contracts/.env
```

---

## 🛠️ Tools

### Validation Script: `scripts/validate-env.js`
**Purpose**: Automated environment verification  
**Run As**: `npm run validate-env`  
**Validates**:
- ✓ All required variables are set
- ✓ Variable formats are correct (URLs, keys, etc.)
- ✓ Port numbers are valid
- ✓ Network configurations valid
- ✓ File paths correct

**Exit Codes**:
- `0` = All good ✅
- `1` = Errors found ❌

**Usage**:
```bash
npm run validate-env        # Check all
npm run validate-env:backend # Backend only
```

---

## 🚀 Quick Setup Flow

```
1. Read README.md Quick Start (5 min)
   ↓
2. Copy .env templates from examples (2 min)
   ↓
3. Follow ENVIRONMENT_SETUP_CHECKLIST.md (15 min)
   ↓
4. Edit configuration values (5-10 min)
   ↓
5. Run npm run validate-env (1 min)
   ↓
6. Start npm run dev (1 min)
   ↓
✅ Development ready!
```

**Total Time**: ~30 minutes for first-time setup

---

## 🔍 Finding What You Need

### "I want to..."

| Goal | File | Section | Time |
|------|------|---------|------|
| Get started quickly | README.md | Quick Start | 5m |
| Understand environment setup | ENVIRONMENT_SETUP.md | Top sections | 15m |
| Verify my setup | ENVIRONMENT_SETUP_CHECKLIST.md | All | 20m |
| Fix a specific error | ENVIRONMENT_QUICK_REFERENCE.md | Common Errors | 2m |
| Configure MongoDB | ENVIRONMENT_SETUP.md | Database Setup | 10m |
| Configure Redis | ENVIRONMENT_SETUP.md | Caching section | 5m |
| Deploy to production | ENVIRONMENT_SETUP.md | Dev vs Production | 10m |
| Use Docker | ENVIRONMENT_SETUP.md | Docker Deployment | 10m |
| Generate JWT secret | ENVIRONMENT_QUICK_REFERENCE.md | Secret Generation | 1m |
| Debug an issue | ENVIRONMENT_SETUP.md | Troubleshooting | 10m |

---

## ✅ Verification Checklist

After setup, verify your configuration:

```bash
# 1. Validate environment
npm run validate-env

# 2. Check database connection
mongosh mongodb://localhost:27017/muse

# 3. Start backend
npm run dev:backend

# 4. Start frontend (in another terminal)
npm run dev:frontend

# 5. Open browser
http://localhost:3000  # Should load frontend
http://localhost:3001/health  # Should return OK
```

---

## 📞 Need Help?

1. **Quick lookup**: See [ENVIRONMENT_QUICK_REFERENCE.md](./ENVIRONMENT_QUICK_REFERENCE.md)
2. **Detailed info**: See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
3. **Step-by-step**: See [ENVIRONMENT_SETUP_CHECKLIST.md](./ENVIRONMENT_SETUP_CHECKLIST.md)
4. **Common errors**: See [ENVIRONMENT_QUICK_REFERENCE.md#-common-errors--solutions](./ENVIRONMENT_QUICK_REFERENCE.md#-common-errors--solutions)
5. **GitHub**: Open an issue if not found

---

## 🔐 Security Reminders

- ⚠️ Never commit `.env` files (already in .gitignore)
- ⚠️ Keep JWT_SECRET secure (32+ characters)
- ⚠️ Don't expose API keys in logs
- ⚠️ Use different secrets for different environments
- ✅ Generate strong random secrets using provided command

---

## 📚 External Resources

- **Node.js / npm**: https://nodejs.org/
- **MongoDB**: https://docs.mongodb.com/
- **Redis**: https://redis.io/documentation
- **Stellar**: https://developers.stellar.org/
- **OpenAI**: https://platform.openai.com/docs/
- **Vite**: https://vitejs.dev/

---

## 🎓 Learning Path

1. **Start**: README.md (Quick Start)
2. **Learn**: ENVIRONMENT_SETUP.md (Comprehensive)
3. **Practice**: ENVIRONMENT_SETUP_CHECKLIST.md (Interactive)
4. **Reference**: ENVIRONMENT_QUICK_REFERENCE.md (Lookup)
5. **Debug**: Troubleshooting section in ENVIRONMENT_SETUP.md

---

**Last Updated**: March 27, 2026  
**Status**: Complete and Production Ready  
**Questions?**: See the documentation files above or open a GitHub issue
