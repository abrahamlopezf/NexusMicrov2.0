const express = require("express");
const router = express.Router();

const CategoryController = require('./categoryController');
const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), CategoryController.createCategory);
router.get("/", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), CategoryController.getCategories);
router.put("/:id", auth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), CategoryController.updateCategory);
router.delete("/:id", auth, authorizeRoles(ROLES.ADMIN), CategoryController.deleteCategory);

module.exports = router;
