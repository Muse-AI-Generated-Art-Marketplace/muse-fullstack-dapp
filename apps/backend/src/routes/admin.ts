import { Router } from 'express';
import { adminController } from '@/controllers/adminController';
import { authenticateAdmin } from '@/middleware/adminAuth';
import { validate } from '@/middleware/validate';
import {
  getUserManagementSchema,
  updateUserStatusSchema,
  getSystemStatsSchema,
  getContentModerationSchema,
  moderateContentSchema
} from '@/schemas';
import {
  getUserListSchema,
  updateUserTierSchema,
  resetUserRateLimitsSchema,
  getUserRateLimitStatusSchema,
  rateLimitStatsSchema
} from '@/schemas/rateLimitSchemas';
import {
  getAllUsers,
  updateUserTier,
  getRateLimitStats,
  resetUserRateLimits,
  getUserRateLimitStatus
} from '@/controllers/adminRateLimitController';

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

// ── Rate Limit Management ────────────────────────────────────────────────────
router.get('/users', validate(getUserListSchema), getAllUsers);
router.put('/users/:userId/tier', validate(updateUserTierSchema), updateUserTier);
router.get('/rate-limit/stats', validate(rateLimitStatsSchema), getRateLimitStats);
router.post('/users/:userId/reset-rate-limits', validate(resetUserRateLimitsSchema), resetUserRateLimits);
router.get('/users/:userId/rate-limit-status', validate(getUserRateLimitStatusSchema), getUserRateLimitStatus);

export default router;
