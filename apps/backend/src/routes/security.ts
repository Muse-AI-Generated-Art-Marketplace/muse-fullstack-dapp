import { Router } from 'express'
import {
  getScanStats,
  getQuarantineList,
  clearQuarantineList,
  scanFileManually,
} from '@/controllers/securityController'
import { authenticate } from '@/middleware/authMiddleware'

const router = Router()

// ── Security Management Routes (Admin Only) ───────────────────────────────────────

// Get malware scan statistics
router.get('/scan-stats', authenticate, getScanStats)

// Get quarantine list
router.get('/quarantine', authenticate, getQuarantineList)

// Clear quarantine list
router.delete('/quarantine', authenticate, clearQuarantineList)

// Manually scan a file (for testing/admin purposes)
router.post('/scan-file', authenticate, scanFileManually)

export default router
