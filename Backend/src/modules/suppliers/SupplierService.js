const { Op } = require('sequelize');
const { Supplier } = require('../../models');
const AppError = require('../../utils/AppError');

class SupplierService {
    static async create(data = {}, actor = null) {
        if (!data.name) {
            throw new AppError('Supplier name is required', 400);
        }

        const supplierType = data.supplier_type || 'MATERIAL_SUPPLIER';

        if (!['MATERIAL_SUPPLIER', 'SERVICE_SUPPLIER', 'MIXED'].includes(supplierType)) {
            throw new AppError('Invalid supplier_type', 400);
        }

        return Supplier.create(
            {
                name: data.name,
                business_name: data.business_name || null,
                rfc: data.rfc || null,
                supplier_type: supplierType,
                phone: data.phone || null,
                email: data.email || null,
                address: data.address || null,
                contact_name: data.contact_name || null,
                payment_terms: data.payment_terms || null,
                notes: data.notes || null,
                status: data.status || 'ACTIVE',
                created_by: actor?.id || null
            },
            {
                userId: actor?.id || null
            }
        );
    }

    static async findAll(query = {}) {
        const where = {};

        if (query.status) {
            where.status = query.status;
        } else {
            where.status = 'ACTIVE';
        }

        if (query.supplier_type) {
            where.supplier_type = query.supplier_type;
        }

        if (query.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query.search}%` } },
                { business_name: { [Op.iLike]: `%${query.search}%` } },
                { rfc: { [Op.iLike]: `%${query.search}%` } }
            ];
        }

        return Supplier.findAll({
            where,
            order: [['name', 'ASC']]
        });
    }

    static async findById(id) {
        const supplier = await Supplier.findByPk(id, {
            include: ['materials', 'purchases', 'external_services']
        });

        if (!supplier) {
            throw new AppError('Supplier not found', 404);
        }

        return supplier;
    }

    static async update(id, data = {}, actor = null) {
        const supplier = await Supplier.findByPk(id);

        if (!supplier) {
            throw new AppError('Supplier not found', 404);
        }

        if (
            data.supplier_type &&
            !['MATERIAL_SUPPLIER', 'SERVICE_SUPPLIER', 'MIXED'].includes(data.supplier_type)
        ) {
            throw new AppError('Invalid supplier_type', 400);
        }

        await supplier.update(
            {
                name: data.name ?? supplier.name,
                business_name: data.business_name ?? supplier.business_name,
                rfc: data.rfc ?? supplier.rfc,
                supplier_type: data.supplier_type ?? supplier.supplier_type,
                phone: data.phone ?? supplier.phone,
                email: data.email ?? supplier.email,
                address: data.address ?? supplier.address,
                contact_name: data.contact_name ?? supplier.contact_name,
                payment_terms: data.payment_terms ?? supplier.payment_terms,
                notes: data.notes ?? supplier.notes,
                status: data.status ?? supplier.status,
                updated_by: actor?.id || null
            },
            {
                userId: actor?.id || null
            }
        );

        return supplier;
    }

    static async deactivate(id, actor = null) {
        const supplier = await Supplier.findByPk(id);

        if (!supplier) {
            throw new AppError('Supplier not found', 404);
        }

        await supplier.update(
            {
                status: 'INACTIVE',
                updated_by: actor?.id || null
            },
            {
                userId: actor?.id || null
            }
        );

        return true;
    }
}

module.exports = SupplierService;
