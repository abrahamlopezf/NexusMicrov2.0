const { CashSession, CashMovement, Payment, sequelize } = require('../../models');
const AppError = require('../../utils/AppError');
const OperationAuthorizationService = require('../authorizations/OperationAuthorizationService');

class CashService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static movementRequiresAuthorization(movementType, amount) {
        const sensitiveTypes = [
            'WITHDRAWAL',
            'ADJUSTMENT_IN',
            'ADJUSTMENT_OUT'
        ];

        if (sensitiveTypes.includes(movementType)) {
            return true;
        }

        // Egresos mayores requieren autorización.
        if (movementType === 'EXPENSE' && Number(amount || 0) > 200) {
            return true;
        }

        return false;
    }

    static getMovementOperationType(movementType) {
        return `CREATE_CASH_${movementType}`;
    }

    static getMovementSign(type) {
        const positiveTypes = ['INCOME', 'ADJUSTMENT_IN'];
        const negativeTypes = ['EXPENSE', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT_OUT'];

        if (positiveTypes.includes(type)) return 1;
        if (negativeTypes.includes(type)) return -1;

        return 0;
    }

    static async getOpenSession(userId = null, transaction = null) {
        const where = { status: 'OPEN' };

        if (userId) {
            where.opened_by = userId;
        }

        return await CashSession.findOne({
            where,
            order: [['opened_at', 'DESC']],
            transaction
        });
    }

    static async calculateSessionSummary(sessionId, transaction = null) {
        const session = await CashSession.findByPk(sessionId, {
            transaction
        });

        if (!session) {
            throw new AppError('Cash session not found', 404);
        }

        const movements = await CashMovement.findAll({
            where: {
                cash_session_id: session.id
            },
            order: [['created_at', 'ASC']],
            transaction
        });

        const activeMovements = movements.filter(m => m.status !== 'CANCELLED');
        const cancelledMovements = movements.filter(m => m.status === 'CANCELLED');

        const totals = {
            opening_amount: this.toNumber(session.opening_amount),
            income: 0,
            expense: 0,
            withdrawal: 0,
            refund: 0,
            adjustment_in: 0,
            adjustment_out: 0,
            net_movements: 0,
            expected_closing_amount: 0
        };

        const byPaymentMethod = {};

        for (const movement of activeMovements) {
            const amount = this.toNumber(movement.amount);
            const sign = this.getMovementSign(movement.movement_type);

            totals.net_movements += amount * sign;

            if (movement.movement_type === 'INCOME') totals.income += amount;
            if (movement.movement_type === 'EXPENSE') totals.expense += amount;
            if (movement.movement_type === 'WITHDRAWAL') totals.withdrawal += amount;
            if (movement.movement_type === 'REFUND') totals.refund += amount;
            if (movement.movement_type === 'ADJUSTMENT_IN') totals.adjustment_in += amount;
            if (movement.movement_type === 'ADJUSTMENT_OUT') totals.adjustment_out += amount;

            if (movement.payment_method) {
                if (!byPaymentMethod[movement.payment_method]) {
                    byPaymentMethod[movement.payment_method] = {
                        income: 0,
                        expense: 0,
                        net: 0
                    };
                }

                if (sign > 0) {
                    byPaymentMethod[movement.payment_method].income += amount;
                } else if (sign < 0) {
                    byPaymentMethod[movement.payment_method].expense += amount;
                }

                byPaymentMethod[movement.payment_method].net += amount * sign;
            }
        }

        totals.income = this.toNumber(totals.income);
        totals.expense = this.toNumber(totals.expense);
        totals.withdrawal = this.toNumber(totals.withdrawal);
        totals.refund = this.toNumber(totals.refund);
        totals.adjustment_in = this.toNumber(totals.adjustment_in);
        totals.adjustment_out = this.toNumber(totals.adjustment_out);
        totals.net_movements = this.toNumber(totals.net_movements);
        totals.expected_closing_amount = this.toNumber(
            totals.opening_amount + totals.net_movements
        );

        Object.keys(byPaymentMethod).forEach(method => {
            byPaymentMethod[method].income = this.toNumber(byPaymentMethod[method].income);
            byPaymentMethod[method].expense = this.toNumber(byPaymentMethod[method].expense);
            byPaymentMethod[method].net = this.toNumber(byPaymentMethod[method].net);
        });

        return {
            session: {
                id: session.id,
                status: session.status,
                opening_amount: this.toNumber(session.opening_amount),
                expected_closing_amount: this.toNumber(session.expected_closing_amount),
                actual_closing_amount: session.actual_closing_amount !== null
                    ? this.toNumber(session.actual_closing_amount)
                    : null,
                difference_amount: session.difference_amount !== null
                    ? this.toNumber(session.difference_amount)
                    : null,
                opened_by: session.opened_by,
                closed_by: session.closed_by,
                opened_at: session.opened_at,
                closed_at: session.closed_at,
                notes: session.notes,
                closing_notes: session.closing_notes,
                created_at: session.createdAt,
                updated_at: session.updatedAt
            },

            totals,

            by_payment_method: byPaymentMethod,

            movements: {
                active: activeMovements.map(movement => ({
                    id: movement.id,
                    cash_session_id: movement.cash_session_id,
                    payment_id: movement.payment_id,
                    movement_type: movement.movement_type,
                    source: movement.source,
                    payment_method: movement.payment_method,
                    amount: this.toNumber(movement.amount),
                    description: movement.description,
                    reference: movement.reference,
                    status: movement.status,
                    created_by: movement.created_by,
                    created_at: movement.createdAt
                })),

                cancelled: cancelledMovements.map(movement => ({
                    id: movement.id,
                    cash_session_id: movement.cash_session_id,
                    payment_id: movement.payment_id,
                    movement_type: movement.movement_type,
                    source: movement.source,
                    payment_method: movement.payment_method,
                    amount: this.toNumber(movement.amount),
                    description: movement.description,
                    reference: movement.reference,
                    status: movement.status,
                    cancelled_at: movement.cancelled_at,
                    cancellation_reason: movement.cancellation_reason,
                    created_by: movement.created_by,
                    created_at: movement.createdAt
                }))
            }
        };
    }

    static async openSession(data = {}, userId = null) {
        return await sequelize.transaction(async (t) => {
            if (!userId) {
                throw new AppError('User is required to open cash session', 400);
            }

            const existingOpenSession = await this.getOpenSession(userId, t);

            if (existingOpenSession) {
                throw new AppError('There is already an open cash session', 400);
            }

            const openingAmount = this.toNumber(data.opening_amount);

            if (openingAmount < 0) {
                throw new AppError('Opening amount cannot be negative', 400);
            }

            const session = await CashSession.create({
                status: 'OPEN',
                opening_amount: openingAmount,
                expected_closing_amount: openingAmount,
                opened_by: userId,
                opened_at: new Date(),
                notes: data.notes || null
            }, { transaction: t, userId });

            return await this.calculateSessionSummary(session.id, t);
        });
    }

    static async getCurrentSession(userId = null) {
        if (!userId) {
            throw new AppError('User is required to get current cash session', 400);
        }

        const session = await this.getOpenSession(userId);

        if (!session) {
            return {
                has_open_session: false,
                session: null,
                totals: null,
                movements: {
                    active: [],
                    cancelled: []
                }
            };
        }

        const summary = await this.calculateSessionSummary(session.id);

        return {
            has_open_session: true,
            ...summary
        };
    }

    static async closeSession(data = {}, userId = null) {
        return await sequelize.transaction(async (t) => {
            if (!userId) {
                throw new AppError('User is required to close cash session', 400);
            }

            const session = await this.getOpenSession(userId, t);

            if (!session) {
                throw new AppError('There is no open cash session to close', 404);
            }

            if (session.status !== 'OPEN') {
                throw new AppError('Cash session is not open', 400);
            }

            const actualClosingAmount = this.toNumber(data.actual_closing_amount);

            if (actualClosingAmount < 0) {
                throw new AppError('Actual closing amount cannot be negative', 400);
            }

            const summary = await this.calculateSessionSummary(session.id, t);
            const expectedClosingAmount = this.toNumber(summary.totals.expected_closing_amount);
            const differenceAmount = this.toNumber(actualClosingAmount - expectedClosingAmount);

            let authorization = null;

            if (Math.abs(differenceAmount) > 0.01) {
                authorization = await OperationAuthorizationService.authorizeOperation({
                    operationType: 'CLOSE_CASH_SESSION_WITH_DIFFERENCE',
                    targetType: 'CashSession',
                    targetId: session.id,
                    requestedBy: userId,
                    reason: data.authorization_reason || data.closing_notes || 'Cierre de caja con diferencia',
                    managerAuthorization: data.manager_authorization || null,
                    metadata: {
                        cash_session_id: session.id,
                        expected_closing_amount: expectedClosingAmount,
                        actual_closing_amount: actualClosingAmount,
                        difference_amount: differenceAmount
                    },
                    transaction: t
                });
            }

            await session.update({
                status: 'CLOSED',
                expected_closing_amount: expectedClosingAmount,
                actual_closing_amount: actualClosingAmount,
                difference_amount: differenceAmount,
                closed_by: userId,
                closed_at: new Date(),
                closing_notes: data.closing_notes || null
            }, { transaction: t, userId });

            const finalSummary = await this.calculateSessionSummary(session.id, t);

            return {
                ...finalSummary,
                authorization
            };
        });
    }

    static async refreshExpectedAmount(sessionId, transaction = null) {
        const summary = await this.calculateSessionSummary(sessionId, transaction);

        await CashSession.update({
            expected_closing_amount: summary.totals.expected_closing_amount
        }, {
            where: { id: sessionId },
            transaction
        });

        return summary;
    }

    static async createIncomeFromPayment(payment, transaction = null) {
        if (!payment) {
            throw new AppError('Payment is required to create cash movement', 400);
        }

        if (payment.affects_cash === false) {
            return null;
        }

        if (payment.status === 'CANCELLED') {
            return null;
        }

        const existingMovement = await CashMovement.findOne({
            where: {
                payment_id: payment.id,
                source: 'PAYMENT',
                status: 'ACTIVE'
            },
            transaction
        });

        if (existingMovement) {
            return existingMovement;
        }

        if (!payment.created_by) {
            throw new AppError('Payment user is required to create cash movement', 400);
        }

        const session = await this.getOpenSession(payment.created_by, transaction);

        if (!session) {
            throw new AppError('No open cash session. Open cash before registering payments.', 400);
        }

        let description = `Ingreso por ${payment.type || 'PAGO'} de venta #${payment.sale_id}`;

        if (
            payment.payment_method === 'EFECTIVO' &&
            parseFloat(payment.change_amount || 0) > 0
        ) {
            description += ` | Recibido: ${payment.received_amount} | Cambio: ${payment.change_amount}`;
        }

        const movement = await CashMovement.create({
            cash_session_id: session.id,
            payment_id: payment.id,
            movement_type: 'INCOME',
            source: 'PAYMENT',
            payment_method: payment.payment_method,
            amount: payment.amount,
            description,
            reference: payment.reference,
            status: 'ACTIVE',
            created_by: payment.created_by || null
        }, { transaction });

        await this.refreshExpectedAmount(session.id, transaction);

        return movement;
    }

    static async cancelMovementByPayment(paymentId, reason, userId = null, transaction = null) {
        const movement = await CashMovement.findOne({
            where: {
                payment_id: paymentId,
                source: 'PAYMENT',
                status: 'ACTIVE'
            },
            transaction
        });

        if (!movement) {
            return null;
        }

        const session = await CashSession.findByPk(movement.cash_session_id, {
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
        });

        if (!session) {
            throw new AppError('Cash session not found for payment movement', 404);
        }

        if (session.status !== 'OPEN') {
            throw new AppError(
                'Cannot cancel payment movement from a closed cash session. Use refund/adjustment workflow.',
                400
            );
        }

        await movement.update({
            status: 'CANCELLED',
            cancelled_at: new Date(),
            cancellation_reason: reason || 'Payment cancelled'
        }, { transaction });

        await this.refreshExpectedAmount(movement.cash_session_id, transaction);

        return movement;
    }

    static async createManualMovement(data = {}, userId = null) {
        return await sequelize.transaction(async (t) => {
            if (!userId) {
                throw new AppError('User is required to create cash movement', 400);
            }

            const session = await this.getOpenSession(userId, t);

            if (!session) {
                throw new AppError('There is no open cash session', 404);
            }

            const allowedTypes = [
                'EXPENSE',
                'WITHDRAWAL',
                'ADJUSTMENT_IN',
                'ADJUSTMENT_OUT'
            ];

            const movementType = String(data.movement_type || '').toUpperCase();

            if (!allowedTypes.includes(movementType)) {
                throw new AppError(
                    `Invalid movement type. Allowed types: ${allowedTypes.join(', ')}`,
                    400
                );
            }

            const amount = this.toNumber(data.amount);

            if (!amount || amount <= 0) {
                throw new AppError('Amount must be greater than 0', 400);
            }

            if (!data.description || !data.description.trim()) {
                throw new AppError('Description is required', 400);
            }

            let authorization = null;

            const requiresAuthorization = this.movementRequiresAuthorization(
                movementType,
                amount
            );

            if (requiresAuthorization) {
                authorization = await OperationAuthorizationService.authorizeOperation({
                    operationType: this.getMovementOperationType(movementType),
                    targetType: 'CashMovement',
                    targetId: null,
                    requestedBy: userId,
                    reason: data.authorization_reason || data.reason || data.description,
                    managerAuthorization: data.manager_authorization || null,
                    metadata: {
                        cash_session_id: session.id,
                        movement_type: movementType,
                        amount,
                        payment_method: data.payment_method || null,
                        description: data.description,
                        reference: data.reference || null
                    },
                    transaction: t
                });
            }

            const movement = await CashMovement.create({
                cash_session_id: session.id,
                payment_id: null,
                movement_type: movementType,
                source: 'MANUAL',
                payment_method: data.payment_method || null,
                amount,
                description: data.description,
                reference: data.reference || null,
                status: 'ACTIVE',
                created_by: userId
            }, { transaction: t, userId });

            if (authorization) {
                await authorization.update({
                    target_id: String(movement.id)
                }, { transaction: t, userId });
            }

            const summary = await this.refreshExpectedAmount(session.id, t);

            return {
                movement,
                authorization,
                current_session: summary
            };
        });
    }

    static async cancelManualMovement(movementId, reason, userId = null, managerAuthorization = null) {
        return await sequelize.transaction(async (t) => {
            if (!userId) {
                throw new AppError('User is required to cancel cash movement', 400);
            }

            const movement = await CashMovement.findByPk(movementId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!movement) {
                throw new AppError('Cash movement not found', 404);
            }

            if (movement.status === 'CANCELLED') {
                throw new AppError('Cash movement is already cancelled', 400);
            }

            if (movement.source !== 'MANUAL') {
                throw new AppError(
                    'Only manual cash movements can be cancelled here. Payment movements must be cancelled from payments.',
                    400
                );
            }

            if (!reason || !reason.trim()) {
                throw new AppError('Cancellation reason is required', 400);
            }

            const session = await CashSession.findByPk(movement.cash_session_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!session) {
                throw new AppError('Cash session not found', 404);
            }

            if (session.status !== 'OPEN') {
                throw new AppError('Cannot cancel movements from a closed cash session', 400);
            }

            const authorization = await OperationAuthorizationService.authorizeOperation({
                operationType: 'CANCEL_CASH_MOVEMENT',
                targetType: 'CashMovement',
                targetId: movement.id,
                requestedBy: userId,
                reason,
                managerAuthorization,
                metadata: {
                    cash_session_id: session.id,
                    movement_type: movement.movement_type,
                    amount: movement.amount,
                    payment_method: movement.payment_method,
                    description: movement.description,
                    reference: movement.reference
                },
                transaction: t
            });

            await movement.update({
                status: 'CANCELLED',
                cancelled_at: new Date(),
                cancellation_reason: reason
            }, { transaction: t, userId });

            const summary = await this.refreshExpectedAmount(session.id, t);

            return {
                movement,
                authorization,
                current_session: summary
            };
        });
    }
}

module.exports = CashService;