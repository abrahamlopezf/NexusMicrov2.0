const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SaleMaterialRequirement = sequelize.define(
    'SaleMaterialRequirement',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        sale_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        sale_item_id: {
            type: DataTypes.BIGINT,
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

        source: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'MANUAL_EXTRA'
        },

        quantity_per_unit: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        item_quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        estimated_quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false,
            defaultValue: 0
        },

        margin_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },

        planned_quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false,
            defaultValue: 0
        },

        estimated_waste: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false,
            defaultValue: 0
        },

        unit: {
            type: DataTypes.STRING(50),
            allowNull: true
        },

        status: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'PLANNED',
            validate: {
                isIn: [['PLANNED', 'RESERVED', 'CONSUMED', 'CANCELLED']]
            }
        },

        consumed_quantity: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: true
        },

        consumed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        consumed_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        consumption_metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        metadata: {
            type: DataTypes.JSONB,
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
        tableName: 'sale_material_requirements',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            { fields: ['sale_id'] },
            { fields: ['sale_item_id'] },
            { fields: ['material_id'] },
            { fields: ['material_lot_id'] },
            { fields: ['source'] },
            { fields: ['status'] }
        ]
    }
);

SaleMaterialRequirement.associate = function (models) {
    SaleMaterialRequirement.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
    });

    SaleMaterialRequirement.belongsTo(models.SaleItem, {
        foreignKey: 'sale_item_id',
        as: 'saleItem'
    });

    SaleMaterialRequirement.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    SaleMaterialRequirement.belongsTo(models.MaterialLot, {
        foreignKey: 'material_lot_id',
        as: 'lot'
    });

    SaleMaterialRequirement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });
};

module.exports = SaleMaterialRequirement;
