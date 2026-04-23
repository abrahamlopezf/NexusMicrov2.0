// src/observability/tracer.js
/**
 * Generates and injects a unique trace ID into the request cycle
 * Allows tracking a single request across all logs and services.
 */
const crypto = require('crypto');

const tracerMiddleware = (req, res, next) => {
  // Generate a unique ID for this request
  const traceId = `req-${crypto.randomUUID()}`;
  
  // Attach it to the request object so downstream controllers/loggers can access it
  req.traceId = traceId;

  // It's also a good practice to include it in the response headers
  res.setHeader('X-Trace-Id', traceId);

  next();
};

module.exports = tracerMiddleware;
