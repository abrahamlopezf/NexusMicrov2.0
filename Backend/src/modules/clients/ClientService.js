const ClientRepository = require('../../repositories/client.repository');
const AppError = require('../../utils/AppError');

class ClientService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static normalizeEmail(email) {
        if (email === undefined) return undefined;
        if (email === null) return null;

        const normalized = String(email).trim().toLowerCase();

        return normalized || null;
    }

    static normalizePhone(phone) {
        if (phone === undefined) return undefined;
        if (phone === null) return null;

        const normalized = String(phone)
            .trim()
            .replace(/[^\d+]/g, '');

        return normalized || null;
    }

    static sanitizeClientPayload(data = {}, isUpdate = false) {
        const payload = {};

        if (!isUpdate || data.name !== undefined) {
            payload.name = String(data.name || '').trim();

            if (!payload.name) {
                throw new AppError('Client name is required', 400);
            }
        }

        if (data.email !== undefined) {
            payload.email = this.normalizeEmail(data.email);
        }

        if (data.phone !== undefined) {
            payload.phone = this.normalizePhone(data.phone);
        }

        if (data.address !== undefined) {
            const address = String(data.address || '').trim();
            payload.address = address || null;
        }

        // Importante:
        // loyalty_points queda eliminado.
        // No permitir que entre aunque venga en req.body.
        delete payload.loyalty_points;

        return payload;
    }

    static async validateDuplicate({ email, phone }, excludeId = null) {
        const duplicate = await ClientRepository.findDuplicate(
            { email, phone },
            excludeId
        );

        if (!duplicate) return;

        if (email && duplicate.email === email) {
            throw new AppError('A client with this email already exists', 400);
        }

        if (phone && duplicate.phone === phone) {
            throw new AppError('A client with this phone already exists', 400);
        }

        throw new AppError('Duplicated client data', 400);
    }

    static async createClient(data, actor = null) {
        const payload = this.sanitizeClientPayload(data);

        await this.validateDuplicate({
            email: payload.email,
            phone: payload.phone
        });

        const client = await ClientRepository.createClient(payload, {
            userId: actor?.id || null
        });

        return client;
    }

    static async updateClient(id, data, actor = null) {
        const payload = this.sanitizeClientPayload(data, true);

        const existingClient = await ClientRepository.model.findByPk(id);

        if (!existingClient) {
            throw new AppError('Client not found', 404);
        }

        await this.validateDuplicate({
            email: payload.email,
            phone: payload.phone
        }, id);

        const updated = await ClientRepository.updateClient(id, payload, {
            userId: actor?.id || null
        });

        if (!updated) {
            throw new AppError('Client not found', 404);
        }

        return updated;
    }

    static async deleteClient(id, actor = null) {
        const client = await ClientRepository.model.findByPk(id);

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        const deleted = await ClientRepository.softDeleteClient(id, {
            userId: actor?.id || null
        });

        if (!deleted) {
            throw new AppError('Client not found', 404);
        }

        return {
            deleted: true,
            client_id: Number(id)
        };
    }

    static async getClientById(id) {
        const profile = await ClientRepository.findClientProfile(id);

        if (!profile) {
            throw new AppError('Client not found', 404);
        }

        const { client, sales, tickets, quotes, garments } = profile;

        const salesPlain = sales.map(sale => {
            const payments = sale.payments || [];
            const activePayments = payments.filter(payment => payment.status !== 'CANCELLED');

            const cashPaid = activePayments.reduce((sum, payment) => {
                if (payment.type === 'RETENCION') return sum;
                if (payment.affects_cash === false) return sum;

                return sum + parseFloat(payment.amount || 0);
            }, 0);

            const retainedAmount = activePayments.reduce((sum, payment) => {
                if (payment.type !== 'RETENCION') return sum;

                return sum + parseFloat(payment.amount || 0);
            }, 0);

            const totalApplied = cashPaid + retainedAmount;

            return {
                id: sale.id,
                sale_number: sale.sale_number,
                status: sale.status,
                financial_status: sale.financial_status,
                fulfillment_status: sale.fulfillment_status,
                total: this.toNumber(sale.total),
                paid_amount: this.toNumber(sale.paid_amount),
                retained_amount: this.toNumber(sale.retained_amount),
                balance: this.toNumber(sale.balance),
                calculated: {
                    cash_paid: this.toNumber(cashPaid),
                    retained_amount: this.toNumber(retainedAmount),
                    total_applied: this.toNumber(totalApplied)
                },
                created_at: sale.createdAt,
                updated_at: sale.updatedAt,
                items: (sale.items || []).map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product?.name || item.product?.title || null,
                    description: item.custom_description || item.description || item.product?.name || null,
                    garment_type: item.garment_type,
                    client_garment_id: item.client_garment_id,
                    measurement_id: item.measurement_id,
                    garment_snapshot: item.garment_snapshot,
                    measurement_snapshot: item.measurement_snapshot,
                    quantity: item.quantity,
                    unit_price: this.toNumber(item.unit_price),
                    total: this.toNumber(item.total),
                    production_status: item.production_status,
                    delivery_status: item.delivery_status
                })),
                payments: payments.map(payment => ({
                    id: payment.id,
                    amount: this.toNumber(payment.amount),
                    received_amount: payment.received_amount !== null && payment.received_amount !== undefined
                        ? this.toNumber(payment.received_amount)
                        : null,
                    change_amount: this.toNumber(payment.change_amount),
                    payment_method: payment.payment_method,
                    type: payment.type,
                    status: payment.status,
                    affects_cash: payment.affects_cash,
                    affects_balance: payment.affects_balance,
                    reference: payment.reference,
                    notes: payment.notes,
                    payment_date: payment.payment_date,
                    cancelled_at: payment.cancelled_at,
                    cancellation_reason: payment.cancellation_reason
                }))
            };
        });

        const ticketsPlain = tickets.map(ticket => ({
            id: ticket.id,
            sale_id: ticket.sale_id,
            ticket_number: ticket.ticket_number,
            ticket_type: ticket.ticket_type,
            status: ticket.status,
            issued_by: ticket.issued_by,
            issued_at: ticket.issued_at,
            cancelled_at: ticket.cancelled_at,
            cancellation_reason: ticket.cancellation_reason
        }));

        const garmentsPlain = (garments || []).map(garment => ({
            id: garment.id,
            client_id: garment.client_id,
            garment_type: garment.garment_type,
            name: garment.name,
            description: garment.description,
            status: garment.status,
            notes: garment.notes,
            created_by: garment.created_by,
            updated_by: garment.updated_by,
            created_at: garment.createdAt,
            updated_at: garment.updatedAt,

            measurements: (garment.measurements || []).map(measurement => ({
                id: measurement.id,
                version: measurement.version,
                measurement_data: measurement.measurement_data,
                unit: measurement.unit,
                notes: measurement.notes,
                is_active: measurement.is_active,
                taken_by: measurement.taken_by,
                created_by: measurement.created_by,
                updated_by: measurement.updated_by,
                created_at: measurement.createdAt,
                updated_at: measurement.updatedAt,
                annotations: (measurement.annotations || []).map(annotation => ({
                    id: annotation.id,
                    note_type: annotation.note_type,
                    note: annotation.note,
                    created_by: annotation.created_by,
                    updated_by: annotation.updated_by,
                    created_at: annotation.createdAt,
                    updated_at: annotation.updatedAt
                }))
            })),

            annotations: (garment.annotations || [])
                .filter(annotation => !annotation.measurement_id)
                .map(annotation => ({
                    id: annotation.id,
                    measurement_id: annotation.measurement_id,
                    note_type: annotation.note_type,
                    note: annotation.note,
                    created_by: annotation.created_by,
                    updated_by: annotation.updated_by,
                    created_at: annotation.createdAt,
                    updated_at: annotation.updatedAt
                }))
        }));

        const summary = {
            sales_count: salesPlain.length,
            tickets_count: ticketsPlain.length,
            active_tickets_count: ticketsPlain.filter(ticket => ticket.status !== 'CANCELLED').length,
            cancelled_tickets_count: ticketsPlain.filter(ticket => ticket.status === 'CANCELLED').length,
            garments_count: garmentsPlain.length,
            active_garments_count: garmentsPlain.filter(g => g.status === 'ACTIVE').length,
            measurements_count: garmentsPlain.reduce((sum, g) => sum + g.measurements.length, 0),
            annotations_count: garmentsPlain.reduce((sum, g) => {
                const garmentNotes = g.annotations.length;
                const measurementNotes = g.measurements.reduce((mSum, m) => mSum + m.annotations.length, 0);
                return sum + garmentNotes + measurementNotes;
            }, 0),
            total_sales_amount: this.toNumber(
                salesPlain.reduce((sum, sale) => sum + sale.total, 0)
            ),
            total_paid_amount: this.toNumber(
                salesPlain.reduce((sum, sale) => sum + sale.paid_amount, 0)
            ),
            total_balance: this.toNumber(
                salesPlain.reduce((sum, sale) => sum + sale.balance, 0)
            )
        };

        return {
            client: {
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address,
                created_at: client.createdAt,
                updated_at: client.updatedAt
            },
            summary,
            sales: salesPlain,
            tickets: ticketsPlain,
            quotes,
            garments: garmentsPlain
        };
    }

    static async getAllClients(query = {}) {
        return ClientRepository.findAllPaginated(query);
    }
}

module.exports = ClientService;