const { SaleItem, sequelize } = require('../../models');
const AppError = require('../../utils/AppError');
const SaleStatusService = require('../sales/SaleStatusService');

class ProductionWorkflowService {

    // ═══════════════════════════════════════════════════════
    // START PRODUCTION
    // ═══════════════════════════════════════════════════════
    static async startProduction(saleItemId, userId) {

        return await sequelize.transaction(async (t) => {

            const saleItem = await SaleItem.findByPk(saleItemId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            if (saleItem.production_status !== 'PENDING') {
                throw new AppError(
                    'Only pending garments can start production',
                    400
                );
            }

            saleItem.production_status = 'IN_PROGRESS';

            await saleItem.save({ transaction: t });

            await SaleStatusService.syncSaleStatuses(
                saleItem.sale_id,
                t
            );

            return saleItem;
        });
    }

    // ═══════════════════════════════════════════════════════
    // MARK READY
    // ═══════════════════════════════════════════════════════
    static async markReady(saleItemId, userId) {

        return await sequelize.transaction(async (t) => {

            const saleItem = await SaleItem.findByPk(saleItemId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            if (saleItem.production_status !== 'IN_PROGRESS') {
                throw new AppError(
                    'Garment must be in production first',
                    400
                );
            }

            saleItem.production_status = 'READY';

            await saleItem.save({ transaction: t });

            await SaleStatusService.syncSaleStatuses(
                saleItem.sale_id,
                t
            );

            return saleItem;
        });
    }

    // ═══════════════════════════════════════════════════════
    // CANCEL PRODUCTION
    // ═══════════════════════════════════════════════════════
    static async cancelProduction(saleItemId, reason, userId) {

        return await sequelize.transaction(async (t) => {

            const saleItem = await SaleItem.findByPk(saleItemId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            saleItem.production_status = 'CANCELLED';

            await saleItem.save({ transaction: t });

            await SaleStatusService.syncSaleStatuses(
                saleItem.sale_id,
                t
            );

            return saleItem;
        });
    }
}

module.exports = ProductionWorkflowService;