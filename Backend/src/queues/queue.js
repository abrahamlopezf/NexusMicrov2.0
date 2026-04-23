const { Queue } = require('bullmq');
const config = require('../config/env');
const Redis = require('ioredis');

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  tls: config.redis.tls,
  maxRetriesPerRequest: null, // Required by bullmq
  lazyConnect: true // Prevent immediate connection spam if Redis is down
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
