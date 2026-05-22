const express = require("express");
const router = express.Router();

const CashController = require('./cashController');

const auth = require('../../middlewares/authMiddleware');
const authorize = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

const CashReportController = require('./cashReportController');

router.get(
    "/sessions/:sessionId/report",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    CashReportController.getSessionReport
);

router.get(
    "/sessions/:sessionId/report/pdf",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    CashReportController.getSessionReportPdf
);

router.get(
    "/sessions/:sessionId/report/excel",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    CashReportController.getSessionReportExcel
);

router.post(
    "/open",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    CashController.openSession
);

router.get(
    "/current",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    CashController.getCurrentSession
);

router.post(
    "/movements",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    CashController.createManualMovement
);

router.patch(
    "/movements/:movementId/cancel",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    CashController.cancelManualMovement
);

router.post(
    "/close",
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    CashController.closeSession
);

module.exports = router;