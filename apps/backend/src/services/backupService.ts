import mongoose from "mongoose";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { createLogger } from "../utils/logger";

const logger = createLogger("BackupService");
const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  collections: string[];
  oplogEnd?: number;
  path: string;
}

class BackupService {
  private backupDir: string;
  private retentionDays: number;
  private s3Bucket?: string;
  private s3Region?: string;

  constructor() {
    this.backupDir =
      process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || "7");
    this.s3Bucket = process.env.AWS_S3_BUCKET_BACKUP;
    this.s3Region = process.env.AWS_REGION;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async createBackup(): Promise<BackupMetadata> {
    const timestamp = new Date();
    const backupId = `backup-${timestamp.toISOString().replace(/[:.]/g, "-")}`;
    const backupPath = path.join(this.backupDir, backupId);

    await fs.mkdir(backupPath, { recursive: true });

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/muse";
    const parsedUri = new URL(uri);
    const dbName = parsedUri.pathname.replace("/", "") || "muse";
    const host = parsedUri.host || "localhost:27017";

    try {
      const dumpCmd = `mongodump --uri="${uri}" --out="${backupPath}" --gzip`;
      await execAsync(dumpCmd);

      const collections = await this.getCollections();
      const stats = await fs.stat(backupPath);
      const size = await this.getDirectorySize(backupPath);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        size,
        collections,
        path: backupPath,
      };

      if (this.s3Bucket) {
        await this.uploadToS3(backupPath, backupId);
      }

      await this.pruneOldBackups();

      logger.info(`Backup ${backupId} created successfully`, {
        size,
        collections: collections.length,
      });
      return metadata;
    } catch (error) {
      logger.error("Backup failed:", error);
      throw error;
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
    const backups: BackupMetadata[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const backupPath = path.join(this.backupDir, entry.name);
        try {
          const stats = await fs.stat(backupPath);
          const collections = await this.getCollections();
          backups.push({
            id: entry.name,
            timestamp: stats.mtime,
            size: await this.getDirectorySize(backupPath),
            collections,
            path: backupPath,
          });
        } catch {
          // Skip invalid backup directories
        }
      }
    }

    return backups.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async restoreBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/muse";

    try {
      await mongoose.disconnect();
      const restoreCmd = `mongorestore --uri="${uri}" --gzip --drop "${backupPath}"`;
      await execAsync(restoreCmd);
      await mongoose.connect(uri);
      logger.info(`Backup ${backupId} restored successfully`);
    } catch (error) {
      logger.error("Restore failed:", error);
      throw error;
    }
  }

  async pointInTimeRecovery(targetTime: Date): Promise<void> {
    const backups = await this.listBackups();
    const sorted = backups.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    let sourceBackup = sorted[0];
    for (const backup of sorted) {
      if (backup.timestamp <= targetTime) {
        sourceBackup = backup;
      } else {
        break;
      }
    }

    await this.restoreBackup(sourceBackup.id);
    logger.info(
      `Point-in-time recovery completed using backup ${sourceBackup.id} for target ${targetTime.toISOString()}`,
    );
  }

  private async getCollections(): Promise<string[]> {
    const db = mongoose.connection.db;
    if (!db) return [];
    const collections = await db.listCollections().toArray();
    return collections.map((c) => c.name);
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let total = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        total += stats.size;
      }
    }
    return total;
  }

  private async pruneOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);

    for (const backup of backups) {
      if (backup.timestamp < cutoff) {
        await fs.rm(backup.path, { recursive: true, force: true });
        logger.info(`Pruned old backup: ${backup.id}`);
      }
    }
  }

  private async uploadToS3(localPath: string, backupId: string): Promise<void> {
    if (!this.s3Bucket) return;
    try {
      const cmd = `aws s3 sync "${localPath}" "s3://${this.s3Bucket}/backups/${backupId}" --region ${this.s3Region || "us-east-1"}`;
      await execAsync(cmd);
      logger.info(`Backup ${backupId} uploaded to S3`);
    } catch (error) {
      logger.error("S3 upload failed:", error);
    }
  }
}

export const backupService = new BackupService();
