const { LedgerEntry, Sale, Payment, InventoryReservation, AuditLog } = require('../../models');
const InventoryService = require('../inventory/InventoryService');
const sequelize = require('../../config/database');
const AppError = require('../../utils/AppError');
const { v4: uuidv4 } = require('uuid');

class LedgerService {
    /**
     * Registra una transacción por partida doble (Double-Entry).
     * @param {Array} entries - Arreglo de { account_name, debit, credit, reference_type, reference_id }
     * @param {Object} options - { transaction, correlationId }
     */
    static async recordDoubleEntry(entries, options = {}) {
        if (!entries || entries.length === 0) return;

        const totalDebit = entries.reduce((acc, e) => acc + parseFloat(e.debit || 0), 0);
        const totalCredit = entries.reduce((acc, e) => acc + parseFloat(e.credit || 0), 0);

        // Strict double-entry accounting rule
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new AppError('Contabilidad Inválida: Los Débitos no igualan a los Créditos', 500);
        }

        const entryGroupId = uuidv4();
        const payload = entries.map(e => ({
            entry_group_id: entryGroupId,
            account_name: e.account_name,
            debit: parseFloat(e.debit || 0),
            credit: parseFloat(e.credit || 0),
            currency: e.currency || 'USD',
            reference_type: e.reference_type,
            reference_id: e.reference_id,
            correlation_id: options.correlationId
        }));

        await LedgerEntry.bulkCreate(payload, { transaction: options.transaction });
        return entryGroupId;
    }
}

class CancellationService {
    static async cancelSale(saleId, context = {}) {
        const { userId, correlationId, ipAddress, userAgent } = context;

        return await sequelize.transaction(async (t) => {
            const sale = await Sale.findByPk(saleId, { 
                include: ['items', 'payments'],
                transaction: t, 
                lock: t.LOCK.UPDATE 
            });

            if (!sale) throw new AppError('Venta no encontrada', 404);
            if (sale.status === 'CANCELLED') return sale; // Idempotent

            // 1. Mark Sale as CANCELLED
            sale.status = 'CANCELLED';
            await sale.save({ 
                transaction: t,
                userId, correlationId, ipAddress, userAgent 
            });

            // 2. Release Reserved Inventory (Saga pattern)
            const reservations = await InventoryReservation.findAll({ 
                where: { sale_id: saleId, status: 'RESERVED' }, 
                transaction: t 
            });

            for (const res of reservations) {
                await InventoryService.releaseReservedStock(res.material_id, res.quantity, { sale_id: sale.id }, t);
            }

            // 3. Handle Financials / Refunds
            const totalPaid = sale.paid_amount;
            if (totalPaid > 0) {
                // Reverse Ledger Entries (Double-Entry Refund)
                await LedgerService.recordDoubleEntry([
                    { account_name: 'REVENUE', debit: totalPaid, credit: 0, reference_type: 'CANCEL', reference_id: sale.id },
                    { account_name: 'CASH', debit: 0, credit: totalPaid, reference_type: 'CANCEL', reference_id: sale.id }
                ], { transaction: t, correlationId });
            }

            // 4. Cancel active WorkOrders (if any)
            // (Assuming WorkOrder model exposes a cancel method or we just update status)
            const { WorkOrder } = require('../../models');
            await WorkOrder.update({ status: 'CANCELLED' }, { 
                where: { sale_id: saleId, status: ['PENDING', 'IN_PROGRESS'] }, 
                transaction: t 
            });

            return sale;
        });
    }
}

module.exports = { LedgerService, CancellationService };
