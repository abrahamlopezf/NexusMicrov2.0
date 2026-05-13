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
        const PaymentService = require('./PaymentService');
        
        await sequelize.transaction(async (t) => {
            // Create Sale + SaleItems
            ({ sale, createdItems } = await SaleService.createDraft(saleData, itemsData, userId, t));

            // Procesamos el pago INMEDIATAMENTE dentro de la transacción para el POS
            if (paymentData && paymentData.amount > 0) {
                await PaymentService.registerPayment({
                    ...paymentData,
                    sale_id: sale.id,
                    type: paymentData.type || 'ANTICIPO',
                    created_by: userId
                }, t);
            }

            // Mark as CONFIRMED directly if it was a POS direct sale
            sale.fulfillment_status = 'CONFIRMED';
            await sale.save({ transaction: t, userId });
        });

        // ══════════════════════════════════════════════════════════════════════
        // STEP 2 — Enqueue remaining async jobs (e.g. WorkOrders, Points)
        // ══════════════════════════════════════════════════════════════════════
        const jobId = await QueueService.addSaleJob(SALE_CONFIRMED, {
            saleId: sale.id,
            userId
        });

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
