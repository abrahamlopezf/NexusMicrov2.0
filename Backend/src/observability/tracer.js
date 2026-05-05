// src/observability/tracer.js
const { v4: uuidv4 } = require('uuid');

/**
 * Generates and injects a unique trace ID into the request cycle.
 * Uses the highly compatible uuid package to avoid crypto.randomUUID issues.
 */
const tracerMiddleware = (req, res, next) => {
  try {
    // Generate a unique ID for this request
    const traceId = `req-${uuidv4()}`;
    
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
  } catch (e) {
    // Fallback if UUID generation fails
    req.traceId = `req-${Date.now()}`;
  }
  next();
};

module.exports = tracerMiddleware;
