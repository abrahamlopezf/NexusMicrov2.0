const express = require('express');
const router = express.Router();

const healthController = require('./healthController');

router.get('/', healthController.getSystemHealth);

module.exports = router;
