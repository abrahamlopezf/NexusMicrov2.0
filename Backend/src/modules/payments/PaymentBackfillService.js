const { Sale, Payment, sequelize } = require('../../models');
const { Op } = require('sequelize');
const SaleStatusService = require('../sales/SaleStatusService');

class PaymentBackfillService {

    static async backfillLegacyPayments(options = {}) {
        const {
            dryRun = true,
            createdBy = null
        } = options;

        const report = {
            dryRun,
            checkedSales: 0,
            affectedSales: 0,
            createdPayments: 0,
            skippedSales: 0,
            totalBackfilledAmount: 0,
            details: []
        };

        const sales = await Sale.findAll({
            where: {
                paid_amount: {
                    [Op.gt]: 0
                }
            },
            include: [
                {
                    model: Payment,
                    as: 'payments',
                    required: false
                }
            ],
            order: [['id', 'ASC']]
        });

        for (const sale of sales) {
            report.checkedSales += 1;

            const legacyPaidAmount = parseFloat(sale.paid_amount || 0);

            const payments = sale.payments || [];

            const existingAppliedAmount = payments
                .filter(payment => payment.status !== 'CANCELLED')
                .filter(payment => payment.affects_balance !== false)
                .reduce((sum, payment) => {
                    return sum + parseFloat(payment.amount || 0);
                }, 0);

            const missingAmount = legacyPaidAmount - existingAppliedAmount;

            if (missingAmount <= 0.01) {
                report.skippedSales += 1;

                report.details.push({
                    sale_id: sale.id,
                    sale_number: sale.sale_number,
                    action: 'SKIPPED',
                    reason: 'Existing payments already cover legacy paid_amount',
                    legacyPaidAmount,
                    existingAppliedAmount,
                    missingAmount: 0
                });

                continue;
            }

            report.affectedSales += 1;
            report.totalBackfilledAmount += missingAmount;

            report.details.push({
                sale_id: sale.id,
                sale_number: sale.sale_number,
                action: dryRun ? 'WOULD_CREATE_PAYMENT' : 'CREATED_PAYMENT',
                legacyPaidAmount,
                existingAppliedAmount,
                missingAmount
            });

            if (dryRun) {
                continue;
            }

            await sequelize.transaction(async (t) => {
                await Payment.create({
                    sale_id: sale.id,
                    account_id: null,
                    amount: missingAmount,
                    payment_method: 'MIGRACION',
                    type: 'MIGRACION',
                    status: 'COMPLETED',
                    affects_balance: true,
                    affects_cash: false,
                    reference: null,
                    notes: 'Pago histórico generado por backfill financiero',
                    payment_date: sale.created_at || sale.createdAt || new Date(),
                    created_by: createdBy,
                    metadata: {
                        source: 'legacy_sale_paid_amount',
                        legacy_paid_amount: legacyPaidAmount,
                        existing_applied_amount: existingAppliedAmount,
                        generated_by: 'PaymentBackfillService'
                    }
                }, { transaction: t });

                await SaleStatusService.syncSaleStatuses(sale.id, t);
            });

            report.createdPayments += 1;
        }

        report.totalBackfilledAmount = Number(report.totalBackfilledAmount.toFixed(2));

        return report;
    }
}

module.exports = PaymentBackfillService;