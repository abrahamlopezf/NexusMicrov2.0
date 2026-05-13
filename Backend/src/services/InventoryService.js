const { Material, InventoryReservation, InventoryMovement, Supplier, StockAlert } = require('../models');
const AppError = require('../utils/AppError');
const sequelize = require('../config/database');
const { LOW_STOCK_ALERT } = require('../queues/jobs/inventory.jobs');

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

    /**
     * Unified method for stock adjustments with movement logging
     */
    static async adjustStock({ materialId, quantity, type, reason, referenceType, referenceId, userId, transaction = null }) {
        const QueueService = require('./QueueService'); // BREAK CIRCULAR DEP

        const executeAdjustment = async (t) => {
            const material = await Material.findByPk(materialId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!material) throw new AppError('Material no encontrado', 404);

            const oldStock = parseFloat(material.current_stock);
            const delta = parseFloat(quantity);
            const newStock = oldStock + delta;

            if (newStock < 0) throw new AppError('El stock resultante no puede ser negativo', 400);

            await material.update({ current_stock: newStock }, { transaction: t });

            // Check for low stock and trigger alert if necessary (Safely)
            if (newStock <= parseFloat(material.min_stock)) {
                try {
                    QueueService.addInventoryJob(LOW_STOCK_ALERT, {
                        materialId: material.id,
                        materialName: material.name,
                        current_stock: newStock,
                        min_stock: material.min_stock,
                        correlationId: `ADJUST-${Date.now()}`
                    }).catch(err => console.error('Error adding inventory job:', err));
                } catch (alertErr) {
                    console.error('Failed to trigger low stock alert:', alertErr);
                }
            }

            // Create movement record
            await InventoryMovement.create({
                material_id: materialId,
                type: type || (delta > 0 ? 'ENTRADA_MANUAL' : 'SALIDA_MANUAL'),
                quantity: Math.abs(delta),
                reference_type: referenceType || 'MANUAL_ADJUST',
                reference_id: referenceId || userId,
                reason: reason
            }, { transaction: t });

            return material;
        };

        if (transaction) {
            return await executeAdjustment(transaction);
        } else {
            return await sequelize.transaction(async (t) => {
                return await executeAdjustment(t);
            });
        }
    }

    // Keep legacy methods for compatibility but redirect to unified
    static async adjustInventory(params) {
        return await this.adjustStock(params);
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
        const material = await Material.findByPk(materialId, { transaction });
        const currentReserved = parseFloat(material.reserved_stock || 0);
        await material.update({ reserved_stock: Math.max(0, currentReserved - parseFloat(quantity)) }, { transaction });
        return material;
    }

    static async consumeReservedStock(materialId, reservedQty, realQty, context, transaction) {
        if (!transaction) throw new AppError('consumeReservedStock requires a transaction', 500);
        const material = await Material.findByPk(materialId, { transaction, lock: transaction.LOCK.UPDATE });
        const oldStock = parseFloat(material.current_stock);
        const oldReserved = parseFloat(material.reserved_stock || 0);
        
        await material.update({
            current_stock: oldStock - parseFloat(realQty),
            reserved_stock: Math.max(0, oldReserved - parseFloat(reservedQty))
        }, { transaction });
        
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

    static async getLowStockAlerts() {
        const QueueService = require('./QueueService'); // BREAK CIRCULAR DEP

        const lowMaterials = await Material.findAll({
            where: sequelize.where(
                sequelize.col('current_stock'),
                '<=',
                sequelize.col('min_stock')
            )
        });

        for (const material of lowMaterials) {
            try {
                QueueService.addInventoryJob(LOW_STOCK_ALERT, {
                    materialId: material.id,
                    materialName: material.name,
                    current_stock: material.current_stock,
                    min_stock: material.min_stock,
                    correlationId: `SYNC-${Date.now()}`
                }).catch(e => console.error('Sync job failed:', e));
            } catch (err) {
                console.error('Failed to queue sync job:', err);
            }
        }

        return await StockAlert.findAll({
            where: { resolved: false },
            include: [{ model: Material, as: 'material', attributes: ['name', 'unit', 'current_stock', 'min_stock'] }],
            order: [['created_at', 'DESC']]
        });
    }

    static async resolveAlert(alertId) {
        const alert = await StockAlert.findByPk(alertId);
        if (!alert) throw new AppError('Alerta no encontrada', 404);
        await alert.update({ resolved: true, resolved_at: new Date() });
        return alert;
    }
}

module.exports = InventoryService;
