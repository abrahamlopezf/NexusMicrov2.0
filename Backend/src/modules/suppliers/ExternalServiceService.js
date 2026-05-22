const {
    sequelize,
    Supplier,
    ExternalServiceOrder,
    Sale,
    SaleItem,
    WorkOrder
} = require('../../models');

const AppError = require('../../utils/AppError');

class ExternalServiceService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(4));
    }

    static money(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static async generateServiceNumber() {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `EXT-${date}-${random}`;
    }

    static validateServiceSupplier(supplier) {
        if (!['SERVICE_SUPPLIER', 'MIXED'].includes(supplier.supplier_type)) {
            throw new AppError('Supplier is not allowed for external services', 400);
        }

        if (supplier.status !== 'ACTIVE') {
            throw new AppError('Supplier is not active', 400);
        }
    }

    static async create(data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            if (!data.supplier_id) {
                throw new AppError('supplier_id is required', 400);
            }

            if (!data.sale_id) {
                throw new AppError('sale_id is required', 400);
            }

            if (!data.service_type) {
                throw new AppError('service_type is required', 400);
            }

            if (!data.description) {
                throw new AppError('description is required', 400);
            }

            const supplier = await Supplier.findByPk(data.supplier_id, { transaction: t });

            if (!supplier) {
                throw new AppError('Supplier not found', 404);
            }

            this.validateServiceSupplier(supplier);

            const sale = await Sale.findByPk(data.sale_id, { transaction: t });

            if (!sale) {
                throw new AppError('Sale not found', 404);
            }

            let saleItem = null;

            if (data.sale_item_id) {
                saleItem = await SaleItem.findByPk(data.sale_item_id, { transaction: t });

                if (!saleItem) {
                    throw new AppError('Sale item not found', 404);
                }

                if (Number(saleItem.sale_id) !== Number(sale.id)) {
                    throw new AppError('Sale item does not belong to selected sale', 400);
                }
            }

            let workOrder = null;

            if (data.work_order_id) {
                workOrder = await WorkOrder.findByPk(data.work_order_id, { transaction: t });

                if (!workOrder) {
                    throw new AppError('Work order not found', 404);
                }

                if (Number(workOrder.sale_id) !== Number(sale.id)) {
                    throw new AppError('Work order does not belong to selected sale', 400);
                }
            }

            const quantity = this.toNumber(data.quantity || 1);
            const unitCost = this.toNumber(data.unit_cost || 0);

            if (quantity <= 0) {
                throw new AppError('quantity must be greater than 0', 400);
            }

            if (unitCost < 0) {
                throw new AppError('unit_cost cannot be negative', 400);
            }

            const subtotal = this.money(quantity * unitCost);
            const tax = this.money(data.tax || 0);
            const discount = this.money(data.discount || 0);
            const totalCost = this.money(subtotal + tax - discount);

            return ExternalServiceOrder.create({
                service_number: data.service_number || await this.generateServiceNumber(),
                supplier_id: supplier.id,
                sale_id: sale.id,
                sale_item_id: saleItem?.id || null,
                work_order_id: workOrder?.id || null,
                service_type: data.service_type,
                description: data.description,
                quantity,
                unit_cost: unitCost,
                subtotal,
                tax,
                discount,
                total_cost: totalCost,
                status: data.status || 'PENDING',
                sent_at: data.sent_at || null,
                expected_return_at: data.expected_return_at || null,
                notes: data.notes || null,
                metadata: data.metadata || null,
                created_by: actor?.id || null
            }, {
                transaction: t,
                userId: actor?.id || null
            });
        });
    }

    static async findAll(query = {}) {
        const where = {};

        if (query.supplier_id) where.supplier_id = query.supplier_id;
        if (query.sale_id) where.sale_id = query.sale_id;
        if (query.sale_item_id) where.sale_item_id = query.sale_item_id;
        if (query.status) where.status = query.status;

        return ExternalServiceOrder.findAll({
            where,
            include: ['supplier', 'sale', 'saleItem', 'workOrder'],
            order: [['created_at', 'DESC']]
        });
    }

    static async findById(id) {
        const order = await ExternalServiceOrder.findByPk(id, {
            include: ['supplier', 'sale', 'saleItem', 'workOrder']
        });

        if (!order) {
            throw new AppError('External service order not found', 404);
        }

        return order;
    }

    static async updateStatus(id, data = {}, actor = null) {
        const order = await ExternalServiceOrder.findByPk(id);

        if (!order) {
            throw new AppError('External service order not found', 404);
        }

        const status = data.status;

        if (!['PENDING', 'SENT', 'IN_PROGRESS', 'RECEIVED', 'CANCELLED'].includes(status)) {
            throw new AppError('Invalid external service status', 400);
        }

        const payload = {
            status,
            updated_by: actor?.id || null
        };

        if (status === 'SENT') {
            payload.sent_at = data.sent_at || new Date();
        }

        if (status === 'RECEIVED') {
            payload.received_at = data.received_at || new Date();
        }

        if (status === 'CANCELLED') {
            payload.cancelled_at = new Date();
            payload.cancellation_reason = data.cancellation_reason || null;
        }

        await order.update(payload, {
            userId: actor?.id || null
        });

        return order;
    }
}

module.exports = ExternalServiceService;