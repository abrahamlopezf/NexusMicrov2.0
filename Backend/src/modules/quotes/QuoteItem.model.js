const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const QuoteItem = sequelize.define("QuoteItem", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quote_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'quotes',
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
    custom_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        validate: { min: 0 }
    },
    unit_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    unit_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    cost_breakdown: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    materials_estimate: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "quote_items",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['quote_id'] },
        { fields: ['product_id'] }
    ]
});

QuoteItem.associate = function(models) {
    QuoteItem.belongsTo(models.Quote, { foreignKey: 'quote_id', as: 'quote' });
    QuoteItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
};

module.exports = QuoteItem;
