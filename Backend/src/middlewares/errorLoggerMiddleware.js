// src/middlewares/errorLogger.middleware.js
const { trackError } = require('../observability/errorTracker');

/**
 * Intercepts errors and logs their full stack, route, traceId context
 * before handing off to the final error handler for serialization.
 */
const errorLogger = (err, req, res, next) => {
  
  // Use Tracker to standard log format and increment metrics counter
  trackError(err, req);
  
  // Important! Do not block the flow here, pass to standard errorHandler to return the HTTP response
  next(err);
};

module.exports = errorLogger;
