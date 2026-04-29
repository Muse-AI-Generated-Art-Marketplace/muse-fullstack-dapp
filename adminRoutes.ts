import { Router } from 'express';
import { adminController } from '../controllers/adminController';
// import { authenticateAdmin } from '../middleware/authMiddleware'; // Assuming an admin authentication middleware

const router = Router();

// In a real application, these routes would be protected by robust admin authentication and authorization.
// For this exercise, we'll assume `req.user.address` is populated by a preceding auth middleware.

// router.use(authenticateAdmin); // Example admin authentication

router.post('/contract/upgrade', adminController.upgradeContract);
router.get('/contract/history', adminController.getContractUpgradeHistory);

export default router;