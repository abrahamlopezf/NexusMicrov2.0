const { Op } = require('sequelize');
const { Payment, Sale, Client, SaleTicket, CashSession, OperationAuthorization } = require('../../models');

class PosDailyReportService {
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

    static getDateRange(dateInput) {
        const date = dateInput || new Date().toISOString().slice(0, 10);

        const start = new Date(`${date}T00:00:00.000-06:00`);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        return {
            date,
            start,
            end
        };
    }

    static buildPaymentBreakdown(payments) {
        const byMethod = {};
        const byType = {};

        let cashPaid = 0;
        let retainedAmount = 0;
        let migratedAmount = 0;
        let totalApplied = 0;

        for (const payment of payments) {
            const amount = this.toNumber(payment.amount);

            if (!byMethod[payment.payment_method]) {
                byMethod[payment.payment_method] = {
                    count: 0,
                    amount: 0
                };
            }

            byMethod[payment.payment_method].count += 1;
            byMethod[payment.payment_method].amount += amount;

            if (!byType[payment.type]) {
                byType[payment.type] = {
                    count: 0,
                    amount: 0
                };
            }

            byType[payment.type].count += 1;
            byType[payment.type].amount += amount;

            if (payment.affects_balance !== false) {
                totalApplied += amount;
            }

            if (payment.type === 'RETENCION') {
                retainedAmount += amount;
            } else if (payment.type === 'MIGRACION') {
                migratedAmount += amount;
            } else if (payment.affects_cash !== false) {
                cashPaid += amount;
            }
        }

        Object.keys(byMethod).forEach(method => {
            byMethod[method].amount = this.toNumber(byMethod[method].amount);
        });

        Object.keys(byType).forEach(type => {
            byType[type].amount = this.toNumber(byType[type].amount);
        });

        return {
            cash_paid: this.toNumber(cashPaid),
            retained_amount: this.toNumber(retainedAmount),
            migrated_amount: this.toNumber(migratedAmount),
            total_applied: this.toNumber(totalApplied),
            by_method: byMethod,
            by_type: byType
        };
    }

    static async getDailyReport(query = {}) {
        const { date, start, end } = this.getDateRange(query.date);

        const payments = await Payment.findAll({
            where: {
                status: 'COMPLETED',
                payment_date: {
                    [Op.gte]: start,
                    [Op.lt]: end
                }
            },
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
            ],
            order: [['payment_date', 'ASC']]
        });

