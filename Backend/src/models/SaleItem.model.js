const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SaleItem = sequelize.define("SaleItem", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    unit_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    unit_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    custom_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    materials_estimate: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    real_materials_used: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    was_price_overridden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    original_price: {
        type: DataTypes.DECIMAL(12, 2),
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
    cost_breakdown: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: "sale_items",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['sale_id'] },
        { fields: ['product_id'] }
    ]
});

SaleItem.associate = function(models) {
    SaleItem.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
};

module.exports = SaleItem;
