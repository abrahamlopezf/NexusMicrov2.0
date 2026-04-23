const { ProductionTask, WorkOrder, sequelize } = require('../models');
const PayrollService = require('./PayrollService');
const InventoryService = require('./InventoryService');
const AppError = require('../utils/AppError');

class ProductionService {
    static async completeTask(taskId, userId, parentTransaction = null) {
        
        const executeLogic = async (t) => {
            const task = await ProductionTask.findByPk(taskId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!task) throw new AppError("Task not found", 404);
            if (task.status === 'DONE') throw new AppError('Task already completed', 400);
            if (!task.employee_id) throw new AppError('Task has no assigned employee to generate payroll', 400);

            task.status = 'DONE';
            task.completed_at = new Date();
            
            if (task.started_at) {
                const diffMs = task.completed_at - new Date(task.started_at);
                task.duration = Math.round(diffMs / 60000); 
            }

            task.updated_by = userId;
            await task.save({ transaction: t });

            const crypto = require('crypto');
            const workOrder = await WorkOrder.findByPk(task.work_order_id, { transaction: t });
            const context = {
                sale_id: workOrder ? workOrder.sale_id : null,
                operation_id: crypto.randomUUID()
            };

            if (task.real_materials_used) {
                for (const m of task.real_materials_used) {
                    const realQty = parseFloat(m.quantity) || parseFloat(m.consumedQty) || 0;
                    if (realQty > 0 && m.material_id) {
                        await InventoryService.consumeReservedStock(m.material_id, realQty, realQty, context, t);
                    }
                }
            }

            const payroll = await PayrollService.registerAdvanceForTask(task, t);
            if (!payroll) throw new AppError('Payroll generation failed', 500);

            await ProductionService.checkAndUpdateWorkOrderStatus(task.work_order_id, t);
            return task;
        };

        if (parentTransaction) {
            return await executeLogic(parentTransaction);
        }
        
        return await sequelize.transaction(async (t) => {
            return await executeLogic(t);
        });
    }

    static async checkAndUpdateWorkOrderStatus(workOrderId, transaction) {
        const { Sale } = require('../models');
        const workOrder = await WorkOrder.findByPk(workOrderId, {
            include: [{ model: ProductionTask, as: 'tasks' }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!workOrder || !workOrder.tasks) return null;

        const allDone = workOrder.tasks.every(t => t.status === 'DONE');
        if (allDone && workOrder.status !== 'DONE') {
            workOrder.status = 'DONE';
            await workOrder.save({ transaction });

            const sale = await Sale.findByPk(workOrder.sale_id, { transaction, lock: transaction.LOCK.UPDATE });
            if (sale) {
                sale.fulfillment_status = 'COMPLETED';
                await sale.save({ transaction });
            }
        }
        return workOrder;
    }
}

module.exports = ProductionService;
