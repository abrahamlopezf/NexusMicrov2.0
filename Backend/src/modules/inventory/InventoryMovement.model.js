const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const INVENTORY_MOVEMENT_TYPES = [
    'ENTRADA_COMPRA',
    'ENTRADA_REUTILIZABLE',
    'SALIDA_PRODUCCION',
    'SALIDA_VENTA',
    'AJUSTE',
    'DEVOLUCION',
    'ENTRADA_MANUAL',
    'SALIDA_MANUAL'
];

const InventoryMovement = sequelize.define(
    'InventoryMovement',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        material_lot_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        type: {
            type: DataTypes.ENUM(...INVENTORY_MOVEMENT_TYPES),
            allowNull: false,
            validate: {
                isIn: [INVENTORY_MOVEMENT_TYPES]
            }
        },

        quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false
        },

        reference_type: {
            type: DataTypes.STRING(50),
            allowNull: true
        },

        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        previous_stock: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        new_stock: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        previous_lot_stock: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        new_lot_stock: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        unit_cost: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        total_cost: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'ACTIVE'
        },

        cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        cancellation_reason: {
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
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    },
    {
        tableName: 'inventory_movements',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['material_id'] },
            { fields: ['material_lot_id'] },
            { fields: ['reference_type', 'reference_id'] },
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['created_at'] }
        ]
    }
);

InventoryMovement.associate = function (models) {
    InventoryMovement.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    InventoryMovement.belongsTo(models.MaterialLot, {
        foreignKey: 'material_lot_id',
        as: 'lot'
    });

    InventoryMovement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    InventoryMovement.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

InventoryMovement.TYPES = INVENTORY_MOVEMENT_TYPES;

module.exports = InventoryMovement;