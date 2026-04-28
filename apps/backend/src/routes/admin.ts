import { Router } from 'express';
import { adminController } from '@/controllers/adminController';
import { authenticateAdmin } from '@/middleware/adminAuth';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

// ── Contract Upgrades ──────────────────────────────────────────────────────
router.post('/contract/upgrade', (req, res) => adminController.upgradeContract(req as any, res));
router.get('/contract/history', (req, res) => adminController.getContractUpgradeHistory(req as any, res));

// ── Database Migrations ────────────────────────────────────────────────────
router.post('/migrations/run', (req, res) => adminController.runMigrations(req as any, res));
router.post('/migrations/rollback', (req, res) => adminController.rollbackMigration(req as any, res));
router.get('/migrations/status', (req, res) => adminController.getMigrationStatus(req as any, res));

export default router;
