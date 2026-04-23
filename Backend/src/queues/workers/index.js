/**
 * Worker Registry — BullMQ Worker instances
 *
 * Each Worker is a BullMQ consumer that pulls jobs from a named queue in Redis.
 * Handlers are imported from their respective worker modules (shared with SyncProvider).
 *
 * NEVER crash on individual job failure — workers catch all errors and let
 * BullMQ handle retries + dead-letter storage.
 */
const { Worker } = require('bullmq');
const { getConnection } = require('../connection');
const { attachFailureHandler } = require('../failureHandler');
const logger = require('../../utils/logger');

// Handler modules
const saleHandlers       = require('./sale.worker');
const inventoryHandlers  = require('./inventory.worker');
const productionHandlers = require('./production.worker');
const paymentHandlers    = require('./payment.worker');

const WORKER_CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '5', 10);

/**
 * Wraps a handler to enforce safe execution.
 * BullMQ will receive the thrown error and trigger its retry logic.
 */
function safeProcessor(handlerFn, label) {
    return async (job) => {
        logger.info(`▶ [${label}] Processing job ${job.id} type=${job.name}`);
        try {
            await handlerFn(job.data);
            logger.info(`✅ [${label}] Completed job ${job.id}`);
        } catch (err) {
            logger.error(`❌ [${label}] Failed job ${job.id}: ${err.message}`, {
                jobType:   job.name,
                jobId:     job.id,
                payload:   job.data,
                attempt:   job.attemptsMade,
                stack:     err.stack
            });
            throw err; // Re-throw so BullMQ handles retry/dead-letter
        }
    };
}

/**
 * Maps job type (job.name) to its handler function for a given queue.
 */
function makeProcessor(handlerMap) {
    return async (job) => {
        const handler = handlerMap[job.name];
        if (!handler) {
            logger.error(`[worker] No handler for job type: ${job.name}`, { jobId: job.id, data: job.data });
            throw new Error(`Unknown job type: ${job.name}`);
        }
        await safeProcessor(handler, `${job.queueName}:${job.name}`)(job);
    };
}

/**
 * Starts all BullMQ workers and returns them for lifecycle management.
 * @returns {Worker[]}
 */
async function startAllWorkers() {
    const connection = getConnection();
    const opts = { connection, concurrency: WORKER_CONCURRENCY };

    const saleWorker = new Worker('sale', makeProcessor({
        SALE_CONFIRMED: async (data) => saleHandlers.handleSaleConfirmed(data),
        SALE_CANCELLED: async (data) => saleHandlers.handleSaleCancelled(data)
    }), opts);

    const inventoryWorker = new Worker('inventory', makeProcessor({
        RESERVE_STOCK: async (data) => inventoryHandlers.handleReserveStock(data),
        RELEASE_STOCK: async (data) => inventoryHandlers.handleReleaseStock(data),
        CONSUME_STOCK: async (data) => inventoryHandlers.handleConsumeStock(data)
    }), opts);

    const productionWorker = new Worker('production', makeProcessor({
        CREATE_WORK_ORDER: async (data) => productionHandlers.handleCreateWorkOrder(data),
        COMPLETE_TASK:     async (data) => productionHandlers.handleCompleteTask(data)
    }), opts);

    const paymentWorker = new Worker('payment', makeProcessor({
        REGISTER_PAYMENT: async (data) => paymentHandlers.handleRegisterPayment(data),
        PROCESS_REFUND:   async (data) => paymentHandlers.handleProcessRefund(data)
    }), opts);

    const workers = [saleWorker, inventoryWorker, productionWorker, paymentWorker];

    // Attach failure handlers for dead-letter logging
    for (const worker of workers) {
        attachFailureHandler(worker);
    }

    logger.info(`🏭 ${workers.length} BullMQ workers started (concurrency=${WORKER_CONCURRENCY})`);
    return workers;
}

module.exports = { startAllWorkers };
