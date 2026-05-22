const { SaleItem, sequelize } = require('../../models');
const AppError = require('../../utils/AppError');
const SaleStatusService = require('./SaleStatusService');

class GarmentDeliveryService {

    static async deliverGarment(saleItemId, userId) {

        return await sequelize.transaction(async (t) => {

            const saleItem = await SaleItem.findByPk(saleItemId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            // Prevent duplicate delivery
            if (saleItem.delivery_status === 'DELIVERED') {
                throw new AppError('Garment already delivered', 400);
            }

            // Only READY garments can be delivered
            if (saleItem.production_status !== 'READY') {
                throw new AppError(
                    'Garment must be READY before delivery',
                    400
                );
            }

            // Update garment
            saleItem.delivery_status = 'DELIVERED';
            saleItem.delivered_at = new Date();

            await saleItem.save({ transaction: t });

            // Sync parent sale
            await SaleStatusService.syncSaleStatuses(
                saleItem.sale_id,
                t
            );

            return saleItem;
        });
    }
}

module.exports = GarmentDeliveryService;