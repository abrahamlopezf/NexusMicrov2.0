/**
 * Catch-all middleware for handling undefined routes (404 Not Found).
 * Ensure this is placed at the very end of your route declarations in app.js
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route Not Found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = notFoundHandler;
