const express = require("express");
const router = express.Router();

const WorkOrderController = require("../controllers/workOrderController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), WorkOrderController.createWorkOrder);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), WorkOrderController.getWorkOrders);
router.get("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), WorkOrderController.getWorkOrderById);
router.put("/:id/status", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), WorkOrderController.updateWorkOrderStatus);
router.post("/:id/assign", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), WorkOrderController.assignWorkOrder);

module.exports = router;
