const { PurchaseOrder, PurchaseItem, Material, Supplier, sequelize } = require('../models');
const InventoryService = require('./InventoryService');
const AppError = require('../utils/AppError');

class PurchaseService {
    static async createPurchaseOrder(data, userId) {
        const { supplierId, items, notes } = data;
        const t = await sequelize.transaction();

        try {
            // 1. Create Purchase Order
            const purchaseOrder = await PurchaseOrder.create({
                supplier_id: supplierId,
                status: 'PENDIENTE',
                total: items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
                notes: notes
            }, { transaction: t });

            // 2. Create Items
            const purchaseItems = await Promise.all(items.map(item => 
                PurchaseItem.create({
                    purchase_order_id: purchaseOrder.id,
                    material_id: item.materialId,
                    quantity: item.quantity,
                    unit_cost: item.unitCost,
                    total: item.quantity * item.unitCost
                }, { transaction: t })
            ));

            await t.commit();
            return { purchaseOrder, items: purchaseItems };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getPurchaseOrders(query = {}) {
        const { supplierId, status } = query;
        const where = {};
        if (supplierId) where.supplier_id = supplierId;
        if (status) where.status = status;

        return await PurchaseOrder.findAll({
            where,
            include: [
                { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
                { model: PurchaseItem, as: 'items', include: [{ model: Material, as: 'material', attributes: ['id', 'name', 'unit'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });
    }

    static async getPurchaseOrderById(id) {
        const order = await PurchaseOrder.findByPk(id, {
            include: [
                { model: Supplier, as: 'supplier' },
                { model: PurchaseItem, as: 'items', include: [{ model: Material, as: 'material' }] }
            ]
        });
        if (!order) throw new AppError('Orden de compra no encontrada', 404);
        return order;
    }

    static async receivePurchaseOrder(id, userId) {
        const t = await sequelize.transaction();

        try {
            const order = await PurchaseOrder.findByPk(id, {
                include: [{ model: PurchaseItem, as: 'items' }],
                transaction: t
            });

            if (!order) throw new AppError('Orden de compra no encontrada', 404);
            if (order.status === 'RECIBIDA') throw new AppError('Esta orden ya fue recibida', 400);

            // 1. Update status
            order.status = 'RECIBIDA';
            await order.save({ transaction: t });

            // 2. Increase stock for each item using the unified adjustStock
            for (const item of order.items) {
                await InventoryService.adjustStock({
                    materialId: item.material_id,
                    quantity: item.quantity,
                    type: 'ENTRADA_COMPRA',
                    reason: `Entrada por Orden de Compra #${order.id}`,
                    referenceType: 'PURCHASE_ORDER',
                    referenceId: order.id,
                    userId: userId,
                    transaction: t
                });
            }

            await t.commit();
            return order;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = PurchaseService;
