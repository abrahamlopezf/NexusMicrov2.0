const { ROLES, normalizeRole } = require('../utils/permissions');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const userRole = normalizeRole(req.user.role);
        const allowedRoles = roles.map(role => normalizeRole(role));

        // SUPER_ADMIN entra a todo.
        if (userRole === ROLES.SUPER_ADMIN) {
            return next();
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = authorize;