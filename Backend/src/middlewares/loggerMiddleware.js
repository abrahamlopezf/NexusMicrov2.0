/**
 * Custom application logger.
 * For production, integrating Winston or Pino is recommended.
 */
const logger = {
    info: (message, meta = {}) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta && Object.keys(meta).length ? meta : '');
    },
    error: (message, error = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error.message || error);
    },
    warn: (message, meta = {}) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta && Object.keys(meta).length ? meta : '');
    }
};

module.exports = logger;
