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
  durationMs?: number;
  checksum?: string;
}

export interface MigrationStatusEntry {
  filename: string;
  status: "executed" | "pending";
  executedAt?: Date;
  durationMs?: number;
}

export interface MigrationResult {
  filename: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

// Get or create migrations collection
async function getMigrationsCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  // Ensure the migrations collection itself has an index on name for fast lookups
  const col = db.collection("migrations");
  await col.createIndex({ name: 1 }, { unique: true, background: true });
  return col;
}

/**
 * Compute a simple checksum for a migration file so we can detect
 * if an already-executed migration has been modified on disk.
 */
function computeChecksum(filepath: string): string {
  const content = fs.readFileSync(filepath, "utf8");
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
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
 * Run pending migrations.
 *
 * @param dryRun  When true, migrations are loaded and validated but NOT executed.
 *                Useful for CI checks and pre-deployment verification.
 * @returns       Array of results — one entry per migration that was (or would be) run.
 */
export async function runMigrations(dryRun = false): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  try {
    logger.info(dryRun ? "🔍 Dry-run: checking pending migrations..." : "🔄 Starting migration process...");

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
      return results;
    }

    const executedMigrations = await migrationsCollection.find({}).toArray();
    const executedMap = new Map(
      (executedMigrations as MigrationRecord[]).map((m) => [m.name, m]),
    );

    // Warn if any executed migration file has been modified since it ran
    const migrationsDir = path.join(__dirname, "..", "migrations");
    for (const [name, record] of executedMap) {
      const filepath = path.join(migrationsDir, name);
      if (fs.existsSync(filepath) && record.checksum) {
        const current = computeChecksum(filepath);
        if (current !== record.checksum) {
          logger.warn(
            `⚠️  Migration file '${name}' has been modified after execution. ` +
            `Expected checksum ${record.checksum}, got ${current}.`,
          );
        }
      }
    }

    let migrationsRun = 0;
    const batch = await getNextBatch();

    for (const filename of migrationFiles) {
      if (executedMap.has(filename)) {
        logger.info(`⏭️  Skipping already executed migration: ${filename}`);
        continue;
      }

      if (dryRun) {
        // Validate the file can be loaded and has the required shape
        try {
          const migration = await loadMigration(filename);
          if (typeof migration.up !== "function" || typeof migration.down !== "function") {
            throw new Error("Migration must export an object with up() and down() functions");
          }
          logger.info(`✅ [dry-run] Valid migration: ${filename}`);
          results.push({ filename, success: true, durationMs: 0 });
        } catch (error: any) {
          logger.error(`❌ [dry-run] Invalid migration ${filename}: ${error.message}`);
          results.push({ filename, success: false, durationMs: 0, error: error.message });
        }
        continue;
      }

      const start = Date.now();
      try {
        logger.info(`⬆️  Running migration: ${filename}`);
        const migration = await loadMigration(filename);

        if (typeof migration.up !== "function" || typeof migration.down !== "function") {
          throw new Error("Migration must export an object with up() and down() functions");
        }

        await migration.up(mongoose.connection);
        const executionTime = Date.now() - startTime;

        // Calculate checksum
        const migrationsDir = path.join(__dirname, "..", "migrations");
        const filepath = path.join(migrationsDir, filename);
        const checksum = calculateChecksum(filepath);

        const durationMs = Date.now() - start;
        const filepath = path.join(migrationsDir, filename);
        const checksum = fs.existsSync(filepath) ? computeChecksum(filepath) : undefined;

        await migrationsCollection.insertOne({
          name: filename,
          executedAt: new Date(),
          durationMs,
          checksum,
        });

        logger.info(`✅ Migration '${filename}' completed in ${durationMs}ms`);
        results.push({ filename, success: true, durationMs });
        migrationsRun++;
      } catch (error: any) {
        const durationMs = Date.now() - start;
        logger.error(`❌ Failed to execute migration '${filename}' after ${durationMs}ms:`, error);
        results.push({ filename, success: false, durationMs, error: error.message });
        // Abort remaining migrations — a failed migration leaves the DB in an unknown state
        throw error;
      }
    }

    if (!dryRun) {
      logger.info(`✅ Migration process completed. ${migrationsRun} migration(s) executed.`);
    } else {
      const pending = results.length;
      const invalid = results.filter((r) => !r.success).length;
      logger.info(`🔍 Dry-run complete. ${pending} pending migration(s), ${invalid} invalid.`);
    }

    return results;
  } catch (error) {
    logger.error("❌ Migration process failed:", error);
    if (!dryRun) await releaseLock();
    throw error;
  }
}

/**
 * Rollback the last N executed migrations (default: 1).
 */
