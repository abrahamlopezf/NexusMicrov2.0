const config = require("./config/env");
const app = require("./app");
const db = require("./models");
const logger = require("./utils/logger");
const { initConnection } = require('./queues/connection');
const QueueService = require('./services/QueueService');

// UNCAUGHT EXCEPTIONS
process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION 💥 Shutting down...");
    logger.error(`${err.name}: ${err.message}`);
    process.exit(1);
});

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info("✅ Database connected");

        if (config.nodeEnv === "development") {
            await db.sequelize.sync();
            logger.info("📦 Database synced");
        }

        // Initialize Redis connection and queue system
        await initConnection();
        await QueueService.init();

        const port = config.port || 3000;
        const server = app.listen(port, () => {
            logger.info(`🚀 Server running on port ${port} in ${config.nodeEnv} mode`);
            
            // Start background jobs
            const { startExpirationJob } = require('./jobs/inventoryJobs');
            startExpirationJob();
            logger.info('🕒 Inventory expiration job started');
        });

        process.on("unhandledRejection", (err) => {
            logger.error("UNHANDLED REJECTION 💥 Shutting down...");
            logger.error(`${err.name}: ${err.message}`);
            server.close(async () => {
                await QueueService.shutdown();
                process.exit(1);
            });
        });

    } catch (error) {
        logger.error("❌ Unable to connect to database:");
        logger.error(error);
        process.exit(1);
    }
};

startServer();
