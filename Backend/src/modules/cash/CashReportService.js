const { Op } = require('sequelize');

const {
    CashSession,
    CashMovement,
    Payment,
    Sale,
    Client,
    OperationAuthorization
} = require('../../models');

const AppError = require('../../utils/AppError');

class CashReportService {

    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static formatAuthorization(auth) {
        if (!auth) return null;

        return {
            id: auth.id,
            operation_type: auth.operation_type,
            target_type: auth.target_type,
            target_id: auth.target_id,
            status: auth.status,
            authorization_mode: auth.authorization_mode,
            requested_by: auth.requested_by,
            authorized_by: auth.authorized_by,
            reason: auth.reason,
            metadata: auth.metadata,
            authorized_at: auth.authorized_at
        };
    }

    static groupAuthorizationsByTarget(authorizations = []) {
        const map = {};

        for (const auth of authorizations) {
            const key = String(auth.target_id);

            if (!map[key]) {
                map[key] = [];
            }

            map[key].push(auth);
        }

        return map;
    }

    static getAuthorizationByOperation(authorizations = [], operationType) {
        return authorizations.find(auth => auth.operation_type === operationType) || null;
    }

    static getMovementSign(type) {
        const positiveTypes = ['INCOME', 'ADJUSTMENT_IN'];
        const negativeTypes = ['EXPENSE', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT_OUT'];

        if (positiveTypes.includes(type)) return 1;
        if (negativeTypes.includes(type)) return -1;

        return 0;
    }

    static buildEmptyTotals(openingAmount = 0) {
        return {
            opening_amount: this.toNumber(openingAmount),
            income: 0,
            expense: 0,
            withdrawal: 0,
            refund: 0,
            adjustment_in: 0,
            adjustment_out: 0,
            net_movements: 0,
            expected_closing_amount: this.toNumber(openingAmount)
        };
    }

    static async getSessionReport(sessionId) {
        const session = await CashSession.findByPk(sessionId);

        if (!session) {
            throw new AppError('Cash session not found', 404);
        }

        const movements = await CashMovement.findAll({
            where: {
                cash_session_id: session.id
            },
            include: [
                {
                    model: Payment,
                    as: 'payment',
                    required: false,
                    include: [
                        {
                            model: Sale,
                            as: 'sale',
                            required: false,
                            include: [
                                {
                                    model: Client,
                                    as: 'client',
                                    required: false
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'ASC']]
        });

        const movementIds = movements.map(movement => String(movement.id));

        const movementAuthorizations = movementIds.length > 0
            ? await OperationAuthorization.findAll({
                where: {
                    target_type: 'CashMovement',
                    target_id: {
                        [Op.in]: movementIds
                    }
                },
                order: [['authorized_at', 'ASC']]
            })
            : [];

        const sessionAuthorizations = await OperationAuthorization.findAll({
            where: {
                target_type: 'CashSession',
                target_id: String(session.id)
            },
            order: [['authorized_at', 'ASC']]
        });

        const movementAuthorizationMap = this.groupAuthorizationsByTarget(movementAuthorizations);

        const sessionAuthorizationData = {
            close_with_difference: this.formatAuthorization(
                this.getAuthorizationByOperation(
                    sessionAuthorizations,
                    'CLOSE_CASH_SESSION_WITH_DIFFERENCE'
                )
            ),
            all: sessionAuthorizations.map(auth => this.formatAuthorization(auth))
        };

        const activeMovements = movements.filter(m => m.status !== 'CANCELLED');
        const cancelledMovements = movements.filter(m => m.status === 'CANCELLED');

        const totals = this.buildEmptyTotals(session.opening_amount);
        const byPaymentMethod = {};
        const bySource = {};
        const byMovementType = {};

        for (const movement of activeMovements) {
            const amount = this.toNumber(movement.amount);
            const sign = this.getMovementSign(movement.movement_type);
            const net = this.toNumber(amount * sign);

            totals.net_movements += net;

            if (movement.movement_type === 'INCOME') totals.income += amount;
            if (movement.movement_type === 'EXPENSE') totals.expense += amount;
            if (movement.movement_type === 'WITHDRAWAL') totals.withdrawal += amount;
            if (movement.movement_type === 'REFUND') totals.refund += amount;
            if (movement.movement_type === 'ADJUSTMENT_IN') totals.adjustment_in += amount;
            if (movement.movement_type === 'ADJUSTMENT_OUT') totals.adjustment_out += amount;

            const source = movement.source || 'UNKNOWN';
            if (!bySource[source]) {
                bySource[source] = {
                    count: 0,
                    gross_amount: 0,
                    net_amount: 0
                };
            }

            bySource[source].count += 1;
            bySource[source].gross_amount += amount;
            bySource[source].net_amount += net;

            const movementType = movement.movement_type || 'UNKNOWN';
            if (!byMovementType[movementType]) {
                byMovementType[movementType] = {
                    count: 0,
                    gross_amount: 0,
                    net_amount: 0
                };
            }

            byMovementType[movementType].count += 1;
            byMovementType[movementType].gross_amount += amount;
            byMovementType[movementType].net_amount += net;

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
                }

                if (sign < 0) {
                    byPaymentMethod[movement.payment_method].expense += amount;
                }

                byPaymentMethod[movement.payment_method].net += net;
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

        Object.keys(bySource).forEach(source => {
            bySource[source].gross_amount = this.toNumber(bySource[source].gross_amount);
            bySource[source].net_amount = this.toNumber(bySource[source].net_amount);
        });

        Object.keys(byMovementType).forEach(type => {
            byMovementType[type].gross_amount = this.toNumber(byMovementType[type].gross_amount);
            byMovementType[type].net_amount = this.toNumber(byMovementType[type].net_amount);
        });

        const differenceAmount = session.actual_closing_amount !== null
            ? this.toNumber(parseFloat(session.actual_closing_amount) - totals.expected_closing_amount)
            : null;

        return {
            session: {
                id: session.id,
                status: session.status,
                opened_by: session.opened_by,
                closed_by: session.closed_by,
                opened_at: session.opened_at,
                closed_at: session.closed_at,
                opening_amount: this.toNumber(session.opening_amount),
                expected_closing_amount: totals.expected_closing_amount,
                actual_closing_amount: session.actual_closing_amount !== null
                    ? this.toNumber(session.actual_closing_amount)
                    : null,
                difference_amount: differenceAmount,
                notes: session.notes,
                closing_notes: session.closing_notes,
                authorizations: sessionAuthorizationData
            },

            totals,

            breakdown: {
                by_payment_method: byPaymentMethod,
                by_source: bySource,
                by_movement_type: byMovementType
            },

            movements: {
                active: activeMovements.map(movement => {
                    const authorizations = movementAuthorizationMap[String(movement.id)] || [];

                    return {
                        id: movement.id,
                        cash_session_id: movement.cash_session_id,
                        payment_id: movement.payment_id,
                        movement_type: movement.movement_type,
                        source: movement.source,
                        payment_method: movement.payment_method,
                        amount: this.toNumber(movement.amount),
                        net_amount: this.toNumber(
                            this.toNumber(movement.amount) * this.getMovementSign(movement.movement_type)
                        ),
                        description: movement.description,
                        reference: movement.reference,
                        status: movement.status,
                        created_by: movement.created_by,
                        created_at: movement.createdAt,

                        authorizations: {
                            creation: this.formatAuthorization(
                                authorizations.find(auth => auth.operation_type?.startsWith('CREATE_CASH_'))
                            ),
                            cancellation: this.formatAuthorization(
                                this.getAuthorizationByOperation(authorizations, 'CANCEL_CASH_MOVEMENT')
                            ),
                            all: authorizations.map(auth => this.formatAuthorization(auth))
                        },

                        payment: movement.payment ? {
                            id: movement.payment.id,
                            sale_id: movement.payment.sale_id,
                            amount: this.toNumber(movement.payment.amount),
                            received_amount: movement.payment.received_amount !== null && movement.payment.received_amount !== undefined
                                ? this.toNumber(movement.payment.received_amount)
                                : null,
                            change_amount: this.toNumber(movement.payment.change_amount),
                            payment_method: movement.payment.payment_method,
                            type: movement.payment.type,
                            sale: movement.payment.sale ? {
                                id: movement.payment.sale.id,
                                sale_number: movement.payment.sale.sale_number,
                                client: movement.payment.sale.client ? {
                                    id: movement.payment.sale.client.id,
                                    name: movement.payment.sale.client.name
                                } : null
                            } : null
                        } : null
                    };
                }),

                cancelled: cancelledMovements.map(movement => {
                    const authorizations = movementAuthorizationMap[String(movement.id)] || [];

                    return {
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
                        created_at: movement.createdAt,

                        authorizations: {
                            creation: this.formatAuthorization(
                                authorizations.find(auth => auth.operation_type?.startsWith('CREATE_CASH_'))
                            ),
                            cancellation: this.formatAuthorization(
                                this.getAuthorizationByOperation(authorizations, 'CANCEL_CASH_MOVEMENT')
                            ),
                            all: authorizations.map(auth => this.formatAuthorization(auth))
                        }
                    };
                })
            }
        };
    }
}

module.exports = CashReportService;