const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    material_lot_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    inventory_movement_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },

    quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false
    },

    unit_cost: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false
    },

    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    scope_type: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'GENERAL'
    },

    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    sale_item_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'purchase_items',
    timestamps: true,
    paranoid: true,
    underscored: true
});

PurchaseItem.associate = function(models) {
    PurchaseItem.belongsTo(models.Purchase, {
        foreignKey: 'purchase_id',
        as: 'purchase'
    });

    PurchaseItem.belongsTo(models.PurchaseOrder, {
        foreignKey: 'purchase_order_id',
        as: 'purchase_order'
    });

    PurchaseItem.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    PurchaseItem.belongsTo(models.MaterialLot, {
        foreignKey: 'material_lot_id',
        as: 'lot'
    });

    PurchaseItem.belongsTo(models.InventoryMovement, {
        foreignKey: 'inventory_movement_id',
        as: 'inventory_movement'
    });

    PurchaseItem.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
    });

    PurchaseItem.belongsTo(models.SaleItem, {
        foreignKey: 'sale_item_id',
        as: 'saleItem'
    });
};

module.exports = PurchaseItem;
