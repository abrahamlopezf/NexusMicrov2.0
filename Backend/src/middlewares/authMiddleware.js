const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'nexus_super_secret_for_hekka_erp_core_production'
        );

        const userId = decoded.id || decoded.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload'
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.active) {
            return res.status(403).json({
                success: false,
                message: 'User account is inactive'
            });
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = auth;