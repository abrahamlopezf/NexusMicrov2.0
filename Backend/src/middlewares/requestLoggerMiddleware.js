const logger = require('./loggerMiddleware');

/**
 * Middleware to log incoming HTTP requests.
 * Records Method, URL, IP, and response time.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    // Wait until response completes to calculate elapsed time
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${ip}]`;
        
        if (statusCode >= 500) {
            logger.error(message);
        } else if (statusCode >= 400) {
            logger.warn(message);
        } else {
            logger.info(message);
        }
    });

    next();
};

module.exports = requestLogger;
