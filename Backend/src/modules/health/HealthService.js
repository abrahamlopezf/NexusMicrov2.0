const os = require('os');
const db = require('../../models');

/**
 * Service to collect comprehensive system health metrics
 */
const getSystemMetrics = async () => {
    let databaseStatus = 'down';
    try {
        await db.sequelize.authenticate();
        databaseStatus = 'connected';
    } catch (error) {
        databaseStatus = 'down';
    }

    const mem = process.memoryUsage();

    return {
        apiStatus: 'running',
        databaseStatus,
        uptime: process.uptime(),
        memoryUsage: {
            rss: mem.rss,
            heapTotal: mem.heapTotal,
            heapUsed: mem.heapUsed,
            external: mem.external
        },
        cpuLoad: os.loadavg()[0],
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    getSystemMetrics
};
