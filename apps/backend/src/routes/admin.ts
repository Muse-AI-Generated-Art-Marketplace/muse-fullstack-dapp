import { Router } from "express";
import { adminController } from "@/controllers/adminController";
import { authenticateAdmin } from "@/middleware/adminAuth";
import { backupService } from "@/services/backupService";

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

// ── Contract Upgrades ──────────────────────────────────────────────────────
router.post("/contract/upgrade", (req, res) =>
  adminController.upgradeContract(req as any, res),
);
router.get("/contract/history", (req, res) =>
  adminController.getContractUpgradeHistory(req as any, res),
);

// ── Database Migrations ────────────────────────────────────────────────────
router.post("/migrations/run", (req, res) =>
  adminController.runMigrations(req as any, res),
);
router.post("/migrations/rollback", (req, res) =>
  adminController.rollbackMigration(req as any, res),
);
router.get("/migrations/status", (req, res) =>
  adminController.getMigrationStatus(req as any, res),
);

// ── Backup & Recovery ───────────────────────────────────────────────────────
router.post("/backup", async (req, res) => {
  try {
    const metadata = await backupService.createBackup();
    res.status(201).json({ success: true, data: metadata });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/backup", async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, data: backups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/backup/:backupId/restore", async (req, res) => {
  try {
    await backupService.restoreBackup(req.params.backupId);
    res.json({ success: true, message: "Restore completed" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/backup/point-in-time", async (req, res) => {
  try {
    const { targetTime } = req.body;
    if (!targetTime)
      return res
        .status(400)
        .json({ success: false, error: "targetTime required" });
    await backupService.pointInTimeRecovery(new Date(targetTime));
    res.json({ success: true, message: "Point-in-time recovery completed" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
