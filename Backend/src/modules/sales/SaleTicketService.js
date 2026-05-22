const { Sale, SaleItem, Client, Product, Payment, Account, SaleTicket, sequelize } = require('../../models');
const AppError = require('../../utils/AppError');
const OperationAuthorizationService = require('../authorizations/OperationAuthorizationService');

class SaleTicketService {
    static async getTicketData(saleId) {
        const sale = await Sale.findByPk(saleId, {
            include: [
                {
                    model: Client,
                    as: 'client'
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments',
                    include: [
                        {
                            model: Account,
                            as: 'account',
                            required: false
                        }
                    ]
                }
            ],
            order: [
                [{ model: SaleItem, as: 'items' }, 'id', 'ASC'],
                [{ model: Payment, as: 'payments' }, 'payment_date', 'ASC']
            ]
        });

        if (!sale) {
            throw new AppError('Sale not found', 404);
        }

        const payments = sale.payments || [];

        const validPayments = payments.filter(payment => payment.status !== 'CANCELLED');

        const cashPayments = validPayments.filter(payment =>
            payment.affects_cash !== false &&
            payment.type !== 'RETENCION'
        );

        const retentionPayments = validPayments.filter(payment =>
            payment.type === 'RETENCION'
        );

        const migrationPayments = validPayments.filter(payment =>
            payment.type === 'MIGRACION'
        );

        const totalCashPaid = cashPayments.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const totalRetained = retentionPayments.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const totalMigrated = migrationPayments.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const totalApplied = validPayments.reduce((sum, payment) => {
            if (payment.affects_balance === false) return sum;
            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const total = parseFloat(sale.total || 0);
        const balance = Math.max(total - totalApplied, 0);

        return {
            ticket: {
                folio: sale.sale_number,
                generated_at: new Date(),
                sale_id: sale.id
            },

            sale: {
                id: sale.id,
                sale_number: sale.sale_number,
                status: sale.status,
                financial_status: sale.financial_status,
                fulfillment_status: sale.fulfillment_status,
                type: sale.type,
                is_urgent: sale.is_urgent,
                notes: sale.notes,
                created_at: sale.createdAt
            },

            client: sale.client ? {
                id: sale.client.id,
                name: sale.client.name,
                phone: sale.client.phone,
                email: sale.client.email,
                address: sale.client.address,
            } : null,

            items: (sale.items || []).map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product?.name || item.product?.title || item.custom_description || 'Prenda / Servicio',
                description: item.custom_description || item.description || item.product?.name || null,
                garment_type: item.garment_type,
                client_garment_id: item.client_garment_id,
                measurement_id: item.measurement_id,
                garment_snapshot: item.garment_snapshot,
                measurement_snapshot: item.measurement_snapshot,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price || 0),
                total: parseFloat(item.total || 0),
                production_status: item.production_status,
                delivery_status: item.delivery_status,
                delivered_at: item.delivered_at
            })),

            payments: validPayments.map(payment => ({
                id: payment.id,
                amount: parseFloat(payment.amount || 0),
                received_amount: payment.received_amount !== null && payment.received_amount !== undefined
                    ? parseFloat(payment.received_amount || 0)
                    : null,
                change_amount: parseFloat(payment.change_amount || 0),
                payment_method: payment.payment_method,
                type: payment.type,
                status: payment.status,
                affects_cash: payment.affects_cash,
                affects_balance: payment.affects_balance,
                reference: payment.reference,
                notes: payment.notes,
                payment_date: payment.payment_date,
                account: payment.account ? {
                    id: payment.account.id,
                    name: payment.account.name
                } : null,
                metadata: payment.metadata
            })),

            financial_summary: {
                total,
                cash_paid: Number(totalCashPaid.toFixed(2)),
                retained_amount: Number(totalRetained.toFixed(2)),
                migrated_amount: Number(totalMigrated.toFixed(2)),
                total_applied: Number(totalApplied.toFixed(2)),
                balance: Number(balance.toFixed(2)),
                financial_status: sale.financial_status
            }
        };
    }

    static generateTicketNumber(saleNumber, ticketType) {
        const safeSaleNumber = String(saleNumber || 'SALE').replace(/[^a-zA-Z0-9-_]/g, '');
        const timestamp = Date.now().toString().slice(-8);
        return `TCK-${ticketType}-${safeSaleNumber}-${timestamp}`;
    }

    static async issueTicket(saleId, ticketType = 'SALE_SUMMARY', userId = null) {
        const allowedTypes = [
            'SALE_SUMMARY',
            'PAYMENT_RECEIPT',
            'DELIVERY_RECEIPT'
        ];

        const normalizedType = String(ticketType || 'SALE_SUMMARY').toUpperCase();

        if (!allowedTypes.includes(normalizedType)) {
            throw new AppError(
                `Invalid ticket type. Allowed types: ${allowedTypes.join(', ')}`,
                400
            );
        }

        const ticketData = await this.getTicketData(saleId);

        const ticketNumber = this.generateTicketNumber(
            ticketData.sale.sale_number,
            normalizedType
        );

        const ticket = await SaleTicket.create({
            sale_id: saleId,
            ticket_number: ticketNumber,
            ticket_type: normalizedType,
            status: 'ISSUED',
            snapshot: {
                ...ticketData,
                issued_snapshot_at: new Date(),
                issued_by: userId
            },
            issued_by: userId,
            issued_at: new Date()
        });

        return ticket;
    }

    static async getTicketsBySale(saleId) {
        const tickets = await SaleTicket.findAll({
            where: {
                sale_id: saleId
            },
            order: [['issued_at', 'DESC']]
        });

        return tickets;
    }

    static async getTicketById(ticketId) {
        const ticket = await SaleTicket.findByPk(ticketId);

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        return ticket;
    }

    static async cancelTicket(ticketId, reason, userId = null, managerAuthorization = null) {
        return await sequelize.transaction(async (t) => {
            const ticket = await SaleTicket.findByPk(ticketId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!ticket) {
                throw new AppError('Ticket not found', 404);
            }

            if (ticket.status === 'CANCELLED') {
                throw new AppError('Ticket is already cancelled', 400);
            }

            if (!reason || !reason.trim()) {
                throw new AppError('Cancellation reason is required', 400);
            }

            const authorization = await OperationAuthorizationService.authorizeOperation({
                operationType: 'CANCEL_TICKET',
                targetType: 'SaleTicket',
                targetId: ticket.id,
                requestedBy: userId,
                reason,
                managerAuthorization,
                metadata: {
                    sale_id: ticket.sale_id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type
                },
                transaction: t
            });

            const currentSnapshot = ticket.snapshot || {};

            await ticket.update({
                status: 'CANCELLED',
                cancelled_at: new Date(),
                cancellation_reason: reason,
                snapshot: {
                    ...currentSnapshot,
                    cancellation: {
                        cancelled_at: new Date(),
                        cancelled_by: userId,
                        authorized_by: authorization.authorized_by,
                        authorization_id: authorization.id,
                        reason
                    }
                }
            }, { transaction: t, userId });

            return ticket;
        });
    }
}

module.exports = SaleTicketService;