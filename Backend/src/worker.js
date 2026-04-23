const db = require('./models');
const worker = require('./jobs/workers/job.worker');
const logger = require('./observability/logger');

/**
 * Standalone Worker Process Entry Point
 * This file is intended to be run as a separate Node process from the main API server.
 */
const startWorkerProcess = async () => {
    try {
        await db.sequelize.authenticate();
        logger.logInfo('worker-init', '✅ Database connected for standalone Worker Process');
        
        // Start polling the job queue
        worker.start();
    } catch (error) {
        logger.logError('worker-init', '❌ Failed to connect to database in Worker Process', { error: error.message });
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    logger.logInfo('worker-init', 'Shutting down worker process gracefully...');
    worker.stop();
    process.exit(0);
});

startWorkerProcess();
