const sequelize = require('./src/config/database');

async function run() {
    try {
        await sequelize.query('ALTER TABLE materials ADD COLUMN reserved_stock DECIMAL(12,4) DEFAULT 0;');
        console.log("Migration successful");
    } catch (e) {
        if (e.message.includes('already exists')) {
             console.log("Column already exists");
        } else {
             console.error("Migration failed", e);
        }
    } finally {
        process.exit();
    }
}
run();
