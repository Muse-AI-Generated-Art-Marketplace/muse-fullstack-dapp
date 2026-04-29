import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
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
  checksum: string;
  executionTime: number;
  batch: number;
}

interface MigrationLock {
  _id: string;
  locked: boolean;
  lockedAt: Date;
  lockedBy: string;
}

// Get or create migrations collection
async function getMigrationsCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("migrations");
}

// Get or create migration lock collection
async function getMigrationLockCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("migration_locks");
}

// Calculate checksum of a migration file
function calculateChecksum(filepath: string): string {
  const fileContent = fs.readFileSync(filepath, 'utf8');
  return crypto.createHash('sha256').update(fileContent).digest('hex');
}

// Acquire migration lock to prevent concurrent migrations
async function acquireLock(): Promise<boolean> {
  const lockCollection = await getMigrationLockCollection();
  const lockId = 'migration_lock';
  const hostname = require('os').hostname();
  const pid = process.pid;
  const lockedBy = `${hostname}-${pid}`;

  try {
    const result = await lockCollection.findOneAndUpdate(
      { _id: lockId },
      {
        $setOnInsert: {
          _id: lockId,
          locked: true,
          lockedAt: new Date(),
          lockedBy
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Check if lock was already held by another process
    if (result && result.locked && result.lockedBy !== lockedBy) {
      const lockAge = Date.now() - new Date(result.lockedAt).getTime();
      // If lock is older than 30 minutes, assume stale and take over
      if (lockAge > 30 * 60 * 1000) {
        await lockCollection.updateOne(
          { _id: lockId },
          { $set: { locked: true, lockedAt: new Date(), lockedBy } }
        );
        logger.info('⚠️  Acquired stale migration lock');
        return true;
      }
      logger.warn('⚠️  Migration already in progress by another process');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to acquire migration lock:', error);
    return false;
  }
}

// Release migration lock
async function releaseLock(): Promise<void> {
  const lockCollection = await getMigrationLockCollection();
  const lockId = 'migration_lock';

  try {
    await lockCollection.deleteOne({ _id: lockId });
  } catch (error) {
    logger.error('Failed to release migration lock:', error);
  }
}

// Get next batch number
async function getNextBatch(): Promise<number> {
  const migrationsCollection = await getMigrationsCollection();
  const lastMigration = await migrationsCollection
    .find({})
    .sort({ batch: -1 })
    .limit(1)
    .toArray();

  if (lastMigration.length === 0) {
    return 1;
  }
  return (lastMigration[0] as MigrationRecord).batch + 1;
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
export async function runMigrations(options: { dryRun?: boolean } = {}): Promise<void> {
  const { dryRun = false } = options;

  try {
    logger.info("🔄 Starting migration process...");

    // Acquire lock to prevent concurrent migrations
    if (!dryRun) {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        throw new Error("Could not acquire migration lock - another migration may be in progress");
      }
    }

    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.info("✅ No migrations found");
      if (!dryRun) await releaseLock();
      return;
    }

    const executedMigrations = await migrationsCollection.find({}).toArray();
    const executedNames = new Set(
      (executedMigrations as MigrationRecord[]).map((m) => m.name),
    );

    let migrationsRun = 0;
    const batch = await getNextBatch();

    for (const filename of migrationFiles) {
      if (executedNames.has(filename)) {
        // Verify checksum for already executed migrations
        const migrationsDir = path.join(__dirname, "..", "migrations");
        const filepath = path.join(migrationsDir, filename);
        const currentChecksum = calculateChecksum(filepath);
        const executedMigration = executedMigrations.find((m: any) => m.name === filename);

        if (executedMigration && executedMigration.checksum !== currentChecksum) {
          logger.warn(`⚠️  Migration file ${filename} has been modified since execution. Checksum mismatch!`);
          if (!dryRun) {
            logger.warn(`Previous checksum: ${executedMigration.checksum}`);
            logger.warn(`Current checksum: ${currentChecksum}`);
          }
        }

        logger.info(`⏭️  Skipping already executed migration: ${filename}`);
        continue;
      }

      try {
        logger.info(`⬆️  Running migration: ${filename}`);
        const migration = await loadMigration(filename);

        if (dryRun) {
          logger.info(`[DRY RUN] Would execute migration: ${filename}`);
          migrationsRun++;
          continue;
        }

        const startTime = Date.now();
        await migration.up(mongoose.connection);
        const executionTime = Date.now() - startTime;

        // Calculate checksum
        const migrationsDir = path.join(__dirname, "..", "migrations");
        const filepath = path.join(migrationsDir, filename);
        const checksum = calculateChecksum(filepath);

        await migrationsCollection.insertOne({
          name: filename,
          executedAt: new Date(),
          checksum,
          executionTime,
          batch,
        });

        logger.info(`✅ Successfully executed migration: ${filename} (${executionTime}ms)`);
        migrationsRun++;
      } catch (error) {
        logger.error(`❌ Failed to execute migration ${filename}:`, error);
        if (!dryRun) await releaseLock();
        throw error;
      }
    }

    logger.info(
      `✅ Migration process completed. ${migrationsRun} migration(s) executed in batch ${batch}.`,
    );

    if (!dryRun) await releaseLock();
  } catch (error) {
    logger.error("❌ Migration process failed:", error);
    if (!dryRun) await releaseLock();
    throw error;
  }
}

/**
 * Rollback the last migration
 */
export async function rollbackMigration(steps: number = 1, options: { dryRun?: boolean } = {}): Promise<void> {
  const { dryRun = false } = options;

  try {
    logger.info(`🔄 Starting rollback process (steps: ${steps})...`);

    // Acquire lock to prevent concurrent migrations
    if (!dryRun) {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        throw new Error("Could not acquire migration lock - another migration may be in progress");
      }
    }

    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.info("⚠️  No migrations found");
      if (!dryRun) await releaseLock();
      return;
    }

    const executedMigrations = await migrationsCollection
      .find({})
      .sort({ executedAt: -1 })
      .limit(steps)
      .toArray();

    if (executedMigrations.length === 0) {
      logger.info("⚠️  No executed migrations to rollback");
      if (!dryRun) await releaseLock();
      return;
    }

    let rolledBack = 0;
    for (const migrationRecord of executedMigrations) {
      const migration = migrationRecord as MigrationRecord;
      logger.info(`⬇️  Rolling back migration: ${migration.name}`);

      // Verify checksum before rollback
      const migrationsDir = path.join(__dirname, "..", "migrations");
      const filepath = path.join(migrationsDir, migration.name);
      const currentChecksum = calculateChecksum(filepath);

      if (migration.checksum !== currentChecksum) {
        logger.warn(`⚠️  Migration file ${migration.name} has been modified since execution. Checksum mismatch!`);
        logger.warn(`Previous checksum: ${migration.checksum}`);
        logger.warn(`Current checksum: ${currentChecksum}`);
        if (!dryRun) {
          throw new Error(`Cannot rollback migration ${migration.name} - file has been modified`);
        }
      }

      if (dryRun) {
        logger.info(`[DRY RUN] Would rollback migration: ${migration.name}`);
        rolledBack++;
        continue;
      }

      const migrationFile = await loadMigration(migration.name);
      await migrationFile.down(mongoose.connection);

      await migrationsCollection.deleteOne({ name: migration.name });

      logger.info(`✅ Successfully rolled back migration: ${migration.name}`);
      rolledBack++;
    }

    logger.info(`✅ Rollback process completed. ${rolledBack} migration(s) rolled back.`);

    if (!dryRun) await releaseLock();
  } catch (error) {
    logger.error("❌ Rollback process failed:", error);
    if (!dryRun) await releaseLock();
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
    console.log("─".repeat(80));

    migrationFiles.forEach((filename) => {
      const status = executedNames.has(filename) ? "✅ Executed" : "⏳ Pending";
      const executedMigration = executedMigrations.find((m: any) => m.name === filename);
      const checksum = executedMigration ? executedMigration.checksum.substring(0, 8) : "N/A";
      const batch = executedMigration ? executedMigration.batch : "N/A";
      const execTime = executedMigration ? `${executedMigration.executionTime}ms` : "N/A";
      console.log(`${status} | ${filename} | Batch: ${batch} | Time: ${execTime} | Checksum: ${checksum}`);
    });

    console.log("─".repeat(80));
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
  options: { dryRun?: boolean } = {},
): Promise<void> {
  const { dryRun = false } = options;

  try {
    logger.info(`🔄 Running specific migration: ${migrationName}`);

    // Acquire lock to prevent concurrent migrations
    if (!dryRun) {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        throw new Error("Could not acquire migration lock - another migration may be in progress");
      }
    }

    const migrationsCollection = await getMigrationsCollection();

    // Check if migration already exists
    const existing = await migrationsCollection.findOne({ name: migrationName });
    if (existing) {
      logger.warn(`⚠️  Migration ${migrationName} has already been executed`);
      if (!dryRun) await releaseLock();
      return;
    }

    const migration = await loadMigration(migrationName);

    if (dryRun) {
      logger.info(`[DRY RUN] Would execute migration: ${migrationName}`);
      if (!dryRun) await releaseLock();
      return;
    }

    const startTime = Date.now();
    await migration.up(mongoose.connection);
    const executionTime = Date.now() - startTime;

    // Calculate checksum
    const migrationsDir = path.join(__dirname, "..", "migrations");
    const filepath = path.join(migrationsDir, migrationName);
    const checksum = calculateChecksum(filepath);
    const batch = await getNextBatch();

    await migrationsCollection.insertOne({
      name: migrationName,
      executedAt: new Date(),
      checksum,
      executionTime,
      batch,
    });

    logger.info(`✅ Successfully executed migration: ${migrationName} (${executionTime}ms)`);
    if (!dryRun) await releaseLock();
  } catch (error) {
    logger.error(`❌ Failed to execute migration ${migrationName}:`, error);
    if (!dryRun) await releaseLock();
    throw error;
  }
}

/**
 * Rollback to a specific batch
 */
export async function rollbackToBatch(batchNumber: number, options: { dryRun?: boolean } = {}): Promise<void> {
  const { dryRun = false } = options;

  try {
    logger.info(`🔄 Rolling back to batch ${batchNumber}...`);

    // Acquire lock to prevent concurrent migrations
    if (!dryRun) {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        throw new Error("Could not acquire migration lock - another migration may be in progress");
      }
    }

    const migrationsCollection = await getMigrationsCollection();

    // Get all migrations after the specified batch
    const migrationsToRollback = await migrationsCollection
      .find({ batch: { $gt: batchNumber } })
      .sort({ executedAt: -1 })
      .toArray();

    if (migrationsToRollback.length === 0) {
      logger.info("⚠️  No migrations to rollback for the specified batch");
      if (!dryRun) await releaseLock();
      return;
    }

    logger.info(`Found ${migrationsToRollback.length} migration(s) to rollback`);

    let rolledBack = 0;
    for (const migrationRecord of migrationsToRollback) {
      const migration = migrationRecord as MigrationRecord;
      logger.info(`⬇️  Rolling back migration: ${migration.name}`);

      // Verify checksum before rollback
      const migrationsDir = path.join(__dirname, "..", "migrations");
      const filepath = path.join(migrationsDir, migration.name);
      const currentChecksum = calculateChecksum(filepath);

      if (migration.checksum !== currentChecksum) {
        logger.warn(`⚠️  Migration file ${migration.name} has been modified since execution. Checksum mismatch!`);
        logger.warn(`Previous checksum: ${migration.checksum}`);
        logger.warn(`Current checksum: ${currentChecksum}`);
        if (!dryRun) {
          throw new Error(`Cannot rollback migration ${migration.name} - file has been modified`);
        }
      }

      if (dryRun) {
        logger.info(`[DRY RUN] Would rollback migration: ${migration.name}`);
        rolledBack++;
        continue;
      }

      const migrationFile = await loadMigration(migration.name);
      await migrationFile.down(mongoose.connection);

      await migrationsCollection.deleteOne({ name: migration.name });

      logger.info(`✅ Successfully rolled back migration: ${migration.name}`);
      rolledBack++;
    }

    logger.info(`✅ Rollback to batch ${batchNumber} completed. ${rolledBack} migration(s) rolled back.`);

    if (!dryRun) await releaseLock();
  } catch (error) {
    logger.error("❌ Rollback to batch failed:", error);
    if (!dryRun) await releaseLock();
    throw error;
  }
}

