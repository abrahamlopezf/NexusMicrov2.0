const SaleStatusService = require('../sales/SaleStatusService');
const CashService = require('../cash/CashService');
const OperationAuthorizationService = require('../authorizations/OperationAuthorizationService');
const { Payment, Sale, sequelize } = require('../../models');
const AppError = require('../../utils/AppError');

class PaymentService {
    static async registerPayment(paymentData, parentTransaction = null) {

        // Función interna transaccional abstracta
        const executeLogic = async (t) => {
            const {
                sale_id,
                account_id,
                amount,
                received_amount,
                payment_method,
                type,
                reference,
                notes,
                created_by
            } = paymentData;

            const parsedAmount = parseFloat(amount);

            const hasReceivedAmount =
                received_amount !== undefined &&
                received_amount !== null &&
                received_amount !== '';

            let parsedReceivedAmount = hasReceivedAmount
                ? parseFloat(received_amount)
                : null;

            let changeAmount = 0;

            if (!parsedAmount || parsedAmount <= 0) {
                throw new AppError('Payment amount must be greater than 0', 400);
            }

            // ═════════════════════════════════════════════════════
            // PAYMENT METHOD VALIDATION
            // ═════════════════════════════════════════════════════
            const allowedMethods = [
                'EFECTIVO',
                'TRANSFERENCIA',
                'TARJETA'
            ];

            if (!payment_method || !allowedMethods.includes(payment_method)) {
                throw new AppError(
                    `Invalid payment method. Allowed methods: ${allowedMethods.join(', ')}`,
                    400
                );
            }

            // ═════════════════════════════════════════════════════
            // PAYMENT TYPE VALIDATION
            // ═════════════════════════════════════════════════════
            // PARCIAL se mantiene por compatibilidad legacy.
            const allowedTypes = [
                'ANTICIPO',
                'ABONO',
                'LIQUIDACION',
                'PARCIAL',
                'RETENCION'
            ];

            const normalizedType = (type || 'ABONO').toUpperCase();

            if (!allowedTypes.includes(normalizedType)) {
                throw new AppError(
                    `Invalid payment type. Allowed types: ${allowedTypes.join(', ')}`,
                    400
                );
            }

            const sale = await Sale.findByPk(sale_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!sale) throw new AppError("Sale not found", 404);

            if (
                ['CANCELLED', 'REFUNDED'].includes(sale.financial_status) ||
                ['CANCELLED', 'REFUNDED'].includes(sale.status)
            ) {
                throw new AppError(
                    `Cannot register payment for this sale`,
                    400
                );
            }

            // Recalcular saldo antes de validar monto
            await SaleStatusService.syncSaleStatuses(sale.id, t);

            const refreshedSale = await Sale.findByPk(sale_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            const currentBalance = parseFloat(refreshedSale.balance || 0);

            if (parsedAmount > currentBalance + 0.01) {
                throw new AppError('Payment exceeds remaining balance', 400);
            }

            const isRetention = normalizedType === 'RETENCION';

            const affectsBalance = true;
            const affectsCash = !isRetention;

            if (isRetention && account_id) {
                throw new AppError('Retention payments should not be assigned to a cash/bank account', 400);
            }

            if (isRetention && parsedReceivedAmount !== null) {
                throw new AppError('received_amount does not apply to retention payments', 400);
            }

            if (payment_method === 'EFECTIVO' && affectsCash) {
                if (parsedReceivedAmount === null) {
                    parsedReceivedAmount = parsedAmount;
                }

                if (!parsedReceivedAmount || parsedReceivedAmount <= 0) {
                    throw new AppError('received_amount must be greater than 0 for cash payments', 400);
                }

                if (parsedReceivedAmount + 0.01 < parsedAmount) {
                    throw new AppError('received_amount cannot be less than payment amount', 400);
                }

                changeAmount = Number((parsedReceivedAmount - parsedAmount).toFixed(2));
            } else {
                if (parsedReceivedAmount !== null) {
                    throw new AppError('received_amount only applies to EFECTIVO payments', 400);
                }

                parsedReceivedAmount = null;
                changeAmount = 0;
            }

            if (payment_method === 'EFECTIVO' && affectsCash) {
                if (parsedReceivedAmount === null) {
                    parsedReceivedAmount = parsedAmount;
                }

                if (!parsedReceivedAmount || parsedReceivedAmount <= 0) {
                    throw new AppError('received_amount must be greater than 0 for cash payments', 400);
                }

                if (parsedReceivedAmount + 0.01 < parsedAmount) {
                    throw new AppError('received_amount cannot be less than payment amount', 400);
                }

                changeAmount = Number((parsedReceivedAmount - parsedAmount).toFixed(2));
            } else {
                if (parsedReceivedAmount !== null) {
                    throw new AppError('received_amount only applies to EFECTIVO payments', 400);
                }

                parsedReceivedAmount = null;
                changeAmount = 0;
            }

            if (isRetention && account_id) {
                throw new AppError('Retention payments should not be assigned to a cash/bank account', 400);
            }

            const payment = await Payment.create({
                sale_id,
                account_id: isRetention ? null : account_id,
                amount: parsedAmount,
                received_amount: parsedReceivedAmount,
                change_amount: changeAmount,
                payment_method,
                type: normalizedType,
                status: 'COMPLETED',
                affects_balance: affectsBalance,
                affects_cash: affectsCash,
                reference,
                notes,
                payment_date: new Date(),
                created_by,
                metadata: isRetention
                    ? {
                        reason: notes || 'Retención registrada en venta'
                    }
                    : null
            }, { transaction: t });

            if (payment.affects_cash === true) {
                await CashService.createIncomeFromPayment(payment, t);
            }

            await SaleStatusService.syncSaleStatuses(sale.id, t);

            return payment;
        };

        // Si existe un padre orquestador, adhiere a la suya
        if (parentTransaction) {
            return await executeLogic(parentTransaction);
        }

        // Si no existe, crea una nueva manejada y protegida auto-commit
        return await sequelize.transaction(async (t) => {
            return await executeLogic(t);
        });
    }

    static async getPaymentBySale(saleId) {
        const payments = await Payment.findAll({
            where: { sale_id: saleId },
            order: [['created_at', 'DESC']]
        });
        return payments;
    }

    static async getPayments(query = {}) {
        const payments = await Payment.findAll({
            order: [['created_at', 'DESC']],
            limit: parseInt(query.limit) || 50
        });
        return payments;
    }

    static async cancelPayment(paymentId, reason, userId = null, managerAuthorization = null) {
        return await sequelize.transaction(async (t) => {
            const payment = await Payment.findByPk(paymentId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!payment) {
                throw new AppError('Payment not found', 404);
            }

            if (payment.status === 'CANCELLED') {
                throw new AppError('Payment is already cancelled', 400);
            }

            if (!reason || !reason.trim()) {
                throw new AppError('Cancellation reason is required', 400);
            }

            const authorization = await OperationAuthorizationService.authorizeOperation({
                operationType: 'CANCEL_PAYMENT',
                targetType: 'Payment',
                targetId: payment.id,
                requestedBy: userId,
                reason,
                managerAuthorization,
                metadata: {
                    sale_id: payment.sale_id,
                    amount: payment.amount,
                    payment_method: payment.payment_method,
                    type: payment.type
                },
                transaction: t
            });

            await payment.update({
                status: 'CANCELLED',
                cancelled_at: new Date(),
                cancellation_reason: reason,
                updated_by: userId,
                metadata: {
                    ...(payment.metadata || {}),
                    cancellation: {
                        cancelled_at: new Date(),
                        cancelled_by: userId,
                        authorized_by: authorization.authorized_by,
                        authorization_id: authorization.id,
                        reason
                    }
                }
            }, { transaction: t });

            await CashService.cancelMovementByPayment(
                payment.id,
                reason,
                userId,
                t
            );

            await SaleStatusService.syncSaleStatuses(payment.sale_id, t);

            return payment;
        });
    }

    static async liquidateSale(saleId, paymentData = {}, userId = null) {
        return await sequelize.transaction(async (t) => {
            const sale = await Sale.findByPk(saleId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!sale) {
                throw new AppError('Sale not found', 404);
            }

            if (
                ['CANCELLED', 'REFUNDED'].includes(sale.financial_status) ||
                ['CANCELLED', 'REFUNDED'].includes(sale.status)
            ) {
                throw new AppError('Cannot liquidate this sale', 400);
            }

            // Recalcular antes de liquidar para evitar usar saldo viejo
            await SaleStatusService.syncSaleStatuses(sale.id, t);

            const refreshedSale = await Sale.findByPk(saleId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            const balance = parseFloat(refreshedSale.balance || 0);

            if (balance <= 0.01) {
                throw new AppError('Sale is already fully paid', 400);
            }

            if (!paymentData.payment_method) {
                throw new AppError('payment_method is required', 400);
            }

            return await this.registerPayment({
                sale_id: saleId,
                account_id: paymentData.account_id || null,
                amount: balance,
                received_amount: paymentData.received_amount || null,
                payment_method: paymentData.payment_method,
                type: 'LIQUIDACION',
                reference: paymentData.reference || null,
                notes: paymentData.notes || 'Liquidación final de venta',
                created_by: userId
            }, t);
        });
    }
}

module.exports = PaymentService;