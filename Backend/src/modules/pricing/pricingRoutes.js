const express = require("express");
const router = express.Router();

const pricingController = require('./pricingController');
const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post("/calculate", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), pricingController.calculatePrice);

router.get("/settings", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), pricingController.getSettings);
router.put("/settings", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), pricingController.updateSettings);

module.exports = router;
