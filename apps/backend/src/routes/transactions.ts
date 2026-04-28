import express from 'express'
import { transactionController } from '@/controllers/transactionController'
import {
  createTransactionSchema,
  processTransactionSchema,
  transactionIdParamSchema,
  transactionQuerySchema,
  updateTransactionStatusSchema
} from '@/schemas/transactionSchemas'
import { validate } from '@/middleware/validate'

const router = express.Router()

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: List transactions
 *     description: Retrieve a list of transactions with optional filters
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - in: query
 *         name: buyer
 *         schema:
 *           type: string
 *         description: Filter by buyer address
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Filter by seller address
 *     responses:
 *       200:
 *         description: Transactions list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 */
router.get('/', validate(transactionQuerySchema), transactionController.listTransactions)

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     summary: Create new transaction
 *     description: Initiate a new Stellar blockchain transaction for artwork purchase
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               artworkId:
 *                 type: string
 *                 description: ID of the artwork to purchase
 *               buyer:
 *                 type: string
 *                 description: Buyer's Stellar wallet address
 *               amount:
 *                 type: number
 *                 description: Transaction amount in XLM
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid transaction data
 *       404:
 *         description: Artwork not found
 */
router.post('/', validate(createTransactionSchema), transactionController.createTransaction)

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve transaction details by transaction ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', validate(transactionIdParamSchema), transactionController.getTransaction)

/**
 * @openapi
 * /api/transactions/{id}/status:
 *   get:
 *     summary: Get transaction status
 *     description: Check the current status of a transaction on Stellar blockchain
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed, cancelled]
 *                 stellarTransactionHash:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/:id/status', validate(transactionIdParamSchema), transactionController.getTransactionStatus)

/**
 * @openapi
 * /api/transactions/{id}/process:
 *   post:
 *     summary: Process transaction
 *     description: Submit the transaction to Stellar blockchain for processing
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedTransaction:
 *                 type: string
 *                 description: Base64 encoded signed Stellar transaction XDR
 *     responses:
 *       200:
 *         description: Transaction processed successfully
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid signed transaction
 *       404:
 *         description: Transaction not found
 */
router.post('/:id/process', validate(processTransactionSchema), transactionController.processTransaction)

/**
 * @openapi
 * /api/transactions/{id}/status:
 *   patch:
 *     summary: Update transaction status
 *     description: Update the status of a transaction (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 */
router.patch('/:id/status', validate(updateTransactionStatusSchema), transactionController.updateTransactionStatus)

export default router
