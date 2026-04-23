const db = require('../../models');
const logger = require('../../observability/logger');

/**
 * Job Queue System
 * Provides methods to enqueue jobs asynchronously to the database table.
 */
class JobQueue {
    /**
     * Enqueues a new job into the database queue.
     * @param {string} type - The job type from the registry (e.g. GENERATE_INVOICE)
     * @param {Object} payload - The JSON payload required for the processor
     * @returns {Promise<Object>} The created Job record
     */
    static async enqueue(type, payload = {}) {
        try {
             const job = await db.Job.create({
                 type,
                 payload,
                 status: 'PENDING'
             });
             
             logger.logInfo('job-queue', `Enqueued job: ${type}`, { jobId: job.id });
             return job;
        } catch (error) {
             logger.logError('job-queue', `Failed to enqueue job: ${type}`, { error: error.message, stack: error.stack });
             throw error;
        }
    }
}

module.exports = JobQueue;
