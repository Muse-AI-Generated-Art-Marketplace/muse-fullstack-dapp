import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/middleware/authMiddleware';
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
} from '../apiDashboardController';
import { apiDashboardService } from '@/services/apiDashboardService';

// Mock the service
jest.mock('@/services/apiDashboardService', () => ({
    apiDashboardService: {
        getDashboardSnapshot: jest.fn(),
        getRealTimeMetrics: jest.fn(),
        getUserRateLimitInfo: jest.fn(),
        getSystemHealthMetrics: jest.fn(),
        getPerformanceMetrics: jest.fn(),
        getAlerts: jest.fn(),
        createAlert: jest.fn(),
        updateAlert: jest.fn(),
        deleteAlert: jest.fn(),
        getAlertHistory: jest.fn(),
        acknowledgeAlert: jest.fn(),
        resolveAlert: jest.fn(),
        checkAlerts: jest.fn()
    }
}));

// Mock the logger
jest.mock('@/utils/logger', () => ({
    createLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
}));

// Mock error handler
jest.mock('@/middleware/errorHandler', () => ({
    createError: (message: string, statusCode: number) => {
        const error = new Error(message) as Error & { statusCode: number };
        error.statusCode = statusCode;
        return error;
    }
}));

const mockedService = apiDashboardService as jest.Mocked<typeof apiDashboardService>;

