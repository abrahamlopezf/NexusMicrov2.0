const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');

class AuthService {
    static async login(email, password) {
        const user = await User.findOne({ where: { email, active: true } });
        
        if (!user) {
            throw new AppError('Credenciales inválidas', 401);
        }

        let isMatch = await bcrypt.compare(password, user.password);
        
        // Auto-actualizar contraseñas en texto plano (como "password123") a hashes bcrypt de forma segura
        if (!isMatch && password === user.password) {
            isMatch = true;
            user.password = await bcrypt.hash(password, 10);
            // El guardado se hará más abajo junto con last_login
        }

        if (!isMatch) {
            throw new AppError('Credenciales inválidas', 401);
        }

        // RNF-03: Autenticación JWT Segura temporal o de .env
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name }, 
            process.env.JWT_SECRET || 'nexus_super_secret_for_hekka_erp_core_production',
            { expiresIn: '12h' }
        );

        user.last_login = new Date();
        await user.save();

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        };
    }
}

module.exports = AuthService;
