const { Worker } = require('bullmq');
const { connection } = require('../queue');
const { REGISTER_PAYMENT, PROCESS_REFUND } = require('../jobs/payment.jobs');
const logQueueError = require('../utils/errorLogger');
// const PaymentService = require('../../services/PaymentService');

const worker = new Worker('PaymentQueue', async job => {
  try {
    const { data } = job;
    
    if (job.name === REGISTER_PAYMENT) {
      // payment registration logic
      // e.g. await PaymentService.registerPayment(data.payload)
    } else if (job.name === PROCESS_REFUND) {
      // refund logic
    }
  } catch (err) {
    logQueueError(job.name, job.data, err);
    throw err;
  }
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`Payment Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;
