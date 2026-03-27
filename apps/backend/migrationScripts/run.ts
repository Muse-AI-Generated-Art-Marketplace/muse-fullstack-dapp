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
      case "migrate":
        await runMigrations();
        break;

      case "down":
      case "rollback":
        await rollbackMigration();
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
        await runSpecificMigration(arg);
        break;

      default:
        console.log(`
📚 Database Migration CLI

Usage:
  npm run migrate              Run pending migrations
  npm run migrate:rollback     Rollback the last migration
  npm run migrate:status       Check migration status
  npm run migrate:run <name>   Run a specific migration

Examples:
  npm run migrate
  npm run migrate:rollback
  npm run migrate:status
  npm run migrate:run 001_create_users_collection
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
