const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true }
    },
    email: {
        type: DataTypes.STRING(150),
        unique: true,
        allowNull: false,
        validate: { isEmail: true, notEmpty: true }
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'MANAGER', 'EMPLOYEE', 'CLIENT'),
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['role'] }
    ]
});

User.associate = function(models) {
    User.hasMany(models.AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
};

module.exports = User;