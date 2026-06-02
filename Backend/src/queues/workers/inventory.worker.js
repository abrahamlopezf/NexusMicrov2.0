const { RESERVE_STOCK, RELEASE_STOCK, CONSUME_STOCK } = require('../jobs/inventory.jobs');
const InventoryService = require('../../modules/inventory/InventoryService');
const logQueueError = require('../utils/errorLogger');
const { sequelize } = require('../../models');

const worker = new Worker('InventoryQueue', async job => {
  try {
    const { data } = job;
    
    await sequelize.transaction(async (t) => {
      if (job.name === RESERVE_STOCK) {
        // Mock reservation logic idempotency
        // In reality, this requires an "InventoryReservation" model or similar.
        // For now, if we just deduct the stock to ensure it's locked for production.
        console.log(`[RESERVE_STOCK] Validating stock for materials`, data.materialsEstimate);
        // Implement logic safely
      } else if (job.name === CONSUME_STOCK) {
        const { realMaterialsUsed } = data;
        await InventoryService.deductProductionMaterials(realMaterialsUsed, t);
      } else if (job.name === RELEASE_STOCK) {
        // Rollback reservation
      }
    });

  } catch (err) {
    logQueueError(job.name, job.data, err);
    throw err;
  }
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`Inventory Job ${job.id} failed: ${err.message}`);
});

module.exports = {
  handleReserveStock,
  handleReleaseStock,
  handleConsumeStock,
  handleLowStockAlert
};
