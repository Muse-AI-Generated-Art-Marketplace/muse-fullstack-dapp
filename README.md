# muse-fullstack-dapp

Complete monorepo for the Muse AI Art Marketplace. Includes React frontend, Node.js backend, and Rust smart contracts for decentralized art commerce.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local, Docker, or MongoDB Atlas)
- Redis (optional, for caching)

### 1. Clone the Repository
```bash
git clone https://github.com/Muse-AI-Generated-Art-Marketplace/muse-fullstack-dapp.git
cd muse-fullstack-dapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

This is the most important step! The application requires environment configuration for database, API keys, and blockchain settings.

#### Quick Setup
```bash
# Copy environment templates
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Edit files with your configuration
nano apps/backend/.env      # or use your preferred editor
nano apps/frontend/.env
```

#### Validate Configuration
```bash
npm run validate-env
```

### 4. Start Development Server
```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **MongoDB**: Required at `mongodb://localhost:27017/muse`

---

## 📋 Environment Configuration

The application requires environment variables in three main areas:

### Backend (apps/backend/.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/muse

# Authentication
JWT_SECRET=your_secure_secret_here_min_32_chars

# Blockchain
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=CA...

# AI Services
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
```

### Frontend (apps/frontend/.env)
```env
VITE_API_URL=http://localhost:3001
VITE_ENVIRONMENT=development
```

### Required Services
- **MongoDB**: Database for user and artwork data
- **Redis** (optional): Caching layer (falls back to in-memory)

#### Quick Setup with Docker
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongo mongo:6

# Redis (optional)
docker run -d -p 6379:6379 --name redis redis:7
```

**For detailed environment setup instructions, see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)**

---

## 📁 Project Structure

```
muse-fullstack-dapp/
├── apps/
│   ├── backend/           # Express.js REST API
│   ├── frontend/          # React + TypeScript + Vite
│   └── web/               # Secondary web app
├── packages/
│   └── contracts/         # Stellar Soroban smart contracts
├── scripts/
│   └── validate-env.js    # Environment validator
├── ENVIRONMENT_SETUP.md   # Detailed environment guide
└── package.json           # Root workspace config
```

### apps/backend
- Express.js REST API server
- MongoDB database integration
- JWT authentication
- Stellar blockchain integration
- AI service integration (OpenAI, Stability AI)
- Redis caching layer

### apps/frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS styling
- Stellar wallet integration (Freighter)
- Artwork gallery and minting interface

### packages/contracts
- Stellar Soroban smart contracts (Rust)
- NFT minting functionality
- Marketplace smart contract logic

---

## 🛠️ Development

### Available Commands

```bash
# Start all services in development mode
npm run dev

# Start individual services
npm run dev:backend
npm run dev:frontend
npm run dev:web

# Build for production
npm run build
npm run build:backend
npm run build:frontend

# Run tests
npm run test

# Run linter
npm run lint

# Validate environment configuration
npm run validate-env

# Clean all dependencies
npm run clean
```

### Testing

```bash
# Run all tests
npm run test

# Run specific workspace tests
npm run test --workspace=muse-backend
npm run test --workspace=muse-frontend
```

### Backend Development

```bash
cd apps/backend
npm run dev          # Start development server
npm run test         # Run tests with .env.test
npm run build        # Build for production
```

### Frontend Development

```bash
cd apps/frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🔐 Security Considerations

### Security Headers Configuration

The Muse DApp implements comprehensive security headers using Helmet middleware to protect against common web vulnerabilities:

#### Content Security Policy (CSP)
- **Purpose**: Prevents Cross-Site Scripting (XSS) attacks and data injection
- **Configuration**: Environment-specific policies
  - **Development**: Report-only mode with `unsafe-inline` and `unsafe-eval` for debugging
  - **Production**: Strict enforcement with minimal permissions

```javascript
// CSP Directives
default-src 'self'                           // Default policy for all resources
script-src 'self'                            // Scripts from same origin only
style-src 'self' 'unsafe-inline'             // Styles allow inline for CSS frameworks
img-src 'self' data: https:                  // Images with data URIs and HTTPS
font-src 'self'                              // Fonts from same origin
connect-src 'self' <api-domains>             // API connections
frame-ancestors 'none'                       // Prevent clickjacking
object-src 'none'                            // Block plugins
```

#### Frame Protection
- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **frame-ancestors**: `'none'` - Modern CSP equivalent

#### MIME Type Protection
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing attacks
- **Content-Type**: Enforced for all responses

#### Transport Security
- **Strict-Transport-Security (HSTS)**: Production only
  - `max-age=31536000` (1 year)
  - `includeSubDomains`
  - `preload`
- **upgradeInsecureRequests**: Enforces HTTPS in production

#### Cross-Origin Policies
- **Cross-Origin-Opener-Policy**: `same-origin` - Isolates browsing contexts
- **Cross-Origin-Resource-Policy**: `cross-origin` - Controls resource sharing
- **Cross-Origin-Embedder-Policy**: `require-corp` (production) - Requires explicit CORS

#### Privacy Headers
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Disables unnecessary browser features:
  - Geolocation, camera, microphone
  - Payment handlers, USB access
  - VR/AR displays, clipboard access

#### Legacy Protection
- **X-XSS-Protection**: `1; mode=block` - Legacy XSS protection
- **X-DNS-Prefetch-Control**: Disabled to prevent information leakage

### Environment Variables

⚠️ **CRITICAL**: Never commit `.env` files to version control

- `.env` files are already in `.gitignore`
- Each environment (dev, staging, prod) should have unique secrets
- Rotate secrets regularly in production
- Use strong random values for `JWT_SECRET`

### Security Testing

The security headers are thoroughly tested in `src/tests/securityHeaders.test.ts`:

```bash
# Run security tests
npm run test -- src/tests/securityHeaders.test.ts

