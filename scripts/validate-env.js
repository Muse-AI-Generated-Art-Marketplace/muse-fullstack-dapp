#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * 
 * This script validates environment variables for all components:
 * - Backend
 * - Frontend  
 * - Blockchain
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate-env
 * 
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation errors found
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Validation state
let hasErrors = false;
let hasWarnings = false;

/**
 * Print colored output
 */
function log(message, type = 'info') {
  const prefixes = {
    error: `${colors.red}✗ ERROR${colors.reset}`,
    warning: `${colors.yellow}⚠ WARNING${colors.reset}`,
    success: `${colors.green}✓ OK${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
  };
  console.log(`${prefixes[type] || type}: ${message}`);
}

/**
 * Load environment file
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

/**
 * Validate a single variable
 */
function validateVariable(env, key, config) {
  const value = env[key] || process.env[key];

  if (config.required && !value) {
    log(`Missing required variable: ${key}`, 'error');
    hasErrors = true;
    return false;
  }

  if (!value && !config.required) {
    log(`Optional variable not set: ${key}`, 'warning');
    hasWarnings = true;
    return true;
  }

  if (value && config.validate) {
    if (!config.validate(value)) {
      log(`Invalid format for ${key}: ${value}`, 'error');
      hasErrors = true;
      return false;
    }
  }

  return true;
}

/**
 * Validation schemas
 */
const validationSchemas = {
  backend: {
    filePath: 'apps/backend/.env',
    variables: {
      PORT: {
        required: false,
        validate: (v) => /^\d+$/.test(v) && parseInt(v) > 0 && parseInt(v) < 65536,
        description: 'Valid port number (1-65535)',
      },
      NODE_ENV: {
        required: true,
        validate: (v) => ['development', 'production', 'test'].includes(v),
        description: 'One of: development, production, test',
      },
      FRONTEND_URL: {
        required: true,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'Valid HTTP(S) URL',
      },
      MONGODB_URI: {
        required: true,
        validate: (v) => /^mongodb(\+srv)?:\/\/.+/.test(v),
        description: 'Valid MongoDB connection string',
      },
      JWT_SECRET: {
        required: true,
        validate: (v) => v.length >= 32,
        description: 'Minimum 32 characters for security',
      },
      REDIS_HOST: {
        required: false,
        validate: (v) => /^[a-zA-Z0-9.-]+$/.test(v),
        description: 'Valid hostname',
      },
      REDIS_PORT: {
        required: false,
        validate: (v) => /^\d+$/.test(v) && parseInt(v) > 0,
        description: 'Valid port number',
      },
      STELLAR_NETWORK: {
        required: true,
        validate: (v) => ['testnet', 'mainnet'].includes(v),
        description: 'One of: testnet, mainnet',
      },
      STELLAR_RPC_URL: {
        required: true,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'Valid HTTP(S) URL',
      },
      STELLAR_CONTRACT_ID: {
        required: true,
        validate: (v) => /^CA[A-Z0-9]{56}$/.test(v),
        description: 'Valid Stellar contract ID (CA...)',
      },
      LOG_LEVEL: {
        required: false,
        validate: (v) => ['error', 'warn', 'info', 'debug'].includes(v),
        description: 'One of: error, warn, info, debug',
      },
    },
  },
  frontend: {
    filePath: 'apps/frontend/.env',
    variables: {
      VITE_API_URL: {
        required: true,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'Valid HTTP(S) URL',
      },
      VITE_SENTRY_DSN: {
        required: false,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'Valid HTTP(S) URL or empty',
      },
    },
  },
  contracts: {
    filePath: 'packages/contracts/.env',
    variables: {
      DEPLOYER_PRIVATE_KEY: {
        required: false,
        validate: (v) => /^S[A-Z0-9]{55}$/.test(v),
        description: 'Valid Stellar private key (S...)',
      },
      PRIVATE_KEY: {
        required: false,
        validate: (v) => /^0x[a-f0-9]{64}$/.test(v),
        description: 'Valid Ethereum private key (0x...)',
      },
    },
  },
};

/**
 * Validate a component's environment
 */
function validateComponent(name, schema) {
  console.log(`\n${colors.cyan}=== Validating ${name.toUpperCase()} ===${colors.reset}`);

  const envPath = path.join(process.cwd(), schema.filePath);
  const env = loadEnvFile(envPath);

  if (!env) {
    log(`${schema.filePath} not found (using defaults)`, 'warning');
    hasWarnings = true;
  }

  const componentEnv = env || {};
  let componentValid = true;

  for (const [key, config] of Object.entries(schema.variables)) {
    if (!validateVariable(componentEnv, key, config)) {
      componentValid = false;
    }
  }

  if (componentValid && env) {
    log(`${name} environment configuration is valid`, 'success');
  }

  return componentValid;
}

/**
 * Validate connectivity to services
 */
async function validateConnectivity() {
  console.log(`\n${colors.cyan}=== Service Connectivity Check ===${colors.reset}`);

  // Check MongoDB
  const mongoUri = process.env.MONGODB_URI || '';
  if (mongoUri) {
    try {
      const { MongoClient } = await import('mongodb').catch(() => null);
      if (MongoClient) {
        log('MongoDB library available (connectivity check skipped)', 'info');
      }
    } catch (err) {
      log('MongoDB connectivity check skipped (driver not installed)', 'warning');
    }
  }

  // Check Redis
  const redisUrl = process.env.REDIS_URL || '';
  if (redisUrl) {
    try {
      const redis = await import('redis').catch(() => null);
      if (redis) {
        log('Redis library available (connectivity check skipped)', 'info');
      }
    } catch (err) {
      log('Redis connectivity check skipped (driver not installed)', 'warning');
    }
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);

  if (!hasErrors && !hasWarnings) {
    log('All environment variables are properly configured!', 'success');
    return 0;
  }

  if (hasWarnings) {
    log('Configuration has warnings (non-critical)', 'warning');
  }

  if (hasErrors) {
    log('Configuration has errors (must be fixed)', 'error');
    return 1;
  }

  return hasErrors ? 1 : 0;
}

/**
 * Main validation function
 */
async function main() {
  console.log(`\n${colors.cyan}🔧 Environment Configuration Validator${colors.reset}\n`);

  // Load root .env if exists
  const rootEnv = loadEnvFile('.env') || {};
  Object.entries(rootEnv).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });

  // Load component .env files
  for (const [name, schema] of Object.entries(validationSchemas)) {
    const componentEnv = loadEnvFile(path.join(process.cwd(), schema.filePath)) || {};
    Object.entries(componentEnv).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
    validateComponent(name, schema);
  }

  // Optional: Check connectivity
  await validateConnectivity();

  // Print summary and exit
  const exitCode = printSummary();
  process.exit(exitCode);
}

// Run validator
main().catch((error) => {
  console.error(`${colors.red}✗ Validator error: ${error.message}${colors.reset}`);
  process.exit(1);
});
