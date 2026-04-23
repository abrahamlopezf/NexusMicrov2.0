const healthService = require('../services/HealthService');

/**
 * Controller to handle system health check requests
 */
const getSystemHealth = async (req, res, next) => {
    try {
        const metrics = await healthService.getSystemMetrics();

        const data = {
            api: metrics.apiStatus,
            database: metrics.databaseStatus,
            uptime: metrics.uptime,
            memory: metrics.memoryUsage,
            cpu: metrics.cpuLoad,
            environment: metrics.environment,
            timestamp: metrics.timestamp
        };

        if (metrics.databaseStatus === 'down') {
            return res.status(503).json({
                success: false,
                message: 'Service Unavailable - Database Down',
                data: data
            });
        }

        if (res.success) {
            return res.success(data, 'System is healthy');
        }

        return res.status(200).json({
            success: true,
            message: 'System is healthy',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSystemHealth
};
