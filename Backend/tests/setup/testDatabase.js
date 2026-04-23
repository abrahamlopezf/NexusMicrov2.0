const { Sequelize } = require('sequelize');
require('dotenv').config();

// Creamos una instancia de Sequelize específicamente para la base de datos de test
const sequelizeTest = new Sequelize(
    'erp_test', // Nombre de BD fija para testing 
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Deshabilitar logs en tests para consola limpia
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = { sequelizeTest };
