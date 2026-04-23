const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PurchaseItem = sequelize.define("PurchaseItem", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'purchase_orders',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'materials',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        validate: { min: 0 }
    },
    unit_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    }
}, {
    tableName: "purchase_items",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['purchase_order_id'] },
        { fields: ['material_id'] }
    ]
});

PurchaseItem.associate = function(models) {
    PurchaseItem.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });
    PurchaseItem.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
};

module.exports = PurchaseItem;
