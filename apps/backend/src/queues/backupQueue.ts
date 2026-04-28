import Queue from "bull";
import { backupService } from "../services/backupService";
import { createLogger } from "../utils/logger";

const logger = createLogger("BackupQueue");

export const backupQueue = new Queue(
  "backup",
  process.env.REDIS_URL || "redis://localhost:6379",
);

backupQueue.process(async (job) => {
  logger.info("Processing scheduled backup job");
  try {
    await backupService.createBackup();
  } catch (error) {
    logger.error("Scheduled backup failed:", error);
    throw error;
  }
});

const cronSchedule = process.env.BACKUP_SCHEDULE_CRON;
if (cronSchedule) {
  backupQueue.add({}, { repeat: { cron: cronSchedule } });
  logger.info(`Scheduled backups with cron: ${cronSchedule}`);
}

backupQueue.on("completed", (job) => {
  logger.info(`Backup job ${job.id} completed`);
});

backupQueue.on("failed", (job, err) => {
  logger.error(`Backup job ${job.id} failed:`, err);
});
