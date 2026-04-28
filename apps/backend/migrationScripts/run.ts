#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  runSpecificMigration,
} from "../src/services/migrationService";
import { createLogger } from "../src/utils/logger";

const logger = createLogger("MigrationCLI");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/muse";

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info("✅ Connected to MongoDB");

    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
      case "up":
      case "migrate": {
        const results = await runMigrations();
        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) process.exit(1);
        break;
      }

      case "dry-run": {
        const results = await runMigrations(true);
        const invalid = results.filter((r) => !r.success);
        if (invalid.length > 0) {
          logger.error(`❌ ${invalid.length} invalid migration(s) found`);
          process.exit(1);
        }
        break;
      }

      case "down":
      case "rollback": {
        // Optional: pass number of steps, e.g. `npm run migrate:rollback -- 3`
        const steps = arg ? parseInt(arg, 10) : 1;
        if (isNaN(steps) || steps < 1) {
          logger.error("❌ Steps must be a positive integer");
          process.exit(1);
        }
        await rollbackMigration(steps);
        break;
      }

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
        await runSpecificMigration(arg);
        break;

      default:
        console.log(`
📚 Database Migration CLI

Usage:
  npm run migrate                      Run all pending migrations
  npm run migrate:dry-run              Validate pending migrations without executing
  npm run migrate:rollback             Rollback the last migration
  npm run migrate:rollback -- <steps>  Rollback the last N migrations
  npm run migrate:status               Check migration status
  npm run migrate:run <name>           Force-run a specific migration
  npm run migrate:create <name>        Generate a new migration file

Examples:
  npm run migrate
  npm run migrate:dry-run
  npm run migrate:rollback
  npm run migrate:rollback -- 3
  npm run migrate:status
  npm run migrate:run 005_create_transactions_bids_auctions
  npm run migrate:create add_user_email_field
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
