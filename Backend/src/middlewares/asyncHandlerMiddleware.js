/**
 * Wraps an async function to automatically catch errors and pass them to the next middleware.
 * Eliminates the need for repetitive try/catch blocks within controllers.
 * 
 * @param {Function} fn - The asynchronous controller function.
 * @returns {Function} Express middleware function.
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
