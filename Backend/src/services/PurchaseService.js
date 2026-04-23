const db = require('../models');
const inventoryService = require('./InventoryService');

const createPurchaseOrder = async (supplierId, items) => {
    const transaction = await db.sequelize.transaction();
    try {
        const purchaseOrder = await db.PurchaseOrder.create({
            supplier_id: supplierId,
            status: 'PENDIENTE',
            total: 0
        }, { transaction });

        let total = 0;
        if (items && items.length > 0) {
            const purchaseItems = items.map(item => {
                const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_cost);
                total += itemTotal;
                return {
                    purchase_order_id: purchaseOrder.id,
                    material_id: item.material_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    total: itemTotal
                };
            });
            await db.PurchaseItem.bulkCreate(purchaseItems, { transaction });
        }

        purchaseOrder.total = total;
        await purchaseOrder.save({ transaction });

        await transaction.commit();
        return getPurchaseOrderById(purchaseOrder.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const receivePurchaseOrder = async (purchaseOrderId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const order = await db.PurchaseOrder.findByPk(purchaseOrderId, {
            include: [{ model: db.PurchaseItem, as: 'items' }],
            transaction
        });

        if (!order) throw new Error('Purchase order not found');
        if (order.status === 'RECIBIDA') throw new Error('Purchase order already received');

        for (const item of order.items) {
            await inventoryService.addMaterialStock(
                item.material_id,
                item.quantity,
                'PURCHASE',
                order.id,
                transaction
            );
        }

        order.status = 'RECIBIDA';
        await order.save({ transaction });

        await transaction.commit();
        return getPurchaseOrderById(order.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const getPurchaseOrderById = async (id) => {
    const order = await db.PurchaseOrder.findByPk(id, {
        include: [
            { model: db.Supplier, as: 'supplier' },
            {
                model: db.PurchaseItem,
                as: 'items',
                include: [{ model: db.Material, as: 'material' }]
            }
        ]
    });
    if (!order) throw new Error('Purchase order not found');
    return order;
};

const getAllPurchaseOrders = async () => {
    return db.PurchaseOrder.findAll({
        include: [{ model: db.Supplier, as: 'supplier' }],
        order: [['created_at', 'DESC']]
    });
};

module.exports = {
    createPurchaseOrder,
    receivePurchaseOrder,
    getPurchaseOrderById,
    getAllPurchaseOrders
};
