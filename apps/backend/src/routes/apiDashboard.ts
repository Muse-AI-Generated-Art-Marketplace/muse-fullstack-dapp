import { Router } from 'express';
import { authenticate } from '@/middleware/authMiddleware';
import { isAdmin } from '@/middleware/adminAuth';
import {
    getDashboardSnapshot,
    getRealTimeMetrics,
    getUserRateLimits,
    getSystemHealth,
    getPerformanceMetrics,
    getAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    getAlertHistory,
    acknowledgeAlert,
    resolveAlert,
    triggerAlertCheck
} from '@/controllers/apiDashboardController';
import { validate } from '@/middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const periodQuerySchema = z.object({
    period: z.enum(['1h', '6h', '24h', '7d', '30d']).optional()
});

const paginationQuerySchema = z.object({
    page: z.string().optional().transform(v => parseInt(v || '1')),
    limit: z.string().optional().transform(v => parseInt(v || '50')),
    tier: z.enum(['anonymous', 'verified', 'premium', 'all']).optional(),
    search: z.string().optional()
});

const alertConfigSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['rate_limit', 'response_time', 'error_rate', 'throughput', 'custom']),
    enabled: z.boolean().optional().default(true),
    conditions: z.object({
        metric: z.enum(['error_rate', 'rate_limited_percentage', 'average_latency', 'requests_per_second']),
        operator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq']),
        threshold: z.number(),
        duration: z.number().min(1).max(1440).optional().default(5) // 1 min to 24 hours
    }),
    actions: z.object({
        email: z.boolean().optional().default(false),
        webhook: z.string().url().optional(),
        slack: z.string().url().optional(),
        inApp: z.boolean().optional().default(true)
    }).optional(),
    cooldownMinutes: z.number().min(1).max(1440).optional().default(15)
});

const alertUpdateSchema = alertConfigSchema.partial();

const alertActionSchema = z.object({
    notes: z.string().max(500).optional()
});

/**
 * @openapi
 * /api/dashboard/snapshot:
 *   get:
 *     summary: Get dashboard metrics snapshot
 *     description: Returns aggregated API metrics for the specified time period
 *     tags: [API Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: Dashboard metrics returned successfully
 */
router.get('/snapshot', authenticate, isAdmin, getDashboardSnapshot);

/**
 * @openapi
 * /api/dashboard/realtime:
 *   get:
 *     summary: Get real-time metrics
 *     description: Returns live API metrics from Redis
 *     tags: [API Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time metrics returned successfully
 */
router.get('/realtime', authenticate, isAdmin, getRealTimeMetrics);

/**
 * @openapi
 * /api/dashboard/users/rate-limits:
 *   get:
 *     summary: Get user rate limit information
 *     description: Returns rate limit status for all users with pagination
 *     tags: [API Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [anonymous, verified, premium, all]
 *         description: Filter by tier
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or address
 *     responses:
 *       200:
 *         description: User rate limits returned successfully
 */
router.get('/users/rate-limits', authenticate, isAdmin, getUserRateLimits);

/**
 * @openapi
 * /api/dashboard/health:
 *   get:
 *     summary: Get system health metrics
 *     description: Returns comprehensive health status for all system components
 *     tags: [API Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health metrics returned successfully
 */
router.get('/health', authenticate, isAdmin, getSystemHealth);

/**
 * @openapi
 * /api/dashboard/performance:
 *   get:
 *     summary: Get performance metrics
 *     description: Returns detailed performance metrics including trends
 *     tags: [API Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d]
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: Performance metrics returned successfully
 */
router.get('/performance', authenticate, isAdmin, getPerformanceMetrics);

// ============ Alert Management Routes ============

/**
 * @openapi
 * /api/dashboard/alerts:
 *   get:
 *     summary: Get all alert configurations
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *     responses:
 *       200:
 *         description: Alerts returned successfully
 */
router.get('/alerts', authenticate, isAdmin, getAlerts);

/**
 * @openapi
 * /api/dashboard/alerts:
 *   post:
 *     summary: Create a new alert configuration
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - conditions
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [rate_limit, response_time, error_rate, throughput, custom]
 *               enabled:
 *                 type: boolean
 *               conditions:
 *                 type: object
 *               actions:
 *                 type: object
 *               cooldownMinutes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Alert created successfully
 */
router.post('/alerts', authenticate, isAdmin, validate(alertConfigSchema), createAlert);

/**
 * @openapi
 * /api/dashboard/alerts/{alertId}:
 *   put:
 *     summary: Update an alert configuration
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alert updated successfully
 */
router.put('/alerts/:alertId', authenticate, isAdmin, validate(alertUpdateSchema), updateAlert);

/**
 * @openapi
 * /api/dashboard/alerts/{alertId}:
 *   delete:
 *     summary: Delete an alert configuration
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deleted successfully
 */
router.delete('/alerts/:alertId', authenticate, isAdmin, deleteAlert);

/**
 * @openapi
 * /api/dashboard/alerts/history:
 *   get:
 *     summary: Get alert history
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [triggered, acknowledged, resolved]
 *     responses:
 *       200:
 *         description: Alert history returned successfully
 */
router.get('/alerts/history', authenticate, isAdmin, getAlertHistory);

/**
 * @openapi
 * /api/dashboard/alerts/history/{alertHistoryId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertHistoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 */
router.post(
    '/alerts/history/:alertHistoryId/acknowledge',
    authenticate,
    isAdmin,
    validate(alertActionSchema),
    acknowledgeAlert
);

/**
 * @openapi
 * /api/dashboard/alerts/history/{alertHistoryId}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertHistoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 */
router.post(
    '/alerts/history/:alertHistoryId/resolve',
    authenticate,
    isAdmin,
    validate(alertActionSchema),
    resolveAlert
);

/**
 * @openapi
 * /api/dashboard/alerts/check:
 *   post:
 *     summary: Manually trigger alert check
 *     tags: [API Dashboard - Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert check completed
 */
router.post('/alerts/check', authenticate, isAdmin, triggerAlertCheck);

export default router;