/**
 * Validate migration checksums
 */
export async function validateMigrations(): Promise<{ valid: boolean; issues: string[] }> {
  try {
    logger.info("🔍 Validating migration checksums...");

    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();
    const executedMigrations = await migrationsCollection.find({}).toArray();
    const issues: string[] = [];

    for (const migrationRecord of executedMigrations) {
      const migration = migrationRecord as MigrationRecord;
      const migrationsDir = path.join(__dirname, "..", "migrations");
      const filepath = path.join(migrationsDir, migration.name);

      if (!fs.existsSync(filepath)) {
        issues.push(`Migration file ${migration.name} no longer exists`);
        continue;
      }

      const currentChecksum = calculateChecksum(filepath);
      if (migration.checksum !== currentChecksum) {
        issues.push(
          `Migration ${migration.name} has been modified. ` +
          `Expected: ${migration.checksum}, Current: ${currentChecksum}`
        );
      }
    }

    if (issues.length === 0) {
      logger.info("✅ All migration checksums are valid");
    } else {
      logger.warn(`⚠️  Found ${issues.length} checksum issue(s)`);
      issues.forEach(issue => logger.warn(`  - ${issue}`));
    }

    return { valid: issues.length === 0, issues };
  } catch (error) {
    logger.error("Failed to validate migrations:", error);
    throw error;
  }
}
