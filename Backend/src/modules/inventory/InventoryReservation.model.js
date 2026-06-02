const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const InventoryReservation = sequelize.define('InventoryReservation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sale_item_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'RESERVED' // 'RESERVED', 'CONSUMED', 'RELEASED'
    },
    operation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'inventory_reservations',
    timestamps: true,
    underscored: true
});

InventoryReservation.associate = function(models) {
    InventoryReservation.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
    if (models.Sale) {
        InventoryReservation.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    }
    if (models.SaleItem) {
        InventoryReservation.belongsTo(models.SaleItem, { foreignKey: 'sale_item_id', as: 'sale_item' });
    }
};

module.exports = InventoryReservation;
