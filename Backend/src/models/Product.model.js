const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'pcs'
    },
    base_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    legacy_hours_pattern: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    legacy_hours_sewing: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    legacy_fixed_supply_tier: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    is_custom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    attributes: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    current_stock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    min_stock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
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
    tableName: "products",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['name'] }
    ]
});

Product.associate = function(models) {
    Product.hasMany(models.SaleItem, { foreignKey: 'product_id', as: 'sale_items' });
    Product.hasMany(models.QuoteItem, { foreignKey: 'product_id', as: 'quote_items' });
    Product.hasMany(models.ProductMaterial, { foreignKey: 'product_id', as: 'materials' });
    Product.hasMany(models.ProductionTask, { foreignKey: 'product_id', as: 'production_tasks' });
    Product.hasOne(models.ProductCostConfig, { foreignKey: 'product_id', as: 'cost_config' });
};

module.exports = Product;
