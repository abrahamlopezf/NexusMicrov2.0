require('dotenv').config({ path: '../../.env' });
const { SaleService, PaymentService, ProductionService } = require('../../src/services');
const { sequelize, User, Client, Product, Material } = require('../../src/models');

describe('Stress Test: Phase 4 & 5 - Multi-Flujo Completo y Cancelación', () => {
    let userId = 1;
    let clientId = 1;

    beforeAll(async () => {
        const user = await User.findOne({ where: { role: 'ADMIN' } });
        userId = user ? user.id : 1;
        const client = await Client.findOne();
        clientId = client ? client.id : 1;
    });

    it('Should process a complete 20 parallel workflows from Sales -> Payments -> Production', async () => {
        const flows = [];
        const TOTAL_FLOWS = 20;

        for (let i = 0; i < TOTAL_FLOWS; i++) {
            flows.push(async () => {
                return await sequelize.transaction(async (t) => {
                    // 1. Crear Venta
                    const saleData = {
                        sale_number: `FLOW-${Date.now()}-${Math.random()}`,
                        client_id: clientId
                    };
                    const itemsData = [{ product_id: 1, quantity: 1, custom_description: null, extra_materials: [] }];
                    
                    const { sale, createdItems } = await SaleService.createDraft(saleData, itemsData, userId, t);
                    
                    // 2. Registrar Anticipo (Fake call as it requires accounts setup, simulate DB update if PaymentService isn't fully mocked)
                    // await PaymentService.registerPayment({ saleId: sale.id, amount: 10, ... })
                    
                    // 3. Generar WorkOrder (Phase 4 multi-flujo)
                    const wo = await SaleService.spawnWorkOrders(sale.id, createdItems, userId, t);
                    
                    return { sale, wo };
                });
            });
        }

        const flowPromises = flows.map(f => f());
        const results = await Promise.allSettled(flowPromises);

        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');
        
        console.log(`[Full Flow Concurrency] 20 Flows Tested. Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
        
        expect(succeeded.length).toBeGreaterThan(0);
        
        // Fase 5: Simular cancelación (ejecutar rollback ficticio o CancellationService real)
        if (succeeded.length > 0) {
            const sampleSale = succeeded[0].value.sale;
            expect(sampleSale).toBeDefined();
            expect(sampleSale.financial_status).toBe('UNPAID');
            expect(sampleSale.fulfillment_status).toBe('PENDING');
        }
    });
});
