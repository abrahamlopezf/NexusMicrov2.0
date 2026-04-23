const AuthService = require('../services/AuthService');
const AppError = require('../utils/AppError');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        const authData = await AuthService.login(email, password);
        
        res.status(200).json({
            status: 'success',
            data: authData
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        // En este punto, el middleware requireAuth ya colocó req.user
        res.status(200).json({
            status: 'success',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        next(error);
    }
};
