const express = require('express');
const { successResponse } = require('../../utils/responseHandler');

const router = express.Router();

// Health Check Route
router.get('/health', (req, res) => {
    successResponse(res, 200, 'API is running successfully', {
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

module.exports = router;
