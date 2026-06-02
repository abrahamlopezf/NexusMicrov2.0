const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const CashSession = sequelize.define("CashSession", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'OPEN'
    },

    opening_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    expected_closing_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    actual_closing_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },

    difference_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },

    opened_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    closed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    opened_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    closed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    closing_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "cash_sessions",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['opened_by'] },
        { fields: ['opened_at'] }
    ]
});

CashSession.associate = function(models) {
    CashSession.hasMany(models.CashMovement, {
        foreignKey: 'cash_session_id',
        as: 'movements'
    });
};

module.exports = CashSession;