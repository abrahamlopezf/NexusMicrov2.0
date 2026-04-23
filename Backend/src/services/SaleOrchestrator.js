const { sequelize } = require('../models');
const SaleService = require('./SaleService');
const QueueService = require('./QueueService');
const { SALE_CONFIRMED } = require('../queues/jobs/sale.jobs');
const AppError = require('../utils/AppError');

class SaleOrchestrator {
    static async createSale(saleData, itemsData, paymentData = null, userId = null) {
        if (!itemsData || itemsData.length === 0) {
            throw new AppError('Sale must have at least one item', 400);
        }

        let sale;
        let createdItems;

        // ══════════════════════════════════════════════════════════════════════
        // STEP 1 — Synchronous DB Transaction
        // ══════════════════════════════════════════════════════════════════════
        await sequelize.transaction(async (t) => {
            // Create Sale + SaleItems
            ({ sale, createdItems } = await SaleService.createDraft(saleData, itemsData, userId, t));

            // Optional: If Payment needs to be synced as well, the user didn't explicitly forbid payment here,
            // but the prompt said: "BEFORE: Direct calls to InventoryService, WorkOrder creation, PaymentService."
            // "AFTER: STEP 1: Create Sale. Create SaleItems. Commit transaction."
            // We follow literally. The payment registration logic goes into Payment Worker if paymentData exists.

            // Mark as QUEUED — signals that async processing is pending
            sale.fulfillment_status = 'QUEUED';
            await sale.save({ transaction: t, userId });
        });

        // ══════════════════════════════════════════════════════════════════════
        // STEP 2 — Enqueue jobs
        // ══════════════════════════════════════════════════════════════════════
        const jobId = await QueueService.addSaleJob(SALE_CONFIRMED, {
            saleId: sale.id,
            userId,
            paymentData // Passed async to the worker or another queue
        });

        if (paymentData && paymentData.amount > 0) {
            const { REGISTER_PAYMENT } = require('../queues/jobs/payment.jobs');
            await QueueService.addPaymentJob(REGISTER_PAYMENT, {
                ...paymentData,
                sale_id: sale.id,
                type: paymentData.type || 'ANTICIPO',
                created_by: userId
            });
        }

        // ══════════════════════════════════════════════════════════════════════
        // STEP 3 — Return response immediately
        // ══════════════════════════════════════════════════════════════════════
        return {
            sale,
            processing: {
                mode: 'async',
                jobId: jobId.id
            }
        };
    }
}
module.exports = SaleOrchestrator;
