const express = require("express");
const router = express.Router();

const UserController = require('./user.controller');
const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post(
    "/",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    UserController.createUser
);

router.get(
    "/",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    UserController.getUsers
);

router.get(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    UserController.getUserById
);

router.put(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    UserController.updateUser
);

router.delete(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    UserController.deleteUser
);

module.exports = router;