const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define("AuditLog", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    table_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    old_values: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    new_values: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    correlation_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    endpoint: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
}, {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { fields: ['correlation_id'] }
    ]
});

module.exports = AuditLog;
