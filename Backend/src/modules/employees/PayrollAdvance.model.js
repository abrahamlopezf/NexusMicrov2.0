const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const PayrollAdvance = sequelize.define("PayrollAdvance", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('PENDIENTE', 'DESCONTADO', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
        validate: { isIn: [['PENDIENTE', 'DESCONTADO', 'CANCELADO']] }
    }
}, {
    tableName: "payroll_advances",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['status'] }
    ]
});

PayrollAdvance.associate = function(models) {
    PayrollAdvance.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
};

module.exports = PayrollAdvance;
