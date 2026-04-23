require('dotenv').config({ path: '../../.env' });
const { SaleOrchestrator } = require('../../src/services');
const { sequelize, User, Client, Product, Material, ProductMaterial } = require('../../src/models');

describe('Stress Test: Inventory Reservation (Concurrent Sales)', () => {
    let userId;
    let clientId;
    let productId;
    let materialId;
    let initialStock = 50; // We have enough for 50 units

    beforeAll(async () => {
        const user = await User.findOne({ where: { role: 'ADMIN' } });
        userId = user ? user.id : 1;
        const client = await Client.findOne();
        clientId = client ? client.id : 1;
        
        // Create a specific material and product for this test
        const material = await Material.create({
            name: `RES-STRESS-${Date.now()}`,
            internal_code: `RES-C-${Date.now()}`,
            unit_of_measure: 'MT',
            cost: 10,
            minimum_stock: 5,
            current_stock: initialStock,
            reserved_stock: 0,
            reorder_point: 10
        });
        materialId = material.id;

        const product = await Product.create({
            name: `RES-PRODUCT-${Date.now()}`,
            sku: `RES-SKU-${Date.now()}`,
            type: 'SASTRERIA_MEDIDA',
            hours_sewing: 1,
            hours_pattern: 1,
            fixed_supply_tier: 'SENCILLO'
        });
        productId = product.id;

        await ProductMaterial.create({
            product_id: productId,
            material_id: materialId,
            quantity: 1 // 1 unit of material per 1 unit of product
        });
    });

    it('Should process 100 concurrent sales but only 50 should succeed due to stock limit', async () => {
        const salesPromises = [];
        const TOTAL_VENTAS = 100; // We request 100, but only 50 in stock!

        for (let i = 0; i < TOTAL_VENTAS; i++) {
            const saleData = {
                sale_number: `RES-SALE-${Date.now()}-${i}`,
                client_id: clientId,
                type: 'NORMAL',
                is_urgent: false,
                notes: `Venta de reserva concurrente ${i}`
            };

            const itemsData = [
                {
                    product_id: productId,
                    quantity: 1,
                    custom_description: null,
                    extra_materials: []
                }
            ];

            // SaleOrchestrator already wraps in transaction
            salesPromises.push(
                SaleOrchestrator.createSale(saleData, itemsData, null, userId)
            );
        }

        const results = await Promise.allSettled(salesPromises);

        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`[Reservation Concurrency] Total: ${TOTAL_VENTAS}. Success: ${succeeded.length}, Failed: ${failed.length}`);
        
        // At most 50 can succeed because we only have 50 stock and each requires 1
        expect(succeeded.length).toBeLessThanOrEqual(50);
        expect(failed.length).toBeGreaterThanOrEqual(50);
        
        // Verify final stock
        const mat = await Material.findByPk(materialId);
        expect(Number(mat.current_stock)).toBe(initialStock); // Current stock shouldn't change
        expect(Number(mat.reserved_stock)).toBe(succeeded.length); // Reserved stock equals succeeded * 1
        expect(Number(mat.available_stock)).toBe(initialStock - succeeded.length);
    });
});
