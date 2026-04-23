const { sequelize, Sale, Payment, WorkOrder, ProductionTask } = require('../models');
const AppError = require('../utils/AppError');
const InventoryService = require('./InventoryService');

class CancellationService {
    static async cancelSale(saleId, userId) {
        return await sequelize.transaction(async (t) => {
            const sale = await Sale.findByPk(saleId, { 
                include: ['items', 'payments', 'work_order'],
                transaction: t, 
                lock: t.LOCK.UPDATE 
            });

            if (!sale) throw new AppError("Sale not found", 404);
            if (sale.financial_status === 'REFUNDED' || sale.fulfillment_status === 'CANCELLED') {
                throw new AppError("Sale is already cancelled", 400);
            }

            // 1. Revert Inventory using estimates sequentially
            if (sale.items) {
                for (const item of sale.items) {
                    if (item.materials_estimate) {
                        for (const m of item.materials_estimate) {
                            const qty = m.quantity || m.consumedQty || 0;
                            if (qty > 0) {
                                const context = { sale_id: sale.id };
                                await InventoryService.releaseReservedStock(m.material_id, qty * item.quantity, context, t);
                            }
                        }
                    }
                }
            }

            // 2. Cancel Production Flow
            if (sale.work_order) {
                const workOrder = sale.work_order;
                workOrder.status = 'CANCELLED';
                await workOrder.save({ transaction: t, userId });

                const tasks = await ProductionTask.findAll({ where: { work_order_id: workOrder.id }, transaction: t, lock: t.LOCK.UPDATE });
                for (const task of tasks) {
                    task.status = 'CANCELLED';
                    task.updated_by = userId;
                    await task.save({ transaction: t, userId });
                }
            }

            // 3. Reverse Payments (Refunds)
            if (sale.payments) {
                for (const payment of sale.payments) {
                    if (payment.amount > 0 && payment.type !== 'REFUND') {
                        await Payment.create({
                            sale_id: sale.id,
                            account_id: payment.account_id,
                            amount: -payment.amount, // Negativo para balance
                            payment_method: payment.payment_method,
                            type: 'REFUND',
                            reference: `Refund Cancellation Sale ${sale.sale_number}`,
                            created_by: userId
                        }, { transaction: t, userId });
                    }
                }
            }

            // 4. Update Sale to Terminal States
            sale.financial_status = 'REFUNDED';
            sale.fulfillment_status = 'CANCELLED';
            sale.balance = 0;
            sale.paid_amount = 0;
            await sale.save({ transaction: t, userId });

            return sale;
        });
    }
}
module.exports = CancellationService;
