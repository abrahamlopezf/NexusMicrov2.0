const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const AppError = require('../../utils/AppError');

class AuthService {
    static async login(email, password) {
        const normalizedEmail = String(email || '').trim().toLowerCase();

        const user = await User.findOne({
            where: {
                email: normalizedEmail,
                active: true
            }
        });

        if (!user) {
            throw new AppError('Credenciales inválidas', 401);
        }

        let isMatch = await bcrypt.compare(password, user.password);

        // Compatibilidad temporal: migra password plano a bcrypt.
        if (!isMatch && password === user.password) {
            isMatch = true;
            user.password = await bcrypt.hash(password, 10);
        }

        if (!isMatch) {
            throw new AppError('Credenciales inválidas', 401);
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET || 'nexus_super_secret_for_hekka_erp_core_production',
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '12h'
            }
        );

        user.last_login = new Date();
        await user.save();

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active
            },
            token
        };
    }
}

module.exports = AuthService;