/**
 * Middleware for sanitizing user inputs.
 * xss-clean is disabled temporarily because it causes a TypeError in Express 5.
 * Rely on Zod / express-validator for input validation.
 */
module.exports = (req, res, next) => {
  next();
};