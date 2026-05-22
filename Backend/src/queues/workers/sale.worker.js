const { Worker } = require('bullmq');
const { connection } = require('../queue');
const { SALE_CONFIRMED, SALE_CANCELLED } = require('../jobs/sale.jobs');
const { Sale, SaleItem, WorkOrder } = require('../../models');
const SaleService = require('../../modules/sales/SaleService');
const QueueService = require('../../services/QueueService');
const logQueueError = require('../utils/errorLogger');

const worker = new Worker('SaleQueue', async job => {
  try {
    const { type, data } = job;
    
    if (job.name === SALE_CONFIRMED) {
      const { saleId, userId } = data;

      // Idempotency check: Do not create duplicate WorkOrders
      const existingWO = await WorkOrder.findOne({ where: { sale_id: saleId } });
      if (existingWO) {
        console.log(`[SALE_CONFIRMED] WorkOrder already exists for Sale ${saleId}. Skipping creation.`);
        return;
      }

      const sale = await Sale.findByPk(saleId, { include: ['items'] });
      if (!sale) throw new Error(`Sale ${saleId} not found`);

      // We simulate creating a transaction for DB safety (if SaleService expects it or handle it inside)
      // Usually background jobs can open their own transactions
      await SaleService.spawnWorkOrders(sale.id, sale.items, userId || sale.created_by, null);

      // Trigger inventory reservation asynchronously via queue
      for (const item of sale.items) {
        if (item.materials_estimate && item.materials_estimate.length > 0) {
          await QueueService.addInventoryJob('RESERVE_STOCK', {
            saleItemId: item.id,
            materialsEstimate: item.materials_estimate
          });
        }
      }

      // Update state
      sale.fulfillment_status = 'IN_PROGRESS';
      await sale.save();
    } else if (job.name === SALE_CANCELLED) {
      // Implement cancellation logic asynchronously if needed
    }
  } catch (err) {
    logQueueError(job.name, job.data, err);
    throw err; // Trigger bullmq retry mechanism
  }
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = worker;
