const express = require("express");
const router = express.Router();

const PaymentController = require('./paymentController');
const PaymentBackfillController = require('./paymentBackfillController');

const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post("/backfill/legacy", auth, authorizeRoles(ROLES.ADMIN), PaymentBackfillController.backfillLegacyPayments);
router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), PaymentController.registerPayment);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PaymentController.getPayments);
router.get("/sale/:saleId", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), PaymentController.getPaymentBySale);
router.post("/sale/:saleId/liquidate", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), PaymentController.liquidateSale);
router.patch("/:paymentId/cancel", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), PaymentController.cancelPayment);

module.exports = router;
