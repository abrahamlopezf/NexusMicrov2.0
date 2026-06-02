const express = require("express");
const router = express.Router();

const TaskController = require('./taskController');
const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), TaskController.createTask);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), TaskController.getTasks);
router.put("/:id/status", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), TaskController.updateTaskStatus);
router.post("/:id/assign", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), TaskController.assignTask);

module.exports = router;
