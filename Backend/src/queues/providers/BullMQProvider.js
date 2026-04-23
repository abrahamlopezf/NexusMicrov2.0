/**
 * BullMQ Provider — Implements QueueProvider using Redis + BullMQ
 * Portable: to replace with SQS, implement the same interface in SQSProvider.js
 */
const { Queue } = require('bullmq');
const QueueProvider = require('./QueueProvider');
const { getConnection } = require('../connection');
const logger = require('../../utils/logger');

// Standard job options — applied to every enqueued job
const DEFAULT_JOB_OPTIONS = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: 2000 // ms — doubles each retry: 2s, 4s, 8s, 16s, 32s
    },
    removeOnComplete: true,
    removeOnFail: false // Keep failed jobs for dead-letter inspection
};

const QUEUE_NAMES = ['sale', 'inventory', 'production', 'payment'];

class BullMQProvider extends QueueProvider {
    constructor() {
        super();
        this._queues = {};
        this._workers = [];
    }

    _getQueue(queueName) {
        if (!this._queues[queueName]) {
            this._queues[queueName] = new Queue(queueName, {
                connection: getConnection(),
                defaultJobOptions: DEFAULT_JOB_OPTIONS
            });
        }
        return this._queues[queueName];
    }

    async addJob(queueName, jobType, payload, opts = {}) {
        const queue = this._getQueue(queueName);
        const jobOpts = { ...DEFAULT_JOB_OPTIONS, ...opts };
        const job = await queue.add(jobType, payload, jobOpts);
        logger.info(`📬 Enqueued [${queueName}:${jobType}] jobId=${job.id}`);
        return { jobId: job.id, mode: 'async' };
    }

    async startWorkers() {
        // Lazily required to avoid circular dependency at module load time
        const { startAllWorkers } = require('../workers/index');
        this._workers = await startAllWorkers();
        logger.info(`🚀 BullMQ workers started (${this._workers.length} workers active)`);
    }

    async shutdown() {
        logger.info('🛑 Shutting down BullMQ workers...');
        for (const worker of this._workers) {
            await worker.close();
        }
        for (const [name, queue] of Object.entries(this._queues)) {
            await queue.close();
            logger.info(`Queue [${name}] closed`);
        }
    }
}

module.exports = BullMQProvider;
