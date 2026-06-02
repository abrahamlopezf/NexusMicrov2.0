const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const Account = sequelize.define("Account", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true }
    },
    type: {
        type: DataTypes.ENUM('CAJA', 'BANCO'),
        allowNull: false,
        validate: { isIn: [['CAJA', 'BANCO']] }
    },
    balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: "accounts",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['type'] }
    ]
});

Account.associate = function(models) {
    Account.hasMany(models.FinancialMovement, { foreignKey: 'account_id', as: 'movements' });
    Account.hasMany(models.Payment, { foreignKey: 'account_id', as: 'payments' });
};

module.exports = Account;
