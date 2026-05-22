const SupplierService = require('./SupplierService');

const createSupplier = async (req, res, next) => {
    try {
        const result = await SupplierService.create(req.body, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getSuppliers = async (req, res, next) => {
    try {
        const result = await SupplierService.findAll(req.query);

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getSupplierById = async (req, res, next) => {
    try {
        const result = await SupplierService.findById(req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateSupplier = async (req, res, next) => {
    try {
        const result = await SupplierService.update(req.params.id, req.body, req.user);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deactivateSupplier = async (req, res, next) => {
    try {
        await SupplierService.deactivate(req.params.id, req.user);

        res.status(200).json({
            success: true,
            message: 'Supplier deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deactivateSupplier
};