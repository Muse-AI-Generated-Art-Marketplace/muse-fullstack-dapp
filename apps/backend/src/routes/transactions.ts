import express from 'express'
import { transactionController } from '@/controllers/transactionController'
import { exportController } from '@/controllers/exportController'
import {
  createTransactionSchema,
  processTransactionSchema,
  transactionIdParamSchema,
  transactionQuerySchema,
  updateTransactionStatusSchema
} from '@/schemas/transactionSchemas'
import { validate } from '@/middleware/validate'
import { authenticate } from '@/middleware/authMiddleware'

const router = express.Router()

router.get('/export', authenticate, exportController.exportTransactions)
router.get('/', validate(transactionQuerySchema), transactionController.listTransactions)
router.post('/', validate(createTransactionSchema), transactionController.createTransaction)
router.get('/:id', validate(transactionIdParamSchema), transactionController.getTransaction)
router.get('/:id/status', validate(transactionIdParamSchema), transactionController.getTransactionStatus)
router.post('/:id/process', validate(processTransactionSchema), transactionController.processTransaction)
router.patch('/:id/status', validate(updateTransactionStatusSchema), transactionController.updateTransactionStatus)

export default router
