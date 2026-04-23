const { saleQueue, inventoryQueue, productionQueue, paymentQueue } = require('../queues/queue');
const logger = require('../utils/logger');
const { FeatureFlag } = require('../models');

class QueueService {
  static async init() {
    logger.info('⚙️ Queue Service Initialized (Hybrid mode ready)');
  }

  static async isAsyncEnabled() {
      try {
          const flag = await FeatureFlag.findByPk('ENABLE_ASYNC_QUEUE');
          return flag ? flag.is_enabled : true;
      } catch (e) {
          return true;
      }
  }

  static async safeAdd(queueInstance, type, payload) {
      try {
          const useAsync = await this.isAsyncEnabled();
          if (!useAsync) throw new Error('ASYNC QUEUE DISABLED');
          
          return await queueInstance.add(type, payload);
      } catch (err) {
          logger.warn(`Redis or Queue Failed/Disabled. Running synchronously as fallback for ${type}: ${err.message}`);
          
          // Hybrid Fallback (Synchronous processing)
          try {
              // We simulate the job structure
              const mockJob = { id: 'SYNC-' + Date.now(), data: payload };
              // We dynamically call the worker logic depending on type
              // This is a simplified wrapper for the synchronous execution.
              const processor = require(`../queues/workers/${queueInstance.name}.worker.js`);
              if (typeof processor === 'function') {
                  await processor(mockJob);
              } else if (processor.processJob) {
                  await processor.processJob(mockJob);
              }
              return mockJob;
          } catch (syncErr) {
              logger.error(`Synchronous fallback failed for ${type}: ${syncErr.message}`);
              throw syncErr;
          }
      }
  }

  static async addSaleJob(type, payload) {
    return await this.safeAdd(saleQueue, type, payload);
  }

  static async addInventoryJob(type, payload) {
    return await this.safeAdd(inventoryQueue, type, payload);
  }

  static async addProductionJob(type, payload) {
    return await this.safeAdd(productionQueue, type, payload);
  }

  static async addPaymentJob(type, payload) {
    return await this.safeAdd(paymentQueue, type, payload);
  }
}

module.exports = QueueService;
