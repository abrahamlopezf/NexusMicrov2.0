const express = require("express");
const router = express.Router();

const InventoryController = require("../controllers/inventoryController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), InventoryController.getInventory);
router.get("/alerts", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), InventoryController.getLowStockAlerts);
router.post("/adjust", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), InventoryController.adjustInventory);
router.get("/movements", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), InventoryController.getInventoryMovements);

module.exports = router;
