// src/observability/metrics.js
/**
 * In-memory metrics store for the application
 * Tracks requests, errors, and response times
 */

let totalRequests = 0;
let errorCount = 0;
let totalResponseTimeMs = 0;
const startTime = Date.now();

module.exports = {
  /**
   * Increment the total request counter
   */
  incrementRequests: () => {
    totalRequests++;
  },

  /**
   * Increment the error counter
   */
  incrementErrors: () => {
    errorCount++;
  },

  /**
   * Add a response time to the running average calculation
   * @param {number} timeMs 
   */
  recordResponseTime: (timeMs) => {
    totalResponseTimeMs += timeMs;
  },

  /**
   * Returns current metric snapshot
   */
  getMetrics: () => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const avgResponseTime = totalRequests > 0 
      ? Math.round(totalResponseTimeMs / totalRequests) 
      : 0;

    return {
      requests: totalRequests,
      errors: errorCount,
      avgResponseTime,
      uptime: uptimeSeconds
    };
  }
};
