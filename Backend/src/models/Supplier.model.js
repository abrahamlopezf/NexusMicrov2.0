const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Supplier = sequelize.define("Supplier", {
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
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        validate: { isEmail: true }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "suppliers",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['name'] }
    ]
});

Supplier.associate = function(models) {
    Supplier.hasMany(models.PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });
};

module.exports = Supplier;
