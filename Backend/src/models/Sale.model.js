const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Sale = sequelize.define("Sale", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sale_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        validate: { notEmpty: true }
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clients',
            key: 'id'
        }
    },
    quote_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'quotes',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
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
        validate: { min: 0 }
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
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    is_urgent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    loyalty_applied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: "sales",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['sale_number'] },
        { fields: ['client_id'] },
        { fields: ['quote_id'] },
        { fields: ['status'] }
    ]
});

Sale.associate = function(models) {
    Sale.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Sale.belongsTo(models.Quote, { foreignKey: 'quote_id', as: 'quote' });
    Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id', as: 'items' });
    Sale.hasOne(models.WorkOrder, { foreignKey: 'sale_id', as: 'work_order' });
    Sale.hasMany(models.Payment, { foreignKey: 'sale_id', as: 'payments' });
};

module.exports = Sale;
