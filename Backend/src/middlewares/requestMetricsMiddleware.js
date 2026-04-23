// src/middlewares/requestMetrics.middleware.js
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

/**
 * Middleware to track request lifecycle, response times, and update global counters
 */
const requestMetrics = (req, res, next) => {
  const start = Date.now();
  
  // Track that we received a request
  metrics.incrementRequests();

  // Listen for the 'finish' event on the response to log timing, once Express is done
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    // Track total time for later average calculation
    metrics.recordResponseTime(duration);

    // [METRIC] GET /api/sales 200 45ms
    const message = `[METRIC] ${method} ${originalUrl} ${statusCode} ${duration}ms`;
    
    // Log structured message
    logger.logInfo('request-metrics', message, {
      method,
      url: originalUrl,
      statusCode,
      responseTimeMs: duration,
      traceId: req.traceId // Attached by previous tracer middleware
    });
  });

  next();
};

module.exports = requestMetrics;
