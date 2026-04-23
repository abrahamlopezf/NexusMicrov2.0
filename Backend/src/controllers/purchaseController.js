const PurchaseService = require("../services/PurchaseService");

const createPurchase = async (req, res, next) => {
    try {
        const result = await PurchaseService.createPurchase(req.body);
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
        const result = await PurchaseService.getPurchases(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPurchaseById = async (req, res, next) => {
    try {
        const result = await PurchaseService.getPurchaseById(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updatePurchaseStatus = async (req, res, next) => {
    try {
        const result = await PurchaseService.updatePurchaseStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchaseStatus
};
