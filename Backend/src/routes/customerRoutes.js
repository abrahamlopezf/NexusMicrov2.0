const express = require("express");
const router = express.Router();

const ClientController = require("../controllers/clientController");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/permissions");

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ClientController.createClient);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ClientController.getClients);
router.get("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ClientController.getClientById);
router.put("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), ClientController.updateClient);
router.delete("/:id", auth, authorizeRoles(ROLES.ADMIN), ClientController.deleteClient);

module.exports = router;
