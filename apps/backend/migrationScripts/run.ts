#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  runSpecificMigration,
  rollbackToBatch,
  validateMigrations,
} from "../src/services/migrationService";
import { createLogger } from "../src/utils/logger";

const logger = createLogger("MigrationCLI");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/muse";

function parseDryRun(): boolean {
  return process.argv.includes("--dry-run") || process.argv.includes("-d");
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info("✅ Connected to MongoDB");

    const command = process.argv[2];
    const arg = process.argv[3];
    const dryRun = parseDryRun();

    if (dryRun) {
      logger.info("🔍 DRY RUN MODE - No changes will be made");
    }

    switch (command) {
      case "up":
      case "migrate":
        await runMigrations({ dryRun });
        break;

      case "down":
      case "rollback":
        const steps = arg ? parseInt(arg, 10) : 1;
        await rollbackMigration(steps, { dryRun });
        break;

      case "status":
        await getMigrationStatus();
        break;

      case "run":
        if (!arg) {
          logger.error(
            "❌ Migration name required. Usage: npm run migrate:run <migration-name>",
          );
          process.exit(1);
        }
        await runSpecificMigration(arg, { dryRun });
        break;

      case "batch":
        if (!arg) {
          logger.error(
            "❌ Batch number required. Usage: npm run migrate:batch <batch-number>",
          );
          process.exit(1);
        }
        const batchNumber = parseInt(arg, 10);
        if (isNaN(batchNumber)) {
          logger.error("❌ Invalid batch number");
          process.exit(1);
        }
        await rollbackToBatch(batchNumber, { dryRun });
        break;

      case "validate":
        const result = await validateMigrations();
        if (result.valid) {
          logger.info("✅ All migrations are valid");
          process.exit(0);
        } else {
          logger.error("❌ Migration validation failed");
          result.issues.forEach(issue => logger.error(`  - ${issue}`));
          process.exit(1);
        }
        break;

      default:
        console.log(`
📚 Database Migration CLI

Usage:
  npm run migrate                    Run pending migrations
  npm run migrate:rollback [steps]   Rollback last N migrations (default: 1)
  npm run migrate:status             Check migration status
  npm run migrate:run <name>         Run a specific migration
  npm run migrate:batch <number>     Rollback to a specific batch
  npm run migrate:validate           Validate migration checksums

Options:
  --dry-run, -d                     Preview changes without executing

Examples:
  npm run migrate
  npm run migrate --dry-run
  npm run migrate:rollback
  npm run migrate:rollback 3
  npm run migrate:status
  npm run migrate:run 001_create_users_collection
  npm run migrate:batch 2
  npm run migrate:validate
  npm run migrate:rollback --dry-run
        `);
    }

    await mongoose.disconnect();
    logger.info("✅ Migration process complete");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
