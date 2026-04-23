const sequelize = require('./src/config/database');

async function run() {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS inventory_reservations (
                id SERIAL PRIMARY KEY,
                material_id INTEGER NOT NULL REFERENCES materials(id),
                sale_id INTEGER,
                sale_item_id INTEGER,
                quantity DECIMAL(12,4) NOT NULL,
                status VARCHAR(20) NOT NULL,
                operation_id UUID,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS inventory_reservations_op_id_idx ON inventory_reservations(operation_id) WHERE operation_id IS NOT NULL;
        `);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        process.exit();
    }
}
run();
