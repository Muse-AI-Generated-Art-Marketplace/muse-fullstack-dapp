import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/middleware/authMiddleware';
import { apiDashboardService } from '@/services/apiDashboardService';
import { createError } from '@/middleware/errorHandler';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ApiDashboardController');

/**
 * Get dashboard metrics snapshot
 */
export const getDashboardSnapshot = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { period } = req.query;

        let timeRange;
        if (period) {
            const now = new Date();
            switch (period) {
                case '1h':
                    timeRange = { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
                    break;
                case '6h':
                    timeRange = { start: new Date(now.getTime() - 6 * 60 * 60 * 1000), end: now };
                    break;
                case '24h':
                    timeRange = { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
                    break;
                case '7d':
                    timeRange = { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
                    break;
                case '30d':
                    timeRange = { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
                    break;
                default:
                    timeRange = { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
            }
        }

        const snapshot = await apiDashboardService.getDashboardSnapshot(timeRange);

        res.json({
            success: true,
            data: snapshot
        });

        logger.debug('Dashboard snapshot retrieved', { period });
    } catch (error) {
        logger.error('Failed to get dashboard snapshot:', error);
        next(createError('Failed to retrieve dashboard metrics', 500));
    }
};

/**
 * Get real-time metrics
 */
export const getRealTimeMetrics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const metrics = await apiDashboardService.getRealTimeMetrics();

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Failed to get real-time metrics:', error);
        next(createError('Failed to retrieve real-time metrics', 500));
    }
};

/**
 * Get user rate limit information
 */
export const getUserRateLimits = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page = 1, limit = 50, tier, search } = req.query;

        const result = await apiDashboardService.getUserRateLimitInfo(
            parseInt(page as string),
            parseInt(limit as string),
            tier as string,
            search as string
        );

        res.json({
            success: true,
            data: result
        });

        logger.debug('User rate limits retrieved', {
            page,
            limit,
            tier,
            search,
            totalUsers: result.total
        });
    } catch (error) {
        logger.error('Failed to get user rate limits:', error);
        next(createError('Failed to retrieve user rate limits', 500));
    }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const health = await apiDashboardService.getSystemHealthMetrics();

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Failed to get system health:', error);
        next(createError('Failed to retrieve system health metrics', 500));
    }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { period } = req.query;

        let timeRange;
        if (period) {
            const now = new Date();
            switch (period) {
                case '1h':
                    timeRange = { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
                    break;
                case '6h':
                    timeRange = { start: new Date(now.getTime() - 6 * 60 * 60 * 1000), end: now };
                    break;
                case '24h':
                    timeRange = { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
                    break;
                case '7d':
                    timeRange = { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
                    break;
                default:
                    timeRange = { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
            }
        }

        const metrics = await apiDashboardService.getPerformanceMetrics(timeRange);

        res.json({
            success: true,
            data: metrics
        });

        logger.debug('Performance metrics retrieved', { period });
    } catch (error) {
        logger.error('Failed to get performance metrics:', error);
        next(createError('Failed to retrieve performance metrics', 500));
    }
};

// ============ Alert Management ============

/**
 * Get all alert configurations
 */
export const getAlerts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { enabled } = req.query;

        const alerts = await apiDashboardService.getAlerts(
            enabled !== undefined ? enabled === 'true' : undefined
        );

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        logger.error('Failed to get alerts:', error);
        next(createError('Failed to retrieve alerts', 500));
    }
};

/**
 * Create a new alert configuration
 */
export const createAlert = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alertData = {
            ...req.body,
            createdBy: req.user?.address || 'system'
        };

        const alert = await apiDashboardService.createAlert(alertData);

        res.status(201).json({
            success: true,
            data: alert
        });

        logger.info('Alert created', { alertId: alert._id, name: alert.name });
    } catch (error) {
        logger.error('Failed to create alert:', error);
        next(createError('Failed to create alert', 500));
    }
};

/**
 * Update an alert configuration
 */
export const updateAlert = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { alertId } = req.params;
        const updates = req.body;

        const alert = await apiDashboardService.updateAlert(alertId, updates);

        if (!alert) {
            next(createError('Alert not found', 404));
            return;
        }

        res.json({
            success: true,
            data: alert
        });

        logger.info('Alert updated', { alertId, name: alert.name });
    } catch (error) {
        logger.error('Failed to update alert:', error);
        next(createError('Failed to update alert', 500));
    }
};

/**
 * Delete an alert configuration
 */
export const deleteAlert = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { alertId } = req.params;

        const deleted = await apiDashboardService.deleteAlert(alertId);

        if (!deleted) {
            next(createError('Alert not found', 404));
            return;
        }

        res.json({
            success: true,
            message: 'Alert deleted successfully'
        });

        logger.info('Alert deleted', { alertId });
    } catch (error) {
        logger.error('Failed to delete alert:', error);
        next(createError('Failed to delete alert', 500));
    }
};

/**
 * Get alert history
 */
export const getAlertHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page = 1, limit = 50, status } = req.query;

        const result = await apiDashboardService.getAlertHistory(
            parseInt(page as string),
            parseInt(limit as string),
            status as string
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Failed to get alert history:', error);
        next(createError('Failed to retrieve alert history', 500));
    }
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { alertHistoryId } = req.params;
        const { notes } = req.body;

        const alert = await apiDashboardService.acknowledgeAlert(
            alertHistoryId,
            req.user?.address || 'unknown',
            notes
        );

        if (!alert) {
            next(createError('Alert not found', 404));
            return;
        }

        res.json({
            success: true,
            data: alert
        });

        logger.info('Alert acknowledged', { alertHistoryId, acknowledgedBy: req.user?.address });
    } catch (error) {
        logger.error('Failed to acknowledge alert:', error);
        next(createError('Failed to acknowledge alert', 500));
    }
};

/**
 * Resolve an alert
 */
export const resolveAlert = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { alertHistoryId } = req.params;
        const { notes } = req.body;

        const alert = await apiDashboardService.resolveAlert(alertHistoryId, notes);

        if (!alert) {
            next(createError('Alert not found', 404));
            return;
        }

        res.json({
            success: true,
            data: alert
        });

        logger.info('Alert resolved', { alertHistoryId });
    } catch (error) {
        logger.error('Failed to resolve alert:', error);
        next(createError('Failed to resolve alert', 500));
    }
};

/**
 * Manually trigger alert check
 */
export const triggerAlertCheck = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await apiDashboardService.checkAlerts();

        res.json({
            success: true,
            message: 'Alert check completed'
        });

        logger.info('Manual alert check triggered', { triggeredBy: req.user?.address });
    } catch (error) {
        logger.error('Failed to trigger alert check:', error);
        next(createError('Failed to trigger alert check', 500));
    }
};
