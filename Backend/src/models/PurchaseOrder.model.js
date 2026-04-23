const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PurchaseOrder = sequelize.define("PurchaseOrder", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'suppliers',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
        validate: { isIn: [['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA']] }
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    }
}, {
    tableName: "purchase_orders",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['supplier_id'] },
        { fields: ['status'] }
    ]
});

PurchaseOrder.associate = function(models) {
    PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    PurchaseOrder.hasMany(models.PurchaseItem, { foreignKey: 'purchase_order_id', as: 'items' });
};

module.exports = PurchaseOrder;