        const cancelledPayments = await Payment.findAll({
            where: {
                status: 'CANCELLED',
                cancelled_at: {
                    [Op.gte]: start,
                    [Op.lt]: end
                }
            },
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
            ],
            order: [['cancelled_at', 'ASC']]
        });

        const salesCreated = await Sale.findAll({
            where: {
                created_at: {
                    [Op.gte]: start,
                    [Op.lt]: end
                }
            },
            include: [
                {
                    model: Client,
                    as: 'client',
                    required: false
                }
            ],
            order: [['created_at', 'ASC']]
        });

        const ticketsIssued = await SaleTicket.findAll({
            where: {
                issued_at: {
                    [Op.gte]: start,
                    [Op.lt]: end
                }
            },
            order: [['issued_at', 'ASC']]
        });

        const ticketsCancelled = await SaleTicket.findAll({
            where: {
                status: 'CANCELLED',
                cancelled_at: {
                    [Op.gte]: start,
                    [Op.lt]: end
                }
            },
            order: [['cancelled_at', 'ASC']]
        });

        const ticketsCurrentlyIssued = ticketsIssued.filter(ticket => ticket.status !== 'CANCELLED');

        const ticketsIssuedAndCancelledSameDay = ticketsIssued.filter(ticket => {
            if (ticket.status !== 'CANCELLED' || !ticket.cancelled_at) return false;

            const cancelledAt = new Date(ticket.cancelled_at);

            return cancelledAt >= start && cancelledAt < end;
        });

        const cashSessions = await CashSession.findAll({
            where: {
                [Op.or]: [
                    {
                        opened_at: {
                            [Op.gte]: start,
                            [Op.lt]: end
                        }
                    },
                    {
                        closed_at: {
                            [Op.gte]: start,
                            [Op.lt]: end
                        }
                    }
                ]
            },
            order: [['opened_at', 'ASC']]
        });

        const cancelledPaymentIds = cancelledPayments.map(payment => String(payment.id));
        const cancelledTicketIds = ticketsCancelled.map(ticket => String(ticket.id));
        const cashSessionIds = cashSessions.map(session => String(session.id));

        const paymentAuthorizations = cancelledPaymentIds.length > 0
            ? await OperationAuthorization.findAll({
                where: {
                    target_type: 'Payment',
                    target_id: {
                        [Op.in]: cancelledPaymentIds
                    }
                },
                order: [['authorized_at', 'ASC']]
            })
            : [];

        const ticketAuthorizations = cancelledTicketIds.length > 0
            ? await OperationAuthorization.findAll({
                where: {
                    target_type: 'SaleTicket',
                    target_id: {
                        [Op.in]: cancelledTicketIds
                    }
                },
                order: [['authorized_at', 'ASC']]
            })
            : [];

        const cashSessionAuthorizations = cashSessionIds.length > 0
            ? await OperationAuthorization.findAll({
                where: {
                    target_type: 'CashSession',
                    target_id: {
                        [Op.in]: cashSessionIds
                    }
                },
                order: [['authorized_at', 'ASC']]
            })
            : [];

        const paymentAuthorizationMap = this.groupAuthorizationsByTarget(paymentAuthorizations);
        const ticketAuthorizationMap = this.groupAuthorizationsByTarget(ticketAuthorizations);
        const cashSessionAuthorizationMap = this.groupAuthorizationsByTarget(cashSessionAuthorizations);

        const paymentBreakdown = this.buildPaymentBreakdown(payments);

        const salesTotal = salesCreated.reduce((sum, sale) => {
            return sum + parseFloat(sale.total || 0);
        }, 0);

        const salesPaid = salesCreated.filter(sale => sale.financial_status === 'PAID');
        const salesPartial = salesCreated.filter(sale => sale.financial_status === 'PARTIAL');
        const salesPending = salesCreated.filter(sale => {
            return sale.financial_status === 'PENDING' || sale.financial_status === 'UNPAID';
        });

        return {
            period: {
                date,
                start,
                end,
                timezone: 'America/Mexico_City'
            },

            summary: {
                sales_created_count: salesCreated.length,
                sales_created_total: this.toNumber(salesTotal),

                payments_count: payments.length,
                payments_cash_paid: paymentBreakdown.cash_paid,
                payments_retained_amount: paymentBreakdown.retained_amount,
                payments_migrated_amount: paymentBreakdown.migrated_amount,
                payments_total_applied: paymentBreakdown.total_applied,

                cancelled_payments_count: cancelledPayments.length,
                cancelled_payments_amount: this.toNumber(
                    cancelledPayments.reduce((sum, payment) => {
                        return sum + parseFloat(payment.amount || 0);
                    }, 0)
                ),

                tickets_issued_total_count: ticketsIssued.length,
                tickets_currently_issued_count: ticketsCurrentlyIssued.length,
                tickets_cancelled_count: ticketsCancelled.length,
                tickets_issued_and_cancelled_same_day_count: ticketsIssuedAndCancelledSameDay.length,

                // Legacy aliases. Mantener temporalmente para no romper frontend existente.
                tickets_issued_count: ticketsIssued.length,

                cash_sessions_count: cashSessions.length,
                cash_sessions_open_count: cashSessions.filter(s => s.status === 'OPEN').length,
                cash_sessions_closed_count: cashSessions.filter(s => s.status === 'CLOSED').length
            },

            payments: {
                breakdown: paymentBreakdown,

                list: payments.map(payment => ({
                    id: payment.id,
                    sale_id: payment.sale_id,
                    sale_number: payment.sale?.sale_number || null,
                    client: payment.sale?.client ? {
                        id: payment.sale.client.id,
                        name: payment.sale.client.name
                    } : null,
                    amount: this.toNumber(payment.amount),
                    received_amount: payment.received_amount !== null && payment.received_amount !== undefined
                        ? this.toNumber(payment.received_amount)
                        : null,
                    change_amount: this.toNumber(payment.change_amount),
                    payment_method: payment.payment_method,
                    type: payment.type,
                    affects_cash: payment.affects_cash,
                    affects_balance: payment.affects_balance,
                    reference: payment.reference,
                    notes: payment.notes,
                    payment_date: payment.payment_date,
                    created_by: payment.created_by
                })),

                cancelled: cancelledPayments.map(payment => {
                    const authorizations = paymentAuthorizationMap[String(payment.id)] || [];

                    return {
                        id: payment.id,
                        sale_id: payment.sale_id,
                        sale_number: payment.sale?.sale_number || null,
                        client: payment.sale?.client ? {
                            id: payment.sale.client.id,
                            name: payment.sale.client.name
                        } : null,
                        amount: this.toNumber(payment.amount),
                        received_amount: payment.received_amount !== null && payment.received_amount !== undefined
                            ? this.toNumber(payment.received_amount)
                            : null,
                        change_amount: this.toNumber(payment.change_amount),
                        payment_method: payment.payment_method,
                        type: payment.type,
                        cancellation_reason: payment.cancellation_reason,
                        cancelled_at: payment.cancelled_at,
                        updated_by: payment.updated_by,

                        authorization: this.formatAuthorization(
                            this.getAuthorizationByOperation(authorizations, 'CANCEL_PAYMENT')
                        ),
                        authorizations: authorizations.map(auth => this.formatAuthorization(auth))
                    };
                })
            },

            sales: {
                created: salesCreated.map(sale => ({
                    id: sale.id,
                    sale_number: sale.sale_number,
                    client: sale.client ? {
                        id: sale.client.id,
                        name: sale.client.name
                    } : null,
                    status: sale.status,
                    financial_status: sale.financial_status,
                    fulfillment_status: sale.fulfillment_status,
                    total: this.toNumber(sale.total),
                    paid_amount: this.toNumber(sale.paid_amount),
                    retained_amount: this.toNumber(sale.retained_amount),
                    balance: this.toNumber(sale.balance),
                    created_at: sale.createdAt
                })),

                counters: {
                    paid: salesPaid.length,
                    partial: salesPartial.length,
                    pending_or_unpaid: salesPending.length
                }
            },

            tickets: {
                issued_total: ticketsIssued.map(ticket => ({
                    id: ticket.id,
                    sale_id: ticket.sale_id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at,
                    cancelled_at: ticket.cancelled_at || null
                })),

                currently_issued: ticketsCurrentlyIssued.map(ticket => ({
                    id: ticket.id,
                    sale_id: ticket.sale_id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at
                })),

                issued_and_cancelled_same_day: ticketsIssuedAndCancelledSameDay.map(ticket => ({
                    id: ticket.id,
                    sale_id: ticket.sale_id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at,
                    cancelled_at: ticket.cancelled_at,
                    cancellation_reason: ticket.cancellation_reason
                })),

                cancelled: ticketsCancelled.map(ticket => {
                    const authorizations = ticketAuthorizationMap[String(ticket.id)] || [];

                    return {
                        id: ticket.id,
                        sale_id: ticket.sale_id,
                        ticket_number: ticket.ticket_number,
                        ticket_type: ticket.ticket_type,
                        status: ticket.status,
                        issued_by: ticket.issued_by,
                        issued_at: ticket.issued_at,
                        cancelled_at: ticket.cancelled_at,
                        cancellation_reason: ticket.cancellation_reason,

                        authorization: this.formatAuthorization(
                            this.getAuthorizationByOperation(authorizations, 'CANCEL_TICKET')
                        ),
                        authorizations: authorizations.map(auth => this.formatAuthorization(auth))
                    };
                }),

                // Legacy alias temporal
                issued: ticketsIssued.map(ticket => ({
                    id: ticket.id,
                    sale_id: ticket.sale_id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at
                }))
            },

            cash_sessions: cashSessions.map(session => {
                const authorizations = cashSessionAuthorizationMap[String(session.id)] || [];

                return {
                    id: session.id,
                    status: session.status,
                    opened_by: session.opened_by,
                    closed_by: session.closed_by,
                    opening_amount: this.toNumber(session.opening_amount),
                    expected_closing_amount: this.toNumber(session.expected_closing_amount),
                    actual_closing_amount: session.actual_closing_amount !== null
                        ? this.toNumber(session.actual_closing_amount)
                        : null,
                    difference_amount: session.difference_amount !== null
                        ? this.toNumber(session.difference_amount)
                        : null,
                    opened_at: session.opened_at,
                    closed_at: session.closed_at,

                    authorization: this.formatAuthorization(
                        this.getAuthorizationByOperation(
                            authorizations,
                            'CLOSE_CASH_SESSION_WITH_DIFFERENCE'
                        )
                    ),
                    authorizations: authorizations.map(auth => this.formatAuthorization(auth))
                };
            })
        };
    }
}

module.exports = PosDailyReportService;