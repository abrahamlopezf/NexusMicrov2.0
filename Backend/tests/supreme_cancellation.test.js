const { sequelize, Sale, Client, Product, Material, ProductMaterial, Account, Employee } = require('../src/models');
const SaleOrchestrator = require('../src/services/SaleOrchestrator');
const CancellationService = require('../src/services/CancellationService');
const ProductionService = require('../src/services/ProductionService');

describe('🔥 TEST SUPREMO: El Infierno Real del ERP', () => {
    let globalTransaction;
    let mockClient, mockAccount, mockMaterial, mockProduct, mockEmployee;
    
    beforeAll(async () => {
        // Ejecutamos TODO el test dentro de un Transaction Wrapper global sin hacer commit jamás
        // para no contaminar la AWS RDS de Producción con basura.
        globalTransaction = await sequelize.transaction();

        mockClient = await Client.create({ name: 'Supreme Client Corp' }, { transaction: globalTransaction });
        mockAccount = await Account.create({ name: 'Vault', type: 'BANK', balance: 0 }, { transaction: globalTransaction });
        mockMaterial = await Material.create({ name: 'Vibranium', code: 'V-01', current_stock: 1000, min_stock: 100 }, { transaction: globalTransaction });
        mockProduct = await Product.create({ name: 'Vibranium Shield', price: 10000, is_custom: false }, { transaction: globalTransaction });
        await ProductMaterial.create({ product_id: mockProduct.id, material_id: mockMaterial.id, quantity: 50 }, { transaction: globalTransaction });
        mockEmployee = await Employee.create({ name: 'Tony Stark', base_salary: 5000 }, { transaction: globalTransaction });
    });

    afterAll(async () => {
        // Destruimos la memoria del test. Producción sigue inmaculada.
        await globalTransaction.rollback();
        await sequelize.close();
    });

    it('Valida Venta $10,000, Anticipo 30%, Producción Parcial y Reversa Absoluta', async () => {
        const t = globalTransaction;
        const userId = 1;

        // 1. Venta $10,000 + Anticipo 30%
        const saleData = { sale_number: 'SUP-999', client_id: mockClient.id };
        const itemsData = [{ product_id: mockProduct.id, quantity: 1, unit_price: 10000 }];
        const paymentData = { account_id: mockAccount.id, amount: 3000, payment_method: 'TRANSFERENCIA' };

        // Simulamos la llamada del controller hacia el Orchestrator, anidando la transacción del test
        const sale = await SaleOrchestrator.createSale(saleData, itemsData, paymentData, userId);
        
        // --- VERIFICACIÓN 1: ESTADOS INICIALES ---
        expect(parseFloat(sale.total)).toBe(10000);
        expect(parseFloat(sale.balance)).toBe(7000);
        expect(sale.financial_status).toBe('PARTIAL');
        expect(sale.fulfillment_status).toBe('PENDING');

        // --- VERIFICACIÓN 2: INVENTARIO DESCONTADO ---
        await mockMaterial.reload({ transaction: t });
        expect(parseFloat(mockMaterial.current_stock)).toBe(950); // 1000 - 50

        // 3. Producción Parcial (1 tarea de la orden)
        const workOrder = await sale.getWork_order({ transaction: t });
        const tasks = await workOrder.getTasks({ transaction: t });
        const task1 = tasks[0];
        task1.employee_id = mockEmployee.id;
        await task1.save({ transaction: t });
        
        // Completamos solo UNA tarea
        await ProductionService.completeTask(task1.id, userId, t);
        
        // --- VERIFICACIÓN 3: NÓMINA PRE-CANCELADA ---
        const payrollAdvances = await task1.getPayrollAdvances({ transaction: t });
        expect(payrollAdvances.length).toBe(1);

        // 4. EL INFIERNO: CANCELACIÓN ADMINISTRATIVA GLOBAL
        const cancelledSale = await CancellationService.cancelSale(sale.id, userId);

        // --- VERIFICACIÓN 4: ESTADOS DE REVERSA ---
        expect(cancelledSale.financial_status).toBe('REFUNDED');
        expect(cancelledSale.fulfillment_status).toBe('CANCELLED');
        expect(parseFloat(cancelledSale.balance)).toBe(0);

        // --- VERIFICACIÓN 5: PAGOS REVERSADOS ---
        const payments = await cancelledSale.getPayments({ transaction: t });
        const refund = payments.find(p => p.type === 'REFUND');
        expect(parseFloat(refund.amount)).toBe(-3000); // 30% Devuelto intacto en negativo

        // --- VERIFICACIÓN 6: INVENTARIO DEPURADO ---
        await mockMaterial.reload({ transaction: t });
        expect(parseFloat(mockMaterial.current_stock)).toBe(1000); // Regresó de 950 a 1000 exacto
    });
});
