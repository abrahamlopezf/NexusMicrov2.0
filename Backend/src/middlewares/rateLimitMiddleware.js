const rateLimit = require('express-rate-limit');

/**
 * Limit repeated requests to public APIs and/or endpoints
 * Default: 100 requests per 15 minutes window
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10000, // Aumentado drásticamente para evitar bloqueos en desarrollo
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true, 
    legacyHeaders: false,
});

module.exports = apiLimiter;
