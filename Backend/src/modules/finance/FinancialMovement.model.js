const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const FinancialMovement = sequelize.define("FinancialMovement", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'accounts',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('INGRESO', 'EGRESO'),
        allowNull: false,
        validate: { isIn: [['INGRESO', 'EGRESO']] }
    },
    concept: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "financial_movements",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { fields: ['account_id'] },
        { fields: ['type'] },
        { fields: ['reference_type', 'reference_id'] }
    ]
});

FinancialMovement.associate = function(models) {
    FinancialMovement.belongsTo(models.Account, { foreignKey: 'account_id', as: 'account' });
};

module.exports = FinancialMovement;
