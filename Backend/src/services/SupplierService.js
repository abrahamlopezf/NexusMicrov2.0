const { Supplier } = require('../models');
const AppError = require('../utils/AppError');

class SupplierService {
    static async createSupplier(data) {
        const { name, phone, email, address } = data;
        return await Supplier.create({ name, phone, email, address });
    }

    static async getSuppliers(query = {}) {
        return await Supplier.findAll({
            order: [['name', 'ASC']]
        });
    }

    static async getSupplierById(id) {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) throw new AppError('Proveedor no encontrado', 404);
        return supplier;
    }

    static async updateSupplier(id, data) {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) throw new AppError('Proveedor no encontrado', 404);
        
        await supplier.update(data);
        return supplier;
    }

    static async deleteSupplier(id) {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) throw new AppError('Proveedor no encontrado', 404);
        
        await supplier.destroy();
        return { success: true };
    }
}

module.exports = SupplierService;
