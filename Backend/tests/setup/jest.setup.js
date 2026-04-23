// Importamos el db principal que ahora usará erp_test gracias a cross-env
const db = require('../../src/models');

beforeAll(async () => {
    try {
        await db.sequelize.authenticate();
        // Forzamos la sincronización para tener una base limpia
        await db.sequelize.sync({ force: true });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos de test:', error);
    }
});

afterAll(async () => {
    try {
        // Limpiamos y destruimos todas las tablas
        await db.sequelize.drop();
        // Cerramos la conexión a la base de datos
        await db.sequelize.close();
    } catch (error) {
        console.error('Error al cerrar la conexión a la base de datos de test:', error);
    }
});
