const express = require("express");
const router = express.Router();

const PaymentController = require("../controllers/paymentController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PaymentController.registerPayment);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PaymentController.getPayments);
router.get("/sale/:saleId", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.CLIENT), PaymentController.getPaymentBySale);

module.exports = router;
