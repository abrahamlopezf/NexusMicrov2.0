const express = require("express");
const router = express.Router();

const ProductionController = require('./productionController');
const ProductionQueueController = require('./ProductionQueueController');
const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post("/:id/start", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), ProductionController.startProduction);
router.post("/:id/complete", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), ProductionController.completeProduction);
router.get("/garments", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), ProductionController.getOperationalGarments);
router.get('/queue', ProductionQueueController.getQueue);
router.get("/:id/status", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), ProductionController.getProductionStatus);

module.exports = router;
