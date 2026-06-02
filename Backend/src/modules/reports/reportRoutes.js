const express = require("express");
const router = express.Router();

const ReportController = require('./reportController');

const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

const PosDailyReportController = require('./posDailyReportController');

router.get("/dashboard", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ReportController.getDashboard);
router.get("/sales", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ReportController.getSalesReport);
router.get("/inventory", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ReportController.getInventoryReport);
router.get("/production", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ReportController.getProductionReport);
router.get("/financial", auth, authorizeRoles(ROLES.ADMIN), ReportController.getFinancialReport);
router.get("/pos/daily/pdf", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PosDailyReportController.getDailyReportPdf);
router.get("/pos/daily/excel", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PosDailyReportController.getDailyReportExcel);
router.get("/pos/daily", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PosDailyReportController.getDailyReport);

module.exports = router;
