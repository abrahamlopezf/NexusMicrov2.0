const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const Employee = sequelize.define("Employee", {
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
    role: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    salary_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: "employees",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['active'] }
    ]
});

Employee.associate = function(models) {
    Employee.hasMany(models.ProductionTask, { foreignKey: 'employee_id', as: 'production_tasks' });
};

module.exports = Employee;
