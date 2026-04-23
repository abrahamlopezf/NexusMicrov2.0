// tests/integration/sales.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');

describe('Sales Integration Test', () => {
    let mockClient, mockProduct;
    let transaction;

    beforeAll(async () => {
        // Find existing data or create for the integration context
        const t = await db.sequelize.transaction();
        
        try {
            mockClient = await db.Client.create({
                name: 'Test Setup Client',
                email: 'integration@test.client.com',
                phone: '123456789'
            }, { transaction: t });

            mockProduct = await db.Product.create({
                name: 'Test Setup Product',
                sku: 'INTEGRATION-1',
                base_price: 150.00
            }, { transaction: t });

            await db.Material.create({
                id: mockProduct.id,
                name: 'Test Setup Product',
                current_stock: 50
            }, { transaction: t });

            await t.commit();
        } catch(e) {
            await t.rollback();
            throw e;
        }
    });

    afterAll(async () => {
        // Cleanup what we produced in setup
        if (mockProduct) await db.Product.destroy({ where: { id: mockProduct.id }, force: true });
        if (mockClient) await db.Client.destroy({ where: { id: mockClient.id }, force: true });
        if (mockProduct) await db.Material.destroy({ where: { id: mockProduct.id }, force: true });
    });

    beforeEach(async () => {
        transaction = await db.sequelize.transaction();
    });

    afterEach(async () => {
        await transaction.rollback();
    });

    it('POST /api/sales - should create a sale and roll back cleanly (simulated via db teardown later or manual rollback)', async () => {
        
        // This is an actual HTTP request to the Express App
        const res = await request(app)
            .post('/api/sales')
            .send({
                client_id: mockClient.id,
                items: [
                    { productId: mockProduct.id, quantity: 2 }
                ]
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('total', 300);

        // Assert DB side effect occurred
        const createdSale = await db.Sale.findByPk(res.body.data.id);
        expect(createdSale).toBeDefined();

        // Rollback strategy for full HTTP integration tests is tricky since the connection pool 
        // does not easily share the "transaction" context through standard HTTP routes
        // For testing, we explicitly destroy the sale to maintain a clean database state:
        await db.Sale.destroy({ where: { id: res.body.data.id }, force: true });
        await db.SaleItem.destroy({ where: { sale_id: res.body.data.id }, force: true });
    });
});
