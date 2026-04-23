/**
 * Middleware to inject standard response formatters into the `res` object.
 * Provides `res.success(data, message)` and standardizes outputs.
 */
const responseFormatter = (req, res, next) => {
    
    // Override default json optionally or just provide a helper
    res.success = (data = {}, message = "", statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            data,
            message
        });
    };

    next();
};

module.exports = responseFormatter;
