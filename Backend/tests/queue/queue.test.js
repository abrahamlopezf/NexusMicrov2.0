require('dotenv').config({ path: '../../.env' });
const { saleQueue, inventoryQueue, productionQueue, paymentQueue, connection } = require('../../src/queues/queue');
const QueueService = require('../../src/services/QueueService');
const { SALE_CONFIRMED } = require('../../src/queues/jobs/sale.jobs');
const { Sale, WorkOrder, User } = require('../../src/models');
const { Worker } = require('bullmq');

// Start workers so jobs are processed locally in test
require('../../src/queues/workers/sale.worker');
require('../../src/queues/workers/inventory.worker');

describe('Queue System Stress & Idempotency Test', () => {
    let saleId;
    let userId;

    beforeAll(async () => {
        // Prepare dummy sale in DB for the test
        const user = await User.findOne({ where: { role: 'ADMIN' } });
        userId = user ? user.id : 1;
        
        const sale = await Sale.create({
            sale_number: `Q-TEST-${Date.now()}`,
            client_id: 1, // Assume client 1 exists
            total: 100,
            paid_amount: 0,
            balance: 100,
            status: 'PENDING',
            fulfillment_status: 'QUEUED',
            created_by: userId
        });
        saleId = sale.id;

        // Drain queues before starting
        await saleQueue.obliterate({ force: true }).catch(() => {});
    });

    afterAll(async () => {
        await connection.quit();
    });

    it('Should enqueue 20 concurrent SALE_CONFIRMED jobs but only create ONE WorkOrder (Idempotency)', async () => {
        const jobs = [];
        for (let i = 0; i < 20; i++) {
            jobs.push(QueueService.addSaleJob(SALE_CONFIRMED, {
                saleId,
                userId
            }));
        }

        await Promise.all(jobs);

        // Wait for workers to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Assert idempotency
        const workOrders = await WorkOrder.findAll({ where: { sale_id: saleId } });
        
        console.log(`[Queue Test] Expected 1 WorkOrder for 20 Jobs. Actual: ${workOrders.length}`);
        
        expect(workOrders.length).toBe(1);

        // Check if sale status updated
        const sale = await Sale.findByPk(saleId);
        expect(sale.fulfillment_status).toBe('IN_PROGRESS');
    }, 10000);
});
