require('dotenv').config();

const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    db: {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
};

// Validaciones básicas de entorno
if (config.nodeEnv === 'production') {
    const requiredEnv = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'JWT_SECRET'];
    const missing = requiredEnv.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno requeridas en producción: ${missing.join(', ')}`);
    }
}

module.exports = config;