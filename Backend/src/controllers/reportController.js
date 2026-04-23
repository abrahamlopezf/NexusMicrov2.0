const ReportService = require("../services/ReportService");

const getDashboard = async (req, res, next) => {
    try {
        const result = await ReportService.getDashboardKPIs();
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getSalesReport = async (req, res, next) => {
    try {
        const result = await ReportService.getSalesReport(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getInventoryReport = async (req, res, next) => {
    try {
        const result = await ReportService.getInventoryReport(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getProductionReport = async (req, res, next) => {
    try {
        const result = await ReportService.getProductionReport(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getFinancialReport = async (req, res, next) => {
    try {
        const result = await ReportService.getFinancialReport(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getSalesReport,
    getInventoryReport,
    getProductionReport,
    getFinancialReport
};
