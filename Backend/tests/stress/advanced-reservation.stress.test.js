require('dotenv').config({ path: '../../.env' });
const InventoryService = require('../../src/services/InventoryService');
const SaleOrchestrator = require('../../src/services/SaleOrchestrator');
const { sequelize, Material, InventoryReservation, Product, ProductMaterial, User, Client } = require('../../src/models');
const crypto = require('crypto');

describe('Stress Test: Advanced Reservation Ledger (Idempotency & Expiration)', () => {
    let materialId;
    let userId;
    let clientId;
    let productId;
    const initialStock = 200;

    beforeAll(async () => {
        const user = await User.findOne({ where: { role: 'ADMIN' } });
        userId = user ? user.id : 1;
        const client = await Client.findOne();
        clientId = client ? client.id : 1;

        const material = await Material.create({
            name: `LEDGER-STRESS-${Date.now()}`,
            unit: 'MT',
            cost: 10,
            min_stock: 5,
            current_stock: initialStock,
            reserved_stock: 0
        });
        materialId = material.id;

        const product = await Product.create({
            name: `LEDGER-PROD-${Date.now()}`,
            sku: `L-SKU-${Date.now()}`,
            type: 'SASTRERIA_MEDIDA',
            hours_sewing: 1,
            hours_pattern: 1,
            fixed_supply_tier: 'SENCILLO'
        });
        productId = product.id;

        await ProductMaterial.create({
            product_id: productId,
            material_id: materialId,
            quantity: 1
        });
    });

    it('Should process 100 idempotent reservations cleanly', async () => {
        const operation_id = crypto.randomUUID();
        const promises = [];

        for (let i = 0; i < 100; i++) {
            promises.push(
                sequelize.transaction(async (t) => {
                    const context = { operation_id, expires_at: new Date(Date.now() + 10000) };
                    return await InventoryService.reserveStock(materialId, 5, context, t);
                })
            );
        }

        const results = await Promise.allSettled(promises);
        const succeeded = results.filter(r => r.status === 'fulfilled');

        // Under heavy concurrency, some might reject with UniqueConstraintError, which is fine as long as end state is consistent.
        expect(succeeded.length).toBeGreaterThanOrEqual(1);

        const reservations = await InventoryReservation.findAll({ where: { operation_id } });
        expect(reservations.length).toBe(1); // Only 1 record should be created
        
        const mat = await Material.findByPk(materialId);
        expect(Number(mat.reserved_stock)).toBe(5); // Only 5 reserved, not 500
    });

    it('Should release expired reservations automatically or manually', async () => {
        const operation_id = crypto.randomUUID();
        const context = { operation_id, expires_at: new Date(Date.now() - 10000) }; // Expired 10s ago

        await sequelize.transaction(async (t) => {
            await InventoryService.reserveStock(materialId, 15, context, t);
        });

        // Simulating the background job manually
        const res = await InventoryReservation.findOne({ where: { operation_id } });
        await sequelize.transaction(async (t) => {
            await InventoryService.releaseReservedStock(res.material_id, res.quantity, { operation_id }, t);
        });

        const mat = await Material.findByPk(materialId);
        // It should have released the 15 we just reserved. Total reserved is still 5 from previous test.
        expect(Number(mat.reserved_stock)).toBe(5); 

        const updatedRes = await InventoryReservation.findOne({ where: { operation_id } });
        expect(updatedRes.status).toBe('RELEASED');
    });

    it('Should consume partial stock and implicitly release the rest', async () => {
        const operation_id = crypto.randomUUID();
        const context = { operation_id, expires_at: new Date(Date.now() + 10000) };

        await sequelize.transaction(async (t) => {
            await InventoryService.reserveStock(materialId, 20, context, t);
        });

        // Reserved goes to 25.
        // Consume 10 instead of 20
        await sequelize.transaction(async (t) => {
            await InventoryService.consumeReservedStock(materialId, 20, 10, { operation_id }, t);
        });

        const mat = await Material.findByPk(materialId);
        // Current stock drops by 10 => 190. Reserved drops by 20 => 5.
        expect(Number(mat.current_stock)).toBe(190);
        expect(Number(mat.reserved_stock)).toBe(5);

        const res = await InventoryReservation.findOne({ where: { operation_id } });
        expect(res.status).toBe('CONSUMED');
    });
});
