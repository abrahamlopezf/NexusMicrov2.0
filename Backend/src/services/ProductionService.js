const { ProductionTask, WorkOrder, Product, Material, sequelize } = require('../models');
const InventoryService = require('./InventoryService');
const AppError = require('../utils/AppError');

class ProductionService {
    static async startProduction(workOrderId, userId) {
        return await sequelize.transaction(async (t) => {
            const workOrder = await WorkOrder.findByPk(workOrderId, {
                include: [{ model: ProductionTask, as: 'tasks' }],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!workOrder) throw new AppError('Orden de producción no encontrada', 404);
            if (workOrder.status !== 'PENDING') throw new AppError('La orden ya ha sido iniciada o finalizada', 400);

            workOrder.status = 'IN_PROGRESS';
            workOrder.start_date = new Date();
            workOrder.updated_by = userId;
            await workOrder.save({ transaction: t });

            // Update all tasks to IN_PROGRESS if they are PENDING
            for (const task of (workOrder.tasks || [])) {
                if (task.status === 'PENDING') {
                    task.status = 'IN_PROGRESS';
                    task.started_at = new Date();
                    task.updated_by = userId;
                    await task.save({ transaction: t });
                }
            }

            return workOrder;
        });
    }

    static async completeProduction(workOrderId, userId) {
        return await sequelize.transaction(async (t) => {
            const workOrder = await WorkOrder.findByPk(workOrderId, {
                include: [{ model: ProductionTask, as: 'tasks', include: [{ model: Product, as: 'product' }] }],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!workOrder) throw new AppError('Orden de producción no encontrada', 404);
            if (workOrder.status === 'DONE') throw new AppError('La orden ya está completada', 400);

            // 1. Mark everything as DONE
            workOrder.status = 'DONE';
            workOrder.end_date = new Date();
            workOrder.updated_by = userId;
            await workOrder.save({ transaction: t });

            for (const task of (workOrder.tasks || [])) {
                if (task.status !== 'DONE') {
                    // Deduct materials for each task
                    if (task.real_materials_used) {
                        await InventoryService.deductProductionMaterials(task.real_materials_used, t);
                    }

                    // Increment finished product stock
                    const product = await Product.findByPk(task.product_id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (product) {
                        const oldStock = parseFloat(product.current_stock || 0);
                        product.current_stock = oldStock + parseFloat(task.quantity);
                        await product.save({ transaction: t });
                        
                        // We could log ProductMovement here if we had the model
                    }

                    task.status = 'DONE';
                    task.completed_at = new Date();
                    task.updated_by = userId;
                    await task.save({ transaction: t });
                }
            }

            return workOrder;
        });
    }

    static async getProductionStatus(workOrderId) {
        const workOrder = await WorkOrder.findByPk(workOrderId, {
            include: [{ 
                model: ProductionTask, 
                as: 'tasks',
                include: [{ model: Product, as: 'product' }] 
            }]
        });
        if (!workOrder) throw new AppError('Orden no encontrada', 404);
        return workOrder;
    }
}

module.exports = ProductionService;
