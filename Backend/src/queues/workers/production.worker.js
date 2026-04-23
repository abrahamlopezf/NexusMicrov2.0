const { Worker } = require('bullmq');
const { connection } = require('../queue');
const { CREATE_WORK_ORDER, COMPLETE_TASK } = require('../jobs/production.jobs');
const ProductionService = require('../../services/ProductionService');
const QueueService = require('../../services/QueueService');
const logQueueError = require('../utils/errorLogger');

const worker = new Worker('ProductionQueue', async job => {
  try {
    const { data } = job;
    
    if (job.name === COMPLETE_TASK) {
      const { taskId, userId } = data;
      // Complete task idempotently handled inside ProductionService or we check here
      const task = await ProductionService.completeTask(taskId, userId);
      
      // We could enqueue CONSUME_STOCK instead of direct execution if preferred
      if (task.real_materials_used) {
        await QueueService.addInventoryJob('CONSUME_STOCK', {
          realMaterialsUsed: task.real_materials_used
        });
      }
    } else if (job.name === CREATE_WORK_ORDER) {
      // Implement
    }
  } catch (err) {
    // If task is already completed, the service throws "Task already completed", we shouldn't retry it infinitely.
    if (err.message === 'Task already completed') return;
    
    logQueueError(job.name, job.data, err);
    throw err;
  }
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`Production Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;
