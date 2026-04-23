const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    // Default config
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error defensively if it wasn't natively operational
    if (!err.isOperational) {
        console.error(`[CRITICAL FATAL] 🔥`, err);
    } else {
        console.warn(`[AppError ${err.statusCode}] ⚠️ ${err.message}`);
    }

    // Return strictly formatted JSON matching 100% production requirements
    return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        // En producción el stack trace debe anularse, simularemos que process.env lo maneja
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
