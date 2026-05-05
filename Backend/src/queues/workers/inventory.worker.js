const { Worker } = require('bullmq');
const { connection } = require('../queue');
const { RESERVE_STOCK, RELEASE_STOCK, CONSUME_STOCK } = require('../jobs/inventory.jobs');
const InventoryService = require('../../services/InventoryService');
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
      } else if (job.name === 'LOW_STOCK_ALERT') {
        const { StockAlert } = require('../../models');
        const logger = require('../../utils/logger');
        
        logger.warn({
            event: 'LOW_STOCK_ALERT',
            correlationId: data.correlationId || 'N/A',
            materialId: data.materialId,
            current_stock: data.current_stock,
            min_stock: data.min_stock
        });

        if (StockAlert) {
          try {
            const [alert, created] = await StockAlert.findOrCreate({
                where: { material_id: data.materialId, resolved: false },
                defaults: {
                    message: `Material ${data.materialName} has reached low stock. Current: ${data.current_stock}, Min: ${data.min_stock}`,
                    level: 'LOW',
                    current_stock: data.current_stock,
                    min_stock: data.min_stock,
                    correlation_id: data.correlationId || null,
                    processed: false
                },
                transaction: t
            });

            if (!alert.processed) {
                alert.processed = true;
                alert.processed_at = new Date();
                await alert.save({ transaction: t });
                logger.info(`[LOW_STOCK_ALERT] Successfully processed commit marker for material ${data.materialId}`);
            }
          } catch (alertError) {
            if (alertError.name === 'SequelizeUniqueConstraintError') {
              logger.info(`[LOW_STOCK_ALERT] Unresolved alert already exists for material ${data.materialId}. Skipping duplicate.`);
            } else {
              throw alertError;
            }
          }
        }
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

module.exports = worker;
