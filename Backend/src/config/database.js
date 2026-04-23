const { Sequelize } = require('sequelize');
const config = require('./env');

const loggingConfig = false; // Disabled to reduce verbosity in console. Set to console.log to debug SQL.

const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: loggingConfig,
        /*dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },*/
        pool: {
            max: 20,
            min: 2,
            acquire: 30000,
            idle: 10000,
            evict: 10000
        },
        retry: {
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            name: 'query',
            backoffBase: 1000,
            backoffExponent: 1.5,
            timeout: 60000,
            max: 5
        }
    }
);

// Autenticación inicial con manejo de reintentos en el arranque
const logger = require('../utils/logger'); // Ensure winston is here

const connectToDatabase = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            await sequelize.authenticate();
            logger.info('✅ Database connected successfully');
            return true;
        } catch (error) {
            retries -= 1;
            logger.error(`❌ Database connection error (Retries left: ${retries}): ${error.message}`);
            if (retries === 0) {
                logger.error('💥 Failed to connect to DB strictly. Process will exit.');
                process.exit(1);
            }
            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

connectToDatabase();

module.exports = sequelize;