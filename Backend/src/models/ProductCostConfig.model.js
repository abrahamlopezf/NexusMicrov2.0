const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductCostConfig = sequelize.define("ProductCostConfig", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    sewing_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    pattern_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    fixed_supply_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    operation_margin: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
    },
    profit_margin: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true
    },
    allow_manual_price: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "product_cost_configs",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['product_id'] }
    ]
});

ProductCostConfig.associate = function(models) {
    ProductCostConfig.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
};

module.exports = ProductCostConfig;
