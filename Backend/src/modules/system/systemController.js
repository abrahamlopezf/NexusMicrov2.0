const metrics = require('../../observability/metrics');

/**
 * Controller to handle system observability requests
 */
const getMetrics = async (req, res, next) => {
    try {
        const stats = metrics.getMetrics();
        
        if (res.success) {
            return res.success(stats, 'Metrics retrieved successfully');
        }

        return res.status(200).json({
            success: true,
            message: 'Metrics retrieved successfully',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMetrics
};
