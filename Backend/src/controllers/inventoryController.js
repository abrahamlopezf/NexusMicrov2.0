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
        const result = await InventoryService.adjustInventory(req.body);
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
        const { StockAlert, Material } = require('../models');
        if (!StockAlert) {
            return res.status(200).json({ success: true, data: [] });
        }
        
        const alerts = await StockAlert.findAll({
            where: { resolved: false },
            include: [{ model: Material, as: 'material', attributes: ['name', 'unit'] }],
            order: [['created_at', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    adjustInventory,
    getInventoryMovements,
    getLowStockAlerts
};