# Test coverage includes:
- All security headers presence and values
- Environment-specific configurations
- CSP directive validation
- Integration with existing middleware
```

### Generate Secure Secrets

```bash
# Generate JWT secret (min 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Recommended Secret Management

- **Development**: `.env` file (not committed)
- **Staging/Production**: Use platform-specific secrets:
  - GitHub Actions: Secrets tab
  - Vercel/Netlify: Environment variables
  - AWS: Secrets Manager or Parameter Store
  - HashiCorp Vault: For enterprise

### Security Best Practices

1. **Regular Updates**: Keep dependencies updated for security patches
2. **Environment Isolation**: Different secrets per environment
3. **Monitoring**: Monitor security header violations via CSP reports
4. **Testing**: Run security tests in CI/CD pipeline
5. **Audit**: Regular security audits and penetration testing

---

## 🗄️ Database Setup

### MongoDB Options

#### Option 1: Local Installation
```bash
# macOS
brew install mongod

# Linux (Ubuntu)
sudo apt-get install mongodb

# Start service
mongod
```

#### Option 2: Docker
```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --name mongo mongo:6
```

#### Option 3: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create cluster and database
3. Get connection string
4. Update `MONGODB_URI` in `.env`

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/muse?retryWrites=true&w=majority
```

---

## ⛓️ Blockchain Configuration

### Stellar Network

The application uses Stellar Soroban for smart contracts.

#### Testnet Setup
```env
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

1. Create Stellar testnet account: https://laboratory.stellar.org
2. Request testnet XLM from faucet
3. Deploy contract to testnet
4. Add contract address to `STELLAR_CONTRACT_ID`

### API Keys

#### OpenAI (for AI art generation)
1. Sign up: https://platform.openai.com
2. Get API key: https://platform.openai.com/api-keys
3. Set spending limits
4. Add to `.env`: `OPENAI_API_KEY=sk-...`

#### Stability AI (for image generation)
1. Sign up: https://api.stability.ai
2. Get API key
3. Add to `.env`: `STABILITY_API_KEY=sk-...`

---

## 📝 API Documentation

Backend API documentation is available at:
- **Development**: http://localhost:3001/api/docs (if Swagger configured)
- **Health Check**: http://localhost:3001/health

### Key Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Authentication
curl -X POST http://localhost:3001/auth/login

# Artworks
curl http://localhost:3001/api/artworks

# Minting
curl -X POST http://localhost:3001/api/mint
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot find module" or dependencies error**
```bash
rm -rf node_modules package-lock.json
npm install
```

**2. "MongoDB connection refused"**
```bash
# Check MongoDB is running
mongosh

# Or start with Docker
docker run -d -p 27017:27017 mongo:6

# Update .env
MONGODB_URI=mongodb://localhost:27017/muse
```

**3. "JWT_SECRET undefined"**
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to apps/backend/.env
JWT_SECRET=<generated-value>
```

**4. "Port already in use"**
```bash
# Change in .env
PORT=3002  # or another available port

# Kill process on port
lsof -i :3001
kill -9 <PID>
```

**5. CORS errors - frontend can't reach backend**
- Check `VITE_API_URL` matches backend URL
- Check `FRONTEND_URL` in backend .env for CORS origin
- Check backend is running on correct port

See [ENVIRONMENT_SETUP.md#troubleshooting](ENVIRONMENT_SETUP.md#troubleshooting) for more solutions.

---

## 📚 Documentation

- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Comprehensive environment configuration guide
- [CACHING_STRATEGY.md](CACHING_STRATEGY.md) - Caching implementation details
- [HEALTH_CHECK_IMPLEMENTATION.md](HEALTH_CHECK_IMPLEMENTATION.md) - Health check endpoints
- [DATABASE_INDEXING_STRATEGY.md](DATABASE_INDEXING_STRATEGY.md) - Database optimization
- [ERROR_HANDLING.md](ERROR_HANDLING.md) - Error handling patterns

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test: `npm run validate-env && npm run test`
4. Commit with descriptive message
5. Push and create Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🆘 Support

For issues and questions:

1. **Check Documentation**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
2. **GitHub Issues**: [Report issues](https://github.com/Muse-AI-Generated-Art-Marketplace/muse-fullstack-dapp/issues)
3. **Discussions**: [Ask questions](https://github.com/Muse-AI-Generated-Art-Marketplace/muse-fullstack-dapp/discussions)

---

## 🙏 Acknowledgments

Built with:
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [React](https://react.dev/) & [Vite](https://vitejs.dev/)
- [MongoDB](https://www.mongodb.com/) & [Redis](https://redis.io/)
- [Stellar Soroban](https://soroban.stellar.org/)
- [OpenAI](https://openai.com/) & [Stability AI](https://stability.ai/)

---

Last Updated: March 27, 2026
