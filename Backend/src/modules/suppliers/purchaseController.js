const PurchaseService = require('./PurchaseService');

const createMaterialPurchase = async (req, res, next) => {
    try {
        const result = await PurchaseService.createMaterialPurchase(req.body, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPurchases = async (req, res, next) => {
    try {
        const result = await PurchaseService.findAll(req.query);

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPurchaseById = async (req, res, next) => {
    try {
        const result = await PurchaseService.findById(req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMaterialPurchase,
    getPurchases,
    getPurchaseById
};