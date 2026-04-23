/**
 * Standardized success response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Data to send
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        error: null,
    });
};

/**
 * Standardized error response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @param {Object} error - Detailed error object (optional)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
    const response = {
        success: false,
        message,
        data: null,
        error: error || message,
    };

    // Include stack trace in development mode only
    if (process.env.NODE_ENV === 'development' && error && error.stack) {
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse,
};
