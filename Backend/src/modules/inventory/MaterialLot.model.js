const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MaterialLot = sequelize.define(
    'MaterialLot',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        lot_origin: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'MANUAL'
        },

        origin_sale_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        origin_sale_item_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },

        origin_movement_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },

        lot_code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },

        stock_quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false,
            defaultValue: 0
        },

        unit_cost: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
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

        status: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'ACTIVE'
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
    },
    {
        tableName: 'material_lots',
        timestamps: true,
        paranoid: true,
        underscored: true
    }
);

MaterialLot.associate = function (models) {
    MaterialLot.belongsTo(models.Sale, {
        foreignKey: 'origin_sale_id',
        as: 'originSale'
    });

    MaterialLot.belongsTo(models.SaleItem, {
        foreignKey: 'origin_sale_item_id',
        as: 'originSaleItem'
    });

    MaterialLot.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    MaterialLot.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
    });

    MaterialLot.belongsTo(models.SaleItem, {
        foreignKey: 'sale_item_id',
        as: 'saleItem'
    });

    MaterialLot.hasMany(models.InventoryMovement, {
        foreignKey: 'material_lot_id',
        as: 'movements'
    });

    MaterialLot.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    MaterialLot.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

module.exports = MaterialLot;
