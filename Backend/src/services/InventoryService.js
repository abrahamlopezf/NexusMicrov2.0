const { Material, InventoryReservation, InventoryMovement, Supplier } = require('../models');
const AppError = require('../utils/AppError');
const sequelize = require('../config/database');

class InventoryService {
    static async validateStock(materialId, requiredQuantity, transaction = null) {
        const material = await Material.findByPk(materialId, {
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : false
        });
        if (!material) throw new AppError(`Material with ID ${materialId} not found`, 404);

        if (parseFloat(material.current_stock) < parseFloat(requiredQuantity)) {
            throw new AppError(`Stock insuficiente para ${material.name}. Requerido: ${requiredQuantity}, Disponible: ${material.current_stock}`, 400);
        }
        return material;
    }

    static async adjustStock(materialId, quantityDelta, transaction = null) {
        const query = `
            UPDATE materials
            SET current_stock = current_stock + :quantityDelta
            WHERE id = :materialId
            AND (current_stock + :quantityDelta) >= 0
            RETURNING *;
        `;
        const [results] = await sequelize.query(query, {
            replacements: { quantityDelta: parseFloat(quantityDelta), materialId },
            transaction,
            type: sequelize.QueryTypes.UPDATE
        });

        if (results.length === 0) {
            throw new AppError(`Quiebre de Inventario para material ID ${materialId} o material no encontrado. Imposible satisfacer demanda.`, 400);
        }

        return results[0];
    }

    static async getInventory(query) {
        const { category, stockStatus } = query;
        const where = {};
        if (category) where.category = category;

        const materials = await Material.findAll({
            where,
            include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
            order: [['name', 'ASC']]
        });

        if (stockStatus) {
            return materials.filter(m => {
                if (stockStatus === 'CRITICAL') return parseFloat(m.current_stock) <= parseFloat(m.min_stock) * 0.5;
                if (stockStatus === 'LOW') return parseFloat(m.current_stock) <= parseFloat(m.min_stock);
                return true;
            });
        }
        return materials;
    }

    static async reserveStock(materialId, quantity, context, transaction) {
        if (!transaction) throw new AppError('reserveStock requires a transaction', 500);
        const { sale_id, sale_item_id, operation_id, expires_at } = context || {};

        const query = `
            UPDATE materials 
            SET reserved_stock = COALESCE(reserved_stock, 0) + :quantity
            WHERE id = :materialId 
            AND (current_stock - COALESCE(reserved_stock, 0)) >= :quantity
            RETURNING *;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { quantity: parseFloat(quantity), materialId },
            transaction,
            type: sequelize.QueryTypes.UPDATE
        });

        if (results.length === 0) {
            throw new AppError(`Stock insuficiente para reservar material ${materialId}`, 400);
        }

        return await InventoryReservation.create({
            material_id: materialId,
            sale_id,
            sale_item_id,
            quantity,
            status: 'RESERVED',
            operation_id,
            expires_at
        }, { transaction });
    }

    static async releaseReservedStock(materialId, quantity, context, transaction) {
        if (!transaction) throw new AppError('releaseReservedStock requires a transaction', 500);
        // Simplified for brevity
        const material = await Material.findByPk(materialId, { transaction });
        const currentReserved = parseFloat(material.reserved_stock || 0);
        await material.update({ reserved_stock: Math.max(0, currentReserved - parseFloat(quantity)) }, { transaction });
        return material;
    }

    static async consumeReservedStock(materialId, reservedQty, realQty, context, transaction) {
        if (!transaction) throw new AppError('consumeReservedStock requires a transaction', 500);
        const { operation_id, sale_id } = context || {};

        let reservation = null;
        if (operation_id) {
            reservation = await InventoryReservation.findOne({ where: { operation_id, status: 'RESERVED' }, transaction, lock: transaction.LOCK.UPDATE });
        } else if (sale_id) {
            reservation = await InventoryReservation.findOne({ where: { sale_id, material_id: materialId, status: 'RESERVED' }, transaction, lock: transaction.LOCK.UPDATE });
        }

        const matReservedQty = reservation ? parseFloat(reservation.quantity) : parseFloat(reservedQty);

        const realQ = parseFloat(realQty);

        const query = `
            UPDATE materials 
            SET current_stock = current_stock - :realQ,
                reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - :matReservedQty)
            WHERE id = :materialId 
            AND current_stock >= :realQ
            RETURNING *;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { realQ, matReservedQty, materialId },
            transaction,
            type: sequelize.QueryTypes.UPDATE
        });

        if (results.length === 0) {
            throw new AppError(`Quiebre de Inventario para material ID ${materialId} o material no encontrado. Imposible satisfacer demanda.`, 400);
        }

        if (reservation) {
            reservation.status = 'CONSUMED';
            await reservation.save({ transaction });
        }

        return material;
    }

    static async getInventoryMovements(query) {
        const { materialId, type, limit = 50, offset = 0 } = query;
        const where = {};
        if (materialId) where.material_id = materialId;
        if (type) where.type = type;

        return await InventoryMovement.findAndCountAll({
            where,
            include: [{ model: Material, as: 'material', attributes: ['name', 'unit'] }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
}

module.exports = InventoryService;
