const { ProductionTask, WorkOrder, Product, Material, sequelize } = require('../../models');
const InventoryService = require('../inventory/InventoryService');
const AppError = require('../../utils/AppError');

class ProductionService {
    static async startProduction(workOrderId, userId) {
        return await sequelize.transaction(async (t) => {
            const locked = await WorkOrder.findByPk(workOrderId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!locked) throw new AppError('Orden de producción no encontrada', 404);
            const status = (locked.status || '').toUpperCase();
            if (status !== 'PENDING' && status !== 'PENDIENTE') {
                throw new AppError('La orden ya ha sido iniciada o finalizada', 400);
            }

            const workOrder = await WorkOrder.findByPk(workOrderId, {
                include: [{ model: ProductionTask, as: 'tasks' }],
                transaction: t
            });

            workOrder.status = 'IN_PROGRESS';
            workOrder.start_date = new Date();
            workOrder.updated_by = userId;
            await workOrder.save({ transaction: t });

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
            const locked = await WorkOrder.findByPk(workOrderId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!locked) throw new AppError('Orden de producción no encontrada', 404);
            if (locked.status === 'DONE') throw new AppError('La orden ya está completada', 400);

            const workOrder = await WorkOrder.findByPk(workOrderId, {
                include: [{ model: ProductionTask, as: 'tasks', include: [{ model: Product, as: 'product' }] }],
                transaction: t
            });

            workOrder.status = 'DONE';
            workOrder.end_date = new Date();
            workOrder.updated_by = userId;
            await workOrder.save({ transaction: t });

            for (const task of (workOrder.tasks || [])) {
                if (task.status === 'DONE') continue;

                try {
                    if (task.real_materials_used) {
                        await InventoryService.deductProductionMaterials(
                            task.real_materials_used,
                            t
                        );
                    }

                    if (task.product_id) {
                        const product = await Product.findByPk(task.product_id, {
                            transaction: t,
                            lock: t.LOCK.UPDATE
                        });

                        if (product) {
                            const current = Number(product.current_stock || 0);
                            product.current_stock = current + Number(task.quantity || 0);
                            await product.save({ transaction: t });
                        }
                    }

                    task.status = 'DONE';
                    task.completed_at = new Date();
                    task.updated_by = userId;
                    await task.save({ transaction: t });

                } catch (err) {
                    throw new AppError(
                        `Error completing task ${task.id}: ${err.message}`,
                        500
                    );
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
