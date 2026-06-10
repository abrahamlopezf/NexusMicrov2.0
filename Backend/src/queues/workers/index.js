const { attachFailureHandler } = require('../failureHandler');
const logger = require('../../utils/logger');

// Require the worker modules to start them
const saleWorker       = require('./sale.worker');
const inventoryWorker  = require('./inventory.worker');
const productionWorker = require('./production.worker');
const paymentWorker    = require('./payment.worker');

async function startAllWorkers() {
    const workers = [saleWorker, inventoryWorker, productionWorker, paymentWorker];

    // Attach failure handlers for dead-letter logging
    for (const worker of workers) {
        if (worker && typeof worker.on === 'function') {
            attachFailureHandler(worker);
        }
    }

    logger.info(`🏭 ${workers.length} BullMQ workers started`);
    return workers;
}

module.exports = { startAllWorkers };
