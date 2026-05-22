const express = require('express');

const router = express.Router();

const controller = require('./productionWorkflow.controller');

// Optional auth middlewares
// const authMiddleware = require('../../middlewares/authMiddleware');

router.post(
    '/start/:saleItemId',
    controller.startProduction
);

router.post(
    '/ready/:saleItemId',
    controller.markReady
);

router.post(
    '/deliver/:saleItemId',
    controller.deliverGarment
);

router.post(
    '/cancel/:saleItemId',
    controller.cancelProduction
);

module.exports = router;