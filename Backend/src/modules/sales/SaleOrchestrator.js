const { sequelize } = require('../../models');

const SaleService = require('./SaleService');
const QueueService = require('../../services/QueueService');
const InventoryService = require('../inventory/InventoryService');

const { SALE_CONFIRMED } = require('../../queues/jobs/sale.jobs');
const AppError = require('../../utils/AppError');

class SaleOrchestrator {
    static async createSale(saleData, itemsData, userId) {
        const result = await sequelize.transaction(async (t) => {
            const { sale, createdItems } = await SaleService.createDraft(
                saleData,
                itemsData,
                userId,
                t
            );

            const workOrders = await SaleService.spawnWorkOrders(sale.id, createdItems, userId, t);

            return {
                sale,
                createdItems,
                workOrders
            };
        });

        let autoBaseResult = {
            created_count: 0,
            skipped_count: 0,
            created: [],
            skipped: [],
            error: null
        };

        try {
            autoBaseResult = await InventoryService.generateAutoBaseRequirementsForSale(
                result.sale.id,
                { id: userId }
            );
        } catch (error) {
            autoBaseResult.error = {
                message: error.message
            };
        }

        return {
            ...result,
            material_planning: {
                auto_base: autoBaseResult
            }
        };
    }
}
module.exports = SaleOrchestrator;
