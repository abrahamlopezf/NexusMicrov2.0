const { Sale, SaleItem, Payment } = require('../../models');

const FINANCIAL_STATUS = {
    UNPAID: 'UNPAID',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED'
};

const FULFILLMENT_STATUS = {
    PENDING: 'PENDING',
    QUEUED: 'QUEUED',
    IN_PRODUCTION: 'IN_PRODUCTION',
    READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
    PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
};

class SaleStatusService {

    static async syncSaleStatuses(saleId, transaction = null) {

        const sale = await Sale.findByPk(saleId, {
            include: [
                {
                    model: SaleItem,
                    as: 'items'
                },
                {
                    model: Payment,
                    as: 'payments'
                }
            ],
            transaction
        });

        if (!sale) return null;

        const total = parseFloat(sale.total || 0);

        // ═════════════════════════════════════════════════════════════
        // FINANCIAL STATUS
        // Source of truth: payments
        // ═════════════════════════════════════════════════════════════

        const payments = sale.payments || [];

        // Solo consideramos pagos activos/no cancelados
        const validPayments = payments.filter(payment =>
            payment.status !== 'CANCELLED'
        );

        // Dinero real recibido en caja/banco
        const paidAmount = validPayments.reduce((sum, payment) => {
            if (payment.affects_balance === false) return sum;
            if (payment.type === 'RETENCION') return sum;

            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const retainedAmount = validPayments.reduce((sum, payment) => {
            if (payment.affects_balance === false) return sum;
            if (payment.type !== 'RETENCION') return sum;

            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const appliedAmount = paidAmount + retainedAmount;

        let financialStatus = FINANCIAL_STATUS.UNPAID;

        if (appliedAmount <= 0) {
            financialStatus = FINANCIAL_STATUS.UNPAID;
        } else if (appliedAmount < total) {
            financialStatus = FINANCIAL_STATUS.PARTIAL;
        } else {
            financialStatus = FINANCIAL_STATUS.PAID;
        }

        const balance = Math.max(total - appliedAmount, 0);

        // ═════════════════════════════════════════════════════════════
        // FULFILLMENT STATUS
        // Source of truth: sale items
        // ═════════════════════════════════════════════════════════════

        const items = sale.items || [];

        let fulfillmentStatus = sale.fulfillment_status || FULFILLMENT_STATUS.PENDING;

        if (items.length === 0) {
            fulfillmentStatus = FULFILLMENT_STATUS.PENDING;
        } else {
            const productionStatuses = items.map(item => item.production_status);
            const deliveryStatuses = items.map(item => item.delivery_status);

            const allDelivered = deliveryStatuses.every(status => status === 'DELIVERED');
            const someDelivered = deliveryStatuses.some(status => status === 'DELIVERED');

            const allReady = productionStatuses.every(status =>
                ['READY', 'FINISHED', 'DONE'].includes(status)
            );

            const someInProduction = productionStatuses.some(status =>
                ['IN_PROGRESS', 'CUTTING', 'SEWING', 'QUALITY_CHECK'].includes(status)
            );

            if (allDelivered) {
                fulfillmentStatus = FULFILLMENT_STATUS.DELIVERED;
            } else if (someDelivered) {
                fulfillmentStatus = FULFILLMENT_STATUS.PARTIALLY_DELIVERED;
            } else if (allReady) {
                fulfillmentStatus = FULFILLMENT_STATUS.READY_FOR_DELIVERY;
            } else if (someInProduction) {
                fulfillmentStatus = FULFILLMENT_STATUS.IN_PRODUCTION;
            } else {
                fulfillmentStatus = sale.fulfillment_status === FULFILLMENT_STATUS.QUEUED
                    ? FULFILLMENT_STATUS.QUEUED
                    : FULFILLMENT_STATUS.PENDING;
            }
        }

        // ═════════════════════════════════════════════════════════════
        // UPDATE SALE SUMMARY
        // Do NOT update legacy sale.status here yet
        // ═════════════════════════════════════════════════════════════

        await sale.update({
            financial_status: financialStatus,
            fulfillment_status: fulfillmentStatus,
            paid_amount: paidAmount,
            retained_amount: retainedAmount,
            balance,
            is_paid: financialStatus === FINANCIAL_STATUS.PAID
        }, { transaction });

        return sale;
    }
}

module.exports = SaleStatusService;