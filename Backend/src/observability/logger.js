// src/observability/logger.js
const winston = require('winston');

// Create a structured logger
const structuredLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Output pure JSON for structured logging
  ),
  transports: [
    new winston.transports.Console()
  ],
});

/**
 * Standardizes log formatting
 */
const formatLogArgs = (service, message, metadata = {}) => {
  return {
    service: service || 'unknown-service',
    message,
    ...metadata
  };
};

module.exports = {
  logInfo: (service, message, metadata = {}) => {
    structuredLogger.info(formatLogArgs(service, message, metadata));
  },
  logWarn: (service, message, metadata = {}) => {
    structuredLogger.warn(formatLogArgs(service, message, metadata));
  },
  logError: (service, message, metadata = {}) => {
    structuredLogger.error(formatLogArgs(service, message, metadata));
  },
  logDebug: (service, message, metadata = {}) => {
    structuredLogger.debug(formatLogArgs(service, message, metadata));
  }
};
