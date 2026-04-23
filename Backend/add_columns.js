const sequelize = require('./src/config/database');

async function runMigration() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('sale_items', 'real_materials_used', {
            type: sequelize.Sequelize.JSONB,
            allowNull: true
        });
        await queryInterface.addColumn('sale_items', 'was_price_overridden', {
            type: sequelize.Sequelize.BOOLEAN,
            defaultValue: false
        });
        await queryInterface.addColumn('sale_items', 'original_price', {
            type: sequelize.Sequelize.DECIMAL(12, 2),
            allowNull: true
        });
        console.log('Columns added successfully');
    } catch (e) {
        console.error('Error adding columns:', e);
    } finally {
        process.exit();
    }
}

runMigration();
