require('dotenv').config({ path: '../../.env' });
const { SaleService } = require('../../src/services');
const { sequelize, User, Client, Product, GlobalSetting } = require('../../src/models');

describe('Stress Test: Phase 1 & 7 - Ventas Concurrentes y Performance', () => {
    let transaction;
    let userId;
    let clientId;
    let productId;

    beforeAll(async () => {
        // Dummy setup for tests; ideally these come from fixtures
        const user = await User.findOne({ where: { role: 'ADMIN' } });
        userId = user ? user.id : 1;
        const client = await Client.findOne();
        clientId = client ? client.id : 1;
        const product = await Product.findOne();
        productId = product ? product.id : 1;
    });

    it('Should process 50 concurrent sales in < 5 seconds without errors', async () => {
        const salesPromises = [];
        const TOTAL_VENTAS = 50;

        for (let i = 0; i < TOTAL_VENTAS; i++) {
            const saleData = {
                sale_number: `STRESS-SALE-${Date.now()}-${i}`,
                client_id: clientId,
                type: 'NORMAL',
                is_urgent: false,
                notes: `Venta de estrés concurrente ${i}`
            };

            const itemsData = [
                {
                    product_id: productId,
                    quantity: Math.floor(Math.random() * 5) + 1,
                    custom_description: null,
                    extra_materials: []
                }
            ];

            // Inyectamos a Promise.all un unit of work atómico
            salesPromises.push(
                sequelize.transaction(async (t) => {
                    return await SaleService.createDraft(saleData, itemsData, userId, t);
                })
            );
        }

        const start = Date.now();
        const results = await Promise.allSettled(salesPromises);
        const duration = Date.now() - start;

        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`[Sales Concurrency] 50 Sales processed in ${duration}ms. Success: ${succeeded.length}, Failed: ${failed.length}`);
        
        expect(duration).toBeLessThan(5000); // FASE 7: Rendimiento < 5 segundos
        expect(failed.length).toBe(0); // FASE 1: Se crean sin error
        expect(succeeded.length).toBe(TOTAL_VENTAS);
        
        // FASE 8: Integridad - Totales y Cost Breakdown están llenos
        if(succeeded.length > 0) {
            const { sale, createdItems } = succeeded[0].value;
            expect(sale.total).toBeGreaterThan(0);
            expect(createdItems[0].cost_breakdown).toBeDefined();
        }
    });
});
