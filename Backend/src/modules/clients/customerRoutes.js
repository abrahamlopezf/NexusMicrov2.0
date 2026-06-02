const express = require("express");
const router = express.Router();

const ClientController = require('./clientController');
const ClientGarmentController = require('./clientGarmentController');

const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

router.post(
    "/",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientController.createClient
);

router.get(
    "/",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientController.getClients
);

// ═════════════════════════════════════════════════════════════
// CLIENT GARMENTS
// ═════════════════════════════════════════════════════════════

router.post(
    "/:clientId/garments",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.createGarment
);

router.get(
    "/:clientId/garments",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.getGarmentsByClient
);

router.get(
    "/garments/:garmentId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.getGarmentById
);

router.put(
    "/garments/:garmentId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.updateGarment
);

router.delete(
    "/garments/:garmentId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.deleteGarment
);

// ═════════════════════════════════════════════════════════════
// MEASUREMENTS
// ═════════════════════════════════════════════════════════════

router.post(
    "/garments/:garmentId/measurements",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.createMeasurement
);

router.put(
    "/measurements/:measurementId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.updateMeasurement
);

router.patch(
    "/measurements/:measurementId/activate",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.activateMeasurement
);

router.delete(
    "/measurements/:measurementId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.deleteMeasurement
);

// ═════════════════════════════════════════════════════════════
// ANNOTATIONS
// ═════════════════════════════════════════════════════════════

router.post(
    "/annotations",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.createAnnotation
);

router.post(
    "/garments/:garmentId/annotations",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.createGarmentAnnotation
);

router.post(
    "/garments/:garmentId/measurements/:measurementId/annotations",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.createMeasurementAnnotation
);

router.get(
    "/garments/:garmentId/annotations",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientGarmentController.getAnnotationsByGarment
);

router.put(
    "/annotations/:annotationId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.updateAnnotation
);

router.delete(
    "/annotations/:annotationId",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientGarmentController.deleteAnnotation
);

router.get(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    ClientController.getClientById
);

router.put(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    ClientController.updateClient
);

router.delete(
    "/:id",
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    ClientController.deleteClient
);

module.exports = router;