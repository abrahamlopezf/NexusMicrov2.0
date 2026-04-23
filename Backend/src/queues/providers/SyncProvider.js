/**
 * SyncProvider — Implements QueueProvider as synchronous in-process execution.
 *
 * Used when:
 *   - QUEUE_MODE = 'off'
 *   - QUEUE_MODE = 'hybrid' and Redis is unavailable (fallback with WARN log)
 *
 * Executes job handlers directly in the calling request context.
 * This provider makes migration to strict/async mode zero-refactor:
 * just switch QUEUE_MODE and the same job types + payloads are processed by BullMQ.
 */
const QueueProvider = require('./QueueProvider');
const logger = require('../../utils/logger');

class SyncProvider extends QueueProvider {
    constructor(executionMode = 'sync') {
        super();
        // 'sync' | 'sync_fallback' — used in response metadata
        this._executionMode = executionMode;
        this._handlers = {};
    }

    /**
     * Register a handler for a (queueName, jobType) pair.
     * @param {string} queueName
     * @param {string} jobType
     * @param {Function} handler - async fn(payload) => void
     */
    registerHandler(queueName, jobType, handler) {
        const key = `${queueName}:${jobType}`;
        this._handlers[key] = handler;
    }

    async addJob(queueName, jobType, payload, opts = {}) {  // eslint-disable-line no-unused-vars
        const key = `${queueName}:${jobType}`;
        const handler = this._handlers[key];

        if (!handler) {
            logger.warn(`⚠️  SyncProvider: no handler registered for [${key}]. Job dropped.`, { payload });
            return { jobId: null, mode: this._executionMode };
        }

        logger.info(`⚙️  SyncProvider executing [${key}] in-process (mode=${this._executionMode})`);
        try {
            await handler(payload);
        } catch (err) {
            logger.error(`❌ SyncProvider error in [${key}]: ${err.message}`, { payload, stack: err.stack });
            throw err;
        }

        return { jobId: null, mode: this._executionMode };
    }

    async startWorkers() {
        // No workers needed — execution is in-process
        logger.info(`⚙️  SyncProvider active (mode=${this._executionMode}) — no background workers`);
    }

    async shutdown() {
        // Nothing to shut down
    }
}

module.exports = SyncProvider;