describe('ApiDashboardController', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { address: 'GABC123...', id: 'user123' }
        };

        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('getDashboardSnapshot', () => {
        it('should return dashboard snapshot with default time range', async () => {
            const mockSnapshot = {
                timestamp: new Date(),
                totalRequests: 1000,
                requestsPerSecond: 50,
                averageResponseTime: 150,
                errorRate: 5,
                rateLimitedPercentage: 3,
                activeUsers: 100,
                topEndpoints: [
                    { endpoint: '/api/artworks', count: 500, avgResponseTime: 100 }
                ],
                tierDistribution: { anonymous: 400, verified: 400, premium: 200 },
                statusCodeDistribution: { '200': 800, '400': 30, '500': 20 }
            };

            mockedService.getDashboardSnapshot.mockResolvedValue(mockSnapshot);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalledWith(undefined);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockSnapshot
            });
        });

        it('should return dashboard snapshot for 1h period', async () => {
            mockReq.query = { period: '1h' };

            const mockSnapshot = {
                timestamp: new Date(),
                totalRequests: 500,
                requestsPerSecond: 25,
                averageResponseTime: 100,
                errorRate: 2,
                rateLimitedPercentage: 1,
                activeUsers: 50,
                topEndpoints: [],
                tierDistribution: { anonymous: 200, verified: 200, premium: 100 },
                statusCodeDistribution: { '200': 490 }
            };

            mockedService.getDashboardSnapshot.mockResolvedValue(mockSnapshot);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalledWith(
                expect.objectContaining({
                    start: expect.any(Date),
                    end: expect.any(Date)
                })
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockSnapshot
            });
        });

        it('should handle 6h period', async () => {
            mockReq.query = { period: '6h' };
            mockedService.getDashboardSnapshot.mockResolvedValue({} as any);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalled();
        });

        it('should handle 24h period', async () => {
            mockReq.query = { period: '24h' };
            mockedService.getDashboardSnapshot.mockResolvedValue({} as any);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalled();
        });

        it('should handle 7d period', async () => {
            mockReq.query = { period: '7d' };
            mockedService.getDashboardSnapshot.mockResolvedValue({} as any);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalled();
        });

        it('should handle 30d period', async () => {
            mockReq.query = { period: '30d' };
            mockedService.getDashboardSnapshot.mockResolvedValue({} as any);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalled();
        });

        it('should default to 1h for unknown period', async () => {
            mockReq.query = { period: 'unknown' };
            mockedService.getDashboardSnapshot.mockResolvedValue({} as any);

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getDashboardSnapshot).toHaveBeenCalled();
        });

        it('should call next with error when service fails', async () => {
            mockedService.getDashboardSnapshot.mockRejectedValue(new Error('Service error'));

            await getDashboardSnapshot(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve dashboard metrics'
                })
            );
        });
    });

    describe('getRealTimeMetrics', () => {
        it('should return real-time metrics successfully', async () => {
            const mockMetrics = {
                currentRPS: 100,
                currentLatency: 150,
                activeConnections: 50,
                rateLimitedRequests: 10,
                errorCount: 5,
                healthStatus: 'healthy' as const
            };

            mockedService.getRealTimeMetrics.mockResolvedValue(mockMetrics);

            await getRealTimeMetrics(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getRealTimeMetrics).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
        });

        it('should call next with error when service fails', async () => {
            mockedService.getRealTimeMetrics.mockRejectedValue(new Error('Redis error'));

            await getRealTimeMetrics(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve real-time metrics'
                })
            );
        });
    });

    describe('getUserRateLimits', () => {
        it('should return user rate limits with default pagination', async () => {
            const mockResult = {
                users: [
                    {
                        userAddress: 'GABC123...',
                        userId: 'user1',
                        tier: 'verified',
                        standardUsage: 10,
                        standardLimit: 50,
                        aiUsage: 2,
                        aiLimit: 10,
                        totalRequestsToday: 100,
                        rateLimitedToday: 5,
                        lastRequest: new Date()
                    }
                ],
                total: 100,
                page: 1,
                limit: 50
            };

            mockedService.getUserRateLimitInfo.mockResolvedValue(mockResult);

            await getUserRateLimits(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getUserRateLimitInfo).toHaveBeenCalledWith(1, 50, undefined, undefined);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult
            });
        });

        it('should accept custom pagination parameters', async () => {
            mockReq.query = { page: '2', limit: '25' };

            mockedService.getUserRateLimitInfo.mockResolvedValue({
                users: [],
                total: 0,
                page: 2,
                limit: 25
            });

            await getUserRateLimits(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getUserRateLimitInfo).toHaveBeenCalledWith(2, 25, undefined, undefined);
        });

        it('should filter by tier', async () => {
            mockReq.query = { tier: 'premium' };

            mockedService.getUserRateLimitInfo.mockResolvedValue({
                users: [],
                total: 0,
                page: 1,
                limit: 50
            });

            await getUserRateLimits(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getUserRateLimitInfo).toHaveBeenCalledWith(1, 50, 'premium', undefined);
        });

        it('should support search parameter', async () => {
            mockReq.query = { search: 'GABC' };

            mockedService.getUserRateLimitInfo.mockResolvedValue({
                users: [],
                total: 0,
                page: 1,
                limit: 50
            });

            await getUserRateLimits(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getUserRateLimitInfo).toHaveBeenCalledWith(1, 50, undefined, 'GABC');
        });

        it('should call next with error when service fails', async () => {
            mockedService.getUserRateLimitInfo.mockRejectedValue(new Error('Database error'));

            await getUserRateLimits(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve user rate limits'
                })
            );
        });
    });

    describe('getSystemHealth', () => {
        it('should return system health metrics successfully', async () => {
            const mockHealth = {
                overall: 'healthy' as const,
                components: [
                    { name: 'MongoDB', status: 'healthy' as const, latency: 5, message: 'Connected' },
                    { name: 'Redis', status: 'healthy' as const, latency: 2, message: 'Connected' }
                ],
                uptime: 86400000,
                lastCheck: new Date(),
                metrics: {
                    activeConnections: 50,
                    requestsPerSecond: 100
                }
            };

            mockedService.getSystemHealthMetrics.mockResolvedValue(mockHealth);

            await getSystemHealth(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getSystemHealthMetrics).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockHealth
            });
        });

        it('should call next with error when service fails', async () => {
            mockedService.getSystemHealthMetrics.mockRejectedValue(new Error('Health check failed'));

            await getSystemHealth(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve system health metrics'
                })
            );
        });
    });

    describe('getPerformanceMetrics', () => {
        it('should return performance metrics with default time range', async () => {
            const mockMetrics = {
                trends: [
                    {
                        timestamp: new Date(),
                        requestsPerSecond: 50,
                        averageLatency: 100,
                        errorRate: 2,
                        rateLimitedPercentage: 1
                    }
                ],
                summary: {
                    totalRequests: 1000,
                    averageLatency: 100,
                    p50Latency: 80,
                    p95Latency: 200,
                    p99Latency: 500,
                    errorRate: 2,
                    successRate: 98,
                    rateLimitedPercentage: 1
                },
                topEndpoints: [
                    { endpoint: '/api/artworks', count: 500, avgResponseTime: 100, errorRate: 1 }
                ],
                topUsers: [
                    { userAddress: 'GABC...', tier: 'verified', requests: 100, rateLimited: 2 }
                ]
            };

            mockedService.getPerformanceMetrics.mockResolvedValue(mockMetrics);

            await getPerformanceMetrics(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getPerformanceMetrics).toHaveBeenCalledWith(undefined);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
        });

        it('should handle different time periods', async () => {
            const periods = ['1h', '6h', '24h', '7d'];

            for (const period of periods) {
                mockReq.query = { period };
                mockedService.getPerformanceMetrics.mockResolvedValue({} as any);

                await getPerformanceMetrics(
                    mockReq as AuthRequest,
                    mockRes as Response,
                    mockNext
                );

                expect(mockedService.getPerformanceMetrics).toHaveBeenCalled();
            }
        });

        it('should call next with error when service fails', async () => {
            mockedService.getPerformanceMetrics.mockRejectedValue(new Error('Aggregation failed'));

            await getPerformanceMetrics(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve performance metrics'
                })
            );
        });
    });

    // ============ Alert Management Tests ============

    describe('getAlerts', () => {
        it('should return all alerts', async () => {
            const mockAlerts = [
                {
                    _id: 'alert1',
                    name: 'High Error Rate',
                    type: 'error_rate',
                    enabled: true,
                    conditions: { metric: 'error_rate', operator: 'gt', threshold: 10 }
                },
                {
                    _id: 'alert2',
                    name: 'High Latency',
                    type: 'response_time',
                    enabled: false,
                    conditions: { metric: 'average_latency', operator: 'gt', threshold: 2000 }
                }
            ];

            mockedService.getAlerts.mockResolvedValue(mockAlerts as any);

            await getAlerts(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getAlerts).toHaveBeenCalledWith(undefined);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockAlerts
            });
        });

        it('should filter by enabled status when specified', async () => {
            mockReq.query = { enabled: 'true' };
            mockedService.getAlerts.mockResolvedValue([]);

            await getAlerts(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getAlerts).toHaveBeenCalledWith(true);
        });

        it('should filter by disabled status when specified', async () => {
            mockReq.query = { enabled: 'false' };
            mockedService.getAlerts.mockResolvedValue([]);

            await getAlerts(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getAlerts).toHaveBeenCalledWith(false);
        });

        it('should call next with error when service fails', async () => {
            mockedService.getAlerts.mockRejectedValue(new Error('Database error'));

            await getAlerts(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve alerts'
                })
            );
        });
    });

    describe('createAlert', () => {
        it('should create a new alert successfully', async () => {
            mockReq.body = {
                name: 'New Alert',
                type: 'error_rate',
                enabled: true,
                conditions: {
                    metric: 'error_rate',
                    operator: 'gt',
                    threshold: 10,
                    duration: 5
                },
                actions: { inApp: true },
                cooldownMinutes: 15
            };

            const mockCreatedAlert = {
                _id: 'new-alert-id',
                ...mockReq.body,
                createdBy: 'GABC123...'
            };

            mockedService.createAlert.mockResolvedValue(mockCreatedAlert as any);

            await createAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.createAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Alert',
                    createdBy: 'GABC123...'
                })
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockCreatedAlert
            });
        });

        it('should use system as createdBy when user is not authenticated', async () => {
            mockReq.user = undefined;
            mockReq.body = {
                name: 'System Alert',
                type: 'error_rate',
                enabled: true,
                conditions: { metric: 'error_rate', operator: 'gt', threshold: 10 }
            };

            mockedService.createAlert.mockResolvedValue({ _id: 'alert-id' } as any);

            await createAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.createAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdBy: 'system'
                })
            );
        });

        it('should call next with error when service fails', async () => {
            mockReq.body = { name: 'Test Alert' };
            mockedService.createAlert.mockRejectedValue(new Error('Validation error'));

            await createAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to create alert'
                })
            );
        });
    });

    describe('updateAlert', () => {
        it('should update an existing alert successfully', async () => {
            mockReq.params = { alertId: 'alert1' };
            mockReq.body = { enabled: false };

            const mockUpdatedAlert = {
                _id: 'alert1',
                name: 'Updated Alert',
                enabled: false
            };

            mockedService.updateAlert.mockResolvedValue(mockUpdatedAlert as any);

            await updateAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.updateAlert).toHaveBeenCalledWith('alert1', { enabled: false });
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockUpdatedAlert
            });
        });

        it('should call next with 404 error when alert not found', async () => {
            mockReq.params = { alertId: 'nonexistent' };
            mockReq.body = { enabled: false };

            mockedService.updateAlert.mockResolvedValue(null);

            await updateAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Alert not found',
                    statusCode: 404
                })
            );
        });

        it('should call next with error when service fails', async () => {
            mockReq.params = { alertId: 'alert1' };
            mockReq.body = { enabled: false };

            mockedService.updateAlert.mockRejectedValue(new Error('Database error'));

            await updateAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to update alert'
                })
            );
        });
    });

    describe('deleteAlert', () => {
        it('should delete an alert successfully', async () => {
            mockReq.params = { alertId: 'alert1' };
            mockedService.deleteAlert.mockResolvedValue(true);

            await deleteAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.deleteAlert).toHaveBeenCalledWith('alert1');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Alert deleted successfully'
            });
        });

        it('should call next with 404 error when alert not found', async () => {
            mockReq.params = { alertId: 'nonexistent' };
            mockedService.deleteAlert.mockResolvedValue(false);

            await deleteAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Alert not found',
                    statusCode: 404
                })
            );
        });

        it('should call next with error when service fails', async () => {
            mockReq.params = { alertId: 'alert1' };
            mockedService.deleteAlert.mockRejectedValue(new Error('Database error'));

            await deleteAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to delete alert'
                })
            );
        });
    });

    describe('getAlertHistory', () => {
        it('should return alert history with default pagination', async () => {
            const mockHistory = {
                alerts: [
                    {
                        _id: 'history1',
                        alertConfigId: 'alert1',
                        alertName: 'High Error Rate',
                        triggeredAt: new Date(),
                        status: 'triggered',
                        metricValue: 15,
                        threshold: 10
                    }
                ],
                total: 50,
                page: 1,
                limit: 50
            };

            mockedService.getAlertHistory.mockResolvedValue(mockHistory as any);

            await getAlertHistory(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getAlertHistory).toHaveBeenCalledWith(1, 50, undefined);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockHistory
            });
        });

        it('should accept custom pagination and status filter', async () => {
            mockReq.query = { page: '2', limit: '25', status: 'acknowledged' };

            mockedService.getAlertHistory.mockResolvedValue({
                alerts: [],
                total: 0,
                page: 2,
                limit: 25
            } as any);

            await getAlertHistory(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.getAlertHistory).toHaveBeenCalledWith(2, 25, 'acknowledged');
        });

        it('should call next with error when service fails', async () => {
            mockedService.getAlertHistory.mockRejectedValue(new Error('Database error'));

            await getAlertHistory(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to retrieve alert history'
                })
            );
        });
    });

    describe('acknowledgeAlert', () => {
        it('should acknowledge an alert successfully', async () => {
            mockReq.params = { alertHistoryId: 'history1' };
            mockReq.body = { notes: 'Investigating the issue' };

            const mockAcknowledgedAlert = {
                _id: 'history1',
                status: 'acknowledged',
                acknowledgedBy: 'GABC123...',
                notes: 'Investigating the issue'
            };

            mockedService.acknowledgeAlert.mockResolvedValue(mockAcknowledgedAlert as any);

            await acknowledgeAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.acknowledgeAlert).toHaveBeenCalledWith(
                'history1',
                'GABC123...',
                'Investigating the issue'
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockAcknowledgedAlert
            });
        });

        it('should use unknown when user is not authenticated', async () => {
            mockReq.user = undefined;
            mockReq.params = { alertHistoryId: 'history1' };
            mockReq.body = {};

            mockedService.acknowledgeAlert.mockResolvedValue({ _id: 'history1' } as any);

            await acknowledgeAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.acknowledgeAlert).toHaveBeenCalledWith(
                'history1',
                'unknown',
                undefined
            );
        });

        it('should call next with 404 error when alert not found', async () => {
            mockReq.params = { alertHistoryId: 'nonexistent' };
            mockReq.body = {};

            mockedService.acknowledgeAlert.mockResolvedValue(null);

            await acknowledgeAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Alert not found',
                    statusCode: 404
                })
            );
        });

        it('should call next with error when service fails', async () => {
            mockReq.params = { alertHistoryId: 'history1' };
            mockReq.body = {};

            mockedService.acknowledgeAlert.mockRejectedValue(new Error('Database error'));

            await acknowledgeAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to acknowledge alert'
                })
            );
        });
    });

    describe('resolveAlert', () => {
        it('should resolve an alert successfully', async () => {
            mockReq.params = { alertHistoryId: 'history1' };
            mockReq.body = { notes: 'Issue has been fixed' };

            const mockResolvedAlert = {
                _id: 'history1',
                status: 'resolved',
                resolvedAt: new Date(),
                notes: 'Issue has been fixed'
            };

            mockedService.resolveAlert.mockResolvedValue(mockResolvedAlert as any);

            await resolveAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.resolveAlert).toHaveBeenCalledWith('history1', 'Issue has been fixed');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockResolvedAlert
            });
        });

        it('should call next with 404 error when alert not found', async () => {
            mockReq.params = { alertHistoryId: 'nonexistent' };
            mockReq.body = {};

            mockedService.resolveAlert.mockResolvedValue(null);

            await resolveAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Alert not found',
                    statusCode: 404
                })
            );
        });

        it('should call next with error when service fails', async () => {
            mockReq.params = { alertHistoryId: 'history1' };
            mockReq.body = {};

            mockedService.resolveAlert.mockRejectedValue(new Error('Database error'));

            await resolveAlert(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to resolve alert'
                })
            );
        });
    });

    describe('triggerAlertCheck', () => {
        it('should trigger alert check successfully', async () => {
            mockedService.checkAlerts.mockResolvedValue();

            await triggerAlertCheck(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockedService.checkAlerts).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Alert check completed'
            });
        });

        it('should call next with error when service fails', async () => {
            mockedService.checkAlerts.mockRejectedValue(new Error('Alert check failed'));

            await triggerAlertCheck(
                mockReq as AuthRequest,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Failed to trigger alert check'
                })
            );
        });
    });
});
