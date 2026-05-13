const InventoryService = require("../services/InventoryService");

const getInventory = async (req, res, next) => {
    try {
        const result = await InventoryService.getInventory(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const adjustInventory = async (req, res, next) => {
    try {
        const result = await InventoryService.adjustInventory({
            ...req.body,
            userId: req.user.id
        });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getInventoryMovements = async (req, res, next) => {
    try {
        const result = await InventoryService.getInventoryMovements(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getLowStockAlerts = async (req, res, next) => {
    try {
        const result = await InventoryService.getLowStockAlerts();
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const resolveAlert = async (req, res, next) => {
    try {
        const result = await InventoryService.resolveAlert(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    adjustInventory,
    getInventoryMovements,
    getLowStockAlerts,
    resolveAlert
};