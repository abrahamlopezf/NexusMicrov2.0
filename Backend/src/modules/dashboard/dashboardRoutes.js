const express = require('express');
const router = express.Router();

const auth = require('../../middlewares/authMiddleware');
const authorize = require('../../middlewares/roleMiddleware');
const DashboardController = require('./DashboardController');
const { cacheResponse } = require('../../middlewares/cacheMiddleware');

// Protegemos todas las rutas del dashboard con auth token
router.use(auth);

// Rutas cacheadas por la persistencia pesada de DB
router.get('/advanced', cacheResponse, DashboardController.advanced);
router.get('/summary', cacheResponse, DashboardController.summary);
router.get('/top-products', cacheResponse, DashboardController.topProducts);
router.get('/sales-by-month', cacheResponse, DashboardController.salesByMonth);
router.get('/low-stock', cacheResponse, DashboardController.lowStock);
router.get('/productivity', cacheResponse, DashboardController.employeeProductivity);

module.exports = router;
