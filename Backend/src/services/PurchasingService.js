const { sequelize } = require('../models');
const { PurchaseOrder, PurchaseItem, Material, InventoryMovement, Account, FinancialMovement } = require('../models');
const AppError = require('../utils/AppError');

class PurchasingService {
    // RF-25: Crear Orden de Compra
    static async createPurchaseOrder(supplier_id, items) {
        const transaction = await sequelize.transaction();
        try {
            let total = 0;
            const order = await PurchaseOrder.create({
                supplier_id,
                status: 'PENDIENTE',
                total: 0,
                paid_amount: 0,
                balance: 0
            }, { transaction });

            for (const item of items) {
                const itemTotal = item.quantity * item.unit_cost;
                total += itemTotal;

                await PurchaseItem.create({
                    purchase_order_id: order.id,
                    material_id: item.material_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    total: itemTotal
                }, { transaction });
            }

            order.total = total;
            order.balance = total;
            await order.save({ transaction });

            await transaction.commit();
            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // RF-26: Recibir Mercancía (Flujo BPMN Completo)
    static async receiveMerchandise(order_id) {
        const transaction = await sequelize.transaction();
        try {
            const order = await PurchaseOrder.findByPk(order_id, {
                include: [{ model: PurchaseItem, as: 'items' }],
                transaction
            });

            if (!order) throw new AppError('Orden de compra no encontrada', 404);
            if (order.status === 'RECIBIDA') throw new AppError('La orden ya fue recibida', 400);

            // Aumentar stock por cada item
            for (const item of order.items) {
                const material = await Material.findByPk(item.material_id, { transaction });
                
                material.cost = item.unit_cost; // Actualizar costo según última compra
                material.current_stock = Number(material.current_stock) + Number(item.quantity);
                await material.save({ transaction });

                // Registrar en kardex
                await InventoryMovement.create({
                    material_id: material.id,
                    type: 'ENTRADA_COMPRA',
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    reference_type: 'PURCHASE_ORDER',
                    reference_id: order.id
                }, { transaction });
            }

            order.status = 'RECIBIDA';
            await order.save({ transaction });

            await transaction.commit();
            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Registrar Pago a Proveedor (Finanzas / Compras)
    static async registerPayment(order_id, account_id, amount, concept) {
        const transaction = await sequelize.transaction();
        try {
            const order = await PurchaseOrder.findByPk(order_id, { transaction });
            if (!order) throw new AppError('Orden no encontrada', 404);
            if (order.balance < amount) throw new AppError('El pago excede la deuda de la OC', 400);

            const account = await Account.findByPk(account_id, { transaction });
            if (!account || account.balance < amount) throw new AppError('Fondos insuficientes en la cuenta', 400);

            account.balance = Number(account.balance) - Number(amount);
            await account.save({ transaction });

            await FinancialMovement.create({
                account_id,
                type: 'EGRESO',
                concept: concept || `Pago a Proveedor OC#${order.id}`,
                amount,
                reference_type: 'PURCHASE_ORDER',
                reference_id: order.id
            }, { transaction });

            order.paid_amount = Number(order.paid_amount) + Number(amount);
            order.balance = Number(order.balance) - Number(amount);

            await order.save({ transaction });

            await transaction.commit();
            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = PurchasingService;
