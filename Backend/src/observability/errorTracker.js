// src/observability/errorTracker.js
/**
 * Helper utility to standardize error parsing before logging
 */
const logger = require('./logger');
const metrics = require('./metrics');

const trackError = (error, reqContext = {}) => {
  // Always increment our metric counter when a tracked error occurs
  metrics.incrementErrors();

  const errorMetadata = {
    stack: error.stack,
    route: reqContext.originalUrl || reqContext.url || 'unknown-route',
    method: reqContext.method || 'unknown-method',
    traceId: reqContext.traceId || 'no-trace-id'
  };

  logger.logError('error-tracker', error.message || 'Unknown Error', errorMetadata);
};

module.exports = {
  trackError
};
