const express = require("express");
const router = express.Router();

const SupplierController = require("../controllers/supplierController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), SupplierController.createSupplier);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), SupplierController.getSuppliers);
router.get("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), SupplierController.getSupplierById);
router.put("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), SupplierController.updateSupplier);
router.delete("/:id", auth, authorizeRoles(ROLES.ADMIN), SupplierController.deleteSupplier);

module.exports = router;
