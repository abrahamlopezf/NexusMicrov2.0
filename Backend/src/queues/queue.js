const { Queue } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();

const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null // Required by bullmq
});

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000
  },
  removeOnComplete: true,
  removeOnFail: false
};

const saleQueue = new Queue('SaleQueue', { connection, defaultJobOptions });
const inventoryQueue = new Queue('InventoryQueue', { connection, defaultJobOptions });
const productionQueue = new Queue('ProductionQueue', { connection, defaultJobOptions });
const paymentQueue = new Queue('PaymentQueue', { connection, defaultJobOptions });

module.exports = {
  connection,
  saleQueue,
  inventoryQueue,
  productionQueue,
  paymentQueue
};
