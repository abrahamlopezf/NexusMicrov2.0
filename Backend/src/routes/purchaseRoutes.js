const express = require("express");
const router = express.Router();

const PurchaseController = require("../controllers/purchaseController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PurchaseController.createPurchase);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PurchaseController.getPurchases);
router.get("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PurchaseController.getPurchaseById);
router.put("/:id/status", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), PurchaseController.updatePurchaseStatus);

module.exports = router;
