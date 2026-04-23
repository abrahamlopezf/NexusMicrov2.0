/**
 * Abstract QueueProvider Interface
 *
 * Defines the contract that ALL queue providers must implement.
 * This decouples the business layer from any specific queue technology.
 * To migrate to SQS: implement this interface in SQSProvider.js.
 */
class QueueProvider {
    /**
     * @param {string} queueName - Logical queue name
     * @param {string} jobType   - Job type constant
     * @param {object} payload   - Job data
     * @param {object} [opts]    - Override job options
     * @returns {Promise<{ jobId: string, mode: 'async'|'sync_fallback'|'sync' }>}
     */
    async addJob(queueName, jobType, payload, opts = {}) {  // eslint-disable-line no-unused-vars
        throw new Error('QueueProvider.addJob() must be implemented by subclass');
    }

    /**
     * Called once at process startup to start workers.
     */
    async startWorkers() {
        throw new Error('QueueProvider.startWorkers() must be implemented by subclass');
    }

    /**
     * Called at process shutdown.
     */
    async shutdown() {
        throw new Error('QueueProvider.shutdown() must be implemented by subclass');
    }
}

module.exports = QueueProvider;
