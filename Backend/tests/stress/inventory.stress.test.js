require('dotenv').config({ path: '../../.env' });
const { ProductionService, InventoryService } = require('../../src/services');
const { sequelize, Material, ProductionTask, WorkOrder } = require('../../src/models');

describe('Stress Test: Phase 3 - Inventario (Crítico)', () => {
    let materialId;
    let workOrderId;
    let userId = 1;
    let initialStock = 100; // Un material popular con stock fijo

    beforeAll(async () => {
        // Setup base material para agotar
        const material = await Material.create({
            name: `M-STRESS-${Date.now()}`,
            internal_code: `C-${Date.now()}`,
            unit_of_measure: 'MT',
            cost: 50,
            minimum_stock: 10,
            current_stock: initialStock,
            reorder_point: 20
        });
        materialId = material.id;

        const wo = await WorkOrder.create({
            sale_id: 1, // dummy
            status: 'PENDING',
            created_by: userId
        });
        workOrderId = wo.id;
    });

    it('Should process 30 ProductionTasks completing at identical times without corrupting stock', async () => {
        const tasks = [];
        const taskPromises = [];
        const simultaneousTasks = 30;
        const consumePerTask = 5; 
        
        // El consumo total intentado será 30 * 5 = 150. Pero inicial es 100!
        // Entonces 20 deben ser SUCCESS y 10 deben tirar AppError para que no baje a negativo.

        // Pre-crear las tareas en DB
        for (let i = 0; i < simultaneousTasks; i++) {
            const tsk = await ProductionTask.create({
                work_order_id: workOrderId,
                product_id: 1, 
                employee_id: 1, // asumiendo existe un ID 1
                task_name: `Stress Task ${i}`,
                quantity: 1,
                status: 'PENDING',
                real_materials_used: [{ material_id: materialId, quantity: consumePerTask }]
            });
            tasks.push(tsk.id);
        }

        // Simular terminación paralela (todas compiten leyendo STOCK simultaneamente en el ProductionService)
        for (const taskId of tasks) {
            taskPromises.push(
                ProductionService.completeTask(taskId, userId, null) // Invocará transacción aislada internamente
            );
        }

        const results = await Promise.allSettled(taskPromises);
        
        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        const mat = await Material.findByPk(materialId);

        console.log(`[Inventory Concurrency] Tasks Success: ${succeeded.length}, Tasks Failed: ${failed.length}, Final Stock: ${mat.current_stock}`);
        
        expect(Number(mat.current_stock)).toBeGreaterThanOrEqual(0);
        // Validar que en RDS y lógica de locks de Sequelize, nunca pase de 0
    });
});
