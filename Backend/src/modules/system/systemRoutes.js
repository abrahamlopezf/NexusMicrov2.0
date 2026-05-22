const express = require('express');
const router = express.Router();
const systemController = require('./systemController');

// GET /api/system/metrics
router.get('/metrics', systemController.getMetrics);

module.exports = router;