export async function rollbackMigration(steps = 1): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  try {
    logger.info(`🔄 Starting rollback process (${steps} step(s))...`);

    const migrationsCollection = await getMigrationsCollection();

    const executedMigrations = await migrationsCollection
      .find({})
      .sort({ executedAt: -1 })
      .limit(steps)
      .toArray();

    if (executedMigrations.length === 0) {
      logger.info("⚠️  No executed migrations to rollback");
      return results;
    }

    for (const record of executedMigrations as MigrationRecord[]) {
      const start = Date.now();
      logger.info(`⬇️  Rolling back migration: ${record.name}`);

      try {
        const migration = await loadMigration(record.name);
        await migration.down(mongoose.connection);

        await migrationsCollection.deleteOne({ name: record.name });

        const durationMs = Date.now() - start;
        logger.info(`✅ Rolled back '${record.name}' in ${durationMs}ms`);
        results.push({ filename: record.name, success: true, durationMs });
      } catch (error: any) {
        const durationMs = Date.now() - start;
        logger.error(`❌ Rollback of '${record.name}' failed after ${durationMs}ms:`, error);
        results.push({ filename: record.name, success: false, durationMs, error: error.message });
        throw error;
      }
    }

    logger.info(`✅ Rollback complete. ${results.length} migration(s) rolled back.`);
    return results;
  } catch (error) {
    logger.error("❌ Rollback process failed:", error);
    if (!dryRun) await releaseLock();
    throw error;
  }
}

/**
 * Get migration status — returns structured data and prints a summary table.
 */
export async function getMigrationStatus(): Promise<MigrationStatusEntry[]> {
  try {
    const migrationsCollection = await getMigrationsCollection();
    const migrationFiles = getMigrationFiles();

    const executedMigrations = await migrationsCollection.find({}).toArray();
    const executedMap = new Map(
      (executedMigrations as MigrationRecord[]).map((m) => [m.name, m]),
    );

    const entries: MigrationStatusEntry[] = migrationFiles.map((filename) => {
      const record = executedMap.get(filename);
      return record
        ? { filename, status: "executed", executedAt: record.executedAt, durationMs: record.durationMs }
        : { filename, status: "pending" };
    });

    // Also surface any executed migrations whose files no longer exist on disk
    for (const [name, record] of executedMap) {
      if (!migrationFiles.includes(name)) {
        entries.push({
          filename: name,
          status: "executed",
          executedAt: record.executedAt,
          durationMs: record.durationMs,
        });
        logger.warn(`⚠️  Executed migration '${name}' no longer exists on disk`);
      }
    }

    if (entries.length === 0) {
      logger.info("ℹ️  No migrations found");
      return entries;
    }

    console.log("\n📊 Migration Status:");
    console.log("─".repeat(72));
    console.log(
      `${"Status".padEnd(12)} ${"Duration".padEnd(10)} ${"Executed At".padEnd(24)} Filename`,
    );
    console.log("─".repeat(72));

    for (const entry of entries) {
      const statusLabel = entry.status === "executed" ? "✅ Executed" : "⏳ Pending ";
      const duration = entry.durationMs != null ? `${entry.durationMs}ms` : "—";
      const executedAt = entry.executedAt ? entry.executedAt.toISOString() : "—";
      console.log(
        `${statusLabel.padEnd(12)} ${duration.padEnd(10)} ${executedAt.padEnd(24)} ${entry.filename}`,
      );
    }

    console.log("─".repeat(72));
    const executedCount = entries.filter((e) => e.status === "executed").length;
    const pendingCount = entries.filter((e) => e.status === "pending").length;
    console.log(
      `Total: ${entries.length} | Executed: ${executedCount} | Pending: ${pendingCount}\n`,
    );

    return entries;
  } catch (error) {
    logger.error("Failed to get migration status:", error);
    throw error;
  }
}

/**
 * Force run a specific migration by filename (for development only).
 * This bypasses the "already executed" check — use with caution.
 */
export async function runSpecificMigration(
  migrationName: string,
): Promise<MigrationResult> {
  const start = Date.now();
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
    const migrationsDir = path.join(__dirname, "..", "migrations");

    // Check if migration already exists
    const existing = await migrationsCollection.findOne({ name: migrationName });
    if (existing) {
      logger.warn(`⚠️  Migration ${migrationName} has already been executed`);
      if (!dryRun) await releaseLock();
      return;
    }

    const migration = await loadMigration(migrationName);

    if (typeof migration.up !== "function" || typeof migration.down !== "function") {
      throw new Error("Migration must export an object with up() and down() functions");
    }

    await migration.up(mongoose.connection);
    const executionTime = Date.now() - startTime;

    // Calculate checksum
    const migrationsDir = path.join(__dirname, "..", "migrations");
    const filepath = path.join(migrationsDir, migrationName);
    const checksum = calculateChecksum(filepath);
    const batch = await getNextBatch();

    const durationMs = Date.now() - start;
    const filepath = path.join(migrationsDir, migrationName);
    const checksum = fs.existsSync(filepath) ? computeChecksum(filepath) : undefined;

    // Upsert so re-running doesn't create duplicate records
    await migrationsCollection.updateOne(
      { name: migrationName },
      { $set: { name: migrationName, executedAt: new Date(), durationMs, checksum } },
      { upsert: true },
    );

    logger.info(`✅ Migration '${migrationName}' completed in ${durationMs}ms`);
    return { filename: migrationName, success: true, durationMs };
  } catch (error: any) {
    const durationMs = Date.now() - start;
    logger.error(`❌ Failed to execute migration '${migrationName}' after ${durationMs}ms:`, error);
    return { filename: migrationName, success: false, durationMs, error: error.message };
  }
}
