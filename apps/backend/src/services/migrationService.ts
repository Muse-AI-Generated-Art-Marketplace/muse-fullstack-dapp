import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { createLogger } from "@/utils/logger";

const logger = createLogger("MigrationService");

interface MigrationFile {
  name: string;
  up: (client: any) => Promise<void>;
  down: (client: any) => Promise<void>;
}

interface MigrationRecord {
  name: string;
  executedAt: Date;
}

// Get or create migrations collection
async function getMigrationsCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("migrations");
}

/**
 * Get list of migration files
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
    .sort();
}

/**
 * Load a migration file
 */
async function loadMigration(filename: string): Promise<MigrationFile> {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const filepath = path.join(migrationsDir, filename);

  // Clear require cache in development
  delete require.cache[require.resolve(filepath)];

  const migration = await import(filepath);
  return migration.default;
}

/**
 * Run pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info("🔄 Starting migration process...");

    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.info("✅ No migrations found");
      return;
    }

    const executedMigrations = await migrationsCollection.find({}).toArray();
    const executedNames = new Set(
      (executedMigrations as MigrationRecord[]).map((m) => m.name),
    );

    let migrationsRun = 0;
    for (const filename of migrationFiles) {
      if (executedNames.has(filename)) {
        logger.info(`⏭️  Skipping already executed migration: ${filename}`);
        continue;
      }

      try {
        logger.info(`⬆️  Running migration: ${filename}`);
        const migration = await loadMigration(filename);

        await migration.up(mongoose.connection);

        await migrationsCollection.insertOne({
          name: filename,
          executedAt: new Date(),
        });

        logger.info(`✅ Successfully executed migration: ${filename}`);
        migrationsRun++;
      } catch (error) {
        logger.error(`❌ Failed to execute migration ${filename}:`, error);
        throw error;
      }
    }

    logger.info(
      `✅ Migration process completed. ${migrationsRun} migration(s) executed.`,
    );
  } catch (error) {
    logger.error("❌ Migration process failed:", error);
    throw error;
  }
}

/**
 * Rollback the last migration
 */
export async function rollbackMigration(): Promise<void> {
  try {
    logger.info("🔄 Starting rollback process...");

    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.info("⚠️  No migrations found");
      return;
    }

    const executedMigrations = await migrationsCollection
      .find({})
      .sort({ executedAt: -1 })
      .limit(1)
      .toArray();

    if (executedMigrations.length === 0) {
      logger.info("⚠️  No executed migrations to rollback");
      return;
    }

    const lastMigration = executedMigrations[0] as MigrationRecord;
    logger.info(`⬇️  Rolling back migration: ${lastMigration.name}`);

    const migration = await loadMigration(lastMigration.name);
    await migration.down(mongoose.connection);

    await migrationsCollection.deleteOne({ name: lastMigration.name });

    logger.info(`✅ Successfully rolled back migration: ${lastMigration.name}`);
  } catch (error) {
    logger.error("❌ Rollback process failed:", error);
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<void> {
  try {
    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.info("ℹ️  No migrations found");
      return;
    }

    const executedMigrations = await migrationsCollection.find({}).toArray();
    const executedNames = new Set(
      (executedMigrations as MigrationRecord[]).map((m) => m.name),
    );

    if (migrationFiles.length === 0) {
      return;
    }

    console.log("\n📊 Migration Status:");
    console.log("─".repeat(60));

    migrationFiles.forEach((filename) => {
      const status = executedNames.has(filename) ? "✅ Executed" : "⏳ Pending";
      console.log(`${status} | ${filename}`);
    });

    console.log("─".repeat(60));
    const pendingCount = migrationFiles.length - executedNames.size;
    console.log(
      `Total: ${migrationFiles.length} | Executed: ${executedNames.size} | Pending: ${pendingCount}\n`,
    );
  } catch (error) {
    logger.error("Failed to get migration status:", error);
    throw error;
  }
}

/**
 * Force run a specific migration (for development only)
 */
export async function runSpecificMigration(
  migrationName: string,
): Promise<void> {
  try {
    logger.info(`🔄 Running specific migration: ${migrationName}`);

    const migrationsCollection = await getMigrationsCollection();

    const migration = await loadMigration(migrationName);
    await migration.up(mongoose.connection);

    await migrationsCollection.insertOne({
      name: migrationName,
      executedAt: new Date(),
    });

    logger.info(`✅ Successfully executed migration: ${migrationName}`);
  } catch (error) {
    logger.error(`❌ Failed to execute migration ${migrationName}:`, error);
    throw error;
  }
}
