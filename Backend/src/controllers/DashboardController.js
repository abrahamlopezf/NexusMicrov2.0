const DashboardService = require('../services/DashboardService');

class DashboardController {
    static async advanced(req, res, next) {
        try {
            const range = req.query.range || '7days';
            const data = await DashboardService.getAdvanced(range);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async summary(req, res, next) {
        try {
            const data = await DashboardService.getSummary();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async topProducts(req, res, next) {
        try {
            const data = await DashboardService.getTopProducts();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async salesByMonth(req, res, next) {
        try {
            const data = await DashboardService.getSalesByMonth();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async lowStock(req, res, next) {
        try {
            const data = await DashboardService.getLowStock();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async employeeProductivity(req, res, next) {
        try {
            const data = await DashboardService.getEmployeeProductivity();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DashboardController;
