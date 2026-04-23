const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {
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
        }
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'accounts',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reference: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'PARCIAL'
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
    tableName: "payments",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { fields: ['sale_id'] },
        { fields: ['account_id'] },
        { fields: ['payment_method'] }
    ]
});

Payment.associate = function(models) {
    Payment.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    Payment.belongsTo(models.Account, { foreignKey: 'account_id', as: 'account' });
};

module.exports = Payment;
