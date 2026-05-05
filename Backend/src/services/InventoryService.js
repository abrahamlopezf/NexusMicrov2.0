const { Material, InventoryReservation } = require('../models');
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

    static async adjustStock(materialId, quantityDelta, contextOrTx = null, tx = null) {
        let transaction = tx;
        let context = {};
        if (contextOrTx && typeof contextOrTx.LOCK !== 'undefined') {
            transaction = contextOrTx;
        } else if (contextOrTx) {
            context = contextOrTx;
        }

        const query = `
            UPDATE materials
            SET current_stock = current_stock + :quantityDelta
            WHERE id = :materialId
            AND (current_stock + :quantityDelta) >= 0
            RETURNING *,
            ((current_stock - :quantityDelta) > min_stock AND current_stock <= min_stock) AS crossed_threshold;
        `;
        const [results] = await sequelize.query(query, {
            replacements: { quantityDelta: parseFloat(quantityDelta), materialId },
            transaction,
            type: sequelize.QueryTypes.UPDATE
        });

        if (results.length === 0) {
            throw new AppError(`Quiebre de Inventario para material ID ${materialId} o material no encontrado. Imposible satisfacer demanda.`, 400);
        }

        if (results[0].crossed_threshold) {
            const QueueService = require('./QueueService');
            await QueueService.addInventoryJob('LOW_STOCK_ALERT', {
                materialId: results[0].id,
                materialName: results[0].name,
                current_stock: results[0].current_stock,
                min_stock: results[0].min_stock,
                correlationId: context?.correlationId || null
            }, { jobId: `low-stock-${results[0].id}` });
        }

        return results[0];
    }

    static async deductProductionMaterials(materialsUsed, transaction) {
        if (!materialsUsed || !Array.isArray(materialsUsed)) return;
        for (const m of materialsUsed) {
            const qty = parseFloat(m.quantity) || parseFloat(m.consumedQty) || 0;
            if (qty > 0 && m.material_id) {
                await InventoryService.validateStock(m.material_id, qty, transaction);
                await InventoryService.adjustStock(m.material_id, -qty, transaction);
            }
        }
    }

    static async reserveStock(materialId, quantity, context, transaction) {
        if (!transaction) throw new AppError('reserveStock requires a transaction', 500);
        const { sale_id, sale_item_id, operation_id, expires_at } = context || {};

        if (operation_id) {
            const existing = await InventoryReservation.findOne({ where: { operation_id }, transaction });
            if (existing) return existing; // Idempotency
        }
        
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
            throw new AppError(`INSUFFICIENT_AVAILABLE_STOCK or Material ${materialId} not found. Required: ${quantity}`, 400);
        }

        const reservation = await InventoryReservation.create({
            material_id: materialId,
            sale_id,
            sale_item_id,
            quantity,
            status: 'RESERVED',
            operation_id,
            expires_at
        }, { transaction });

        return reservation;
    }

    static async releaseReservedStock(materialId, quantity, context, transaction) {
        if (!transaction) throw new AppError('releaseReservedStock requires a transaction', 500);
        const { operation_id, sale_id } = context || {};

        let reservation = null;
        if (operation_id) {
            reservation = await InventoryReservation.findOne({ where: { operation_id, status: 'RESERVED' }, transaction, lock: transaction.LOCK.UPDATE });
        } else if (sale_id) {
            reservation = await InventoryReservation.findOne({ where: { sale_id, material_id: materialId, status: 'RESERVED' }, transaction, lock: transaction.LOCK.UPDATE });
        }

        const qtyToRelease = reservation ? parseFloat(reservation.quantity) : parseFloat(quantity);

        const query = `
            UPDATE materials
            SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - :qtyToRelease)
            WHERE id = :materialId
            RETURNING *;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { qtyToRelease, materialId },
            transaction,
            type: sequelize.QueryTypes.UPDATE
        });

        if (results.length === 0) {
            throw new AppError(`Material with ID ${materialId} not found`, 404);
        }

        if (reservation) {
            reservation.status = 'RELEASED';
            await reservation.save({ transaction });
        }

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
            RETURNING *,
            ((current_stock + :realQ) > min_stock AND current_stock <= min_stock) AS crossed_threshold;
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

        if (results[0].crossed_threshold) {
            const QueueService = require('./QueueService');
            await QueueService.addInventoryJob('LOW_STOCK_ALERT', {
                materialId: results[0].id,
                materialName: results[0].name,
                current_stock: results[0].current_stock,
                min_stock: results[0].min_stock,
                correlationId: context?.correlationId || null
            }, { jobId: `low-stock-${results[0].id}` });
        }

        return results[0];
    }
}

module.exports = InventoryService;
