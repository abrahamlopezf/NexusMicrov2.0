const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const CashMovement = sequelize.define("CashMovement", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    cash_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cash_sessions',
            key: 'id'
        }
    },

    payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payments',
            key: 'id'
        }
    },

    movement_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    source: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'MANUAL'
    },

    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    reference: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'ACTIVE'
    },

    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "cash_movements",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['cash_session_id'] },
        { fields: ['payment_id'] },
        { fields: ['movement_type'] },
        { fields: ['source'] },
        { fields: ['status'] }
    ]
});

CashMovement.associate = function(models) {
    CashMovement.belongsTo(models.CashSession, {
        foreignKey: 'cash_session_id',
        as: 'session'
    });

    CashMovement.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        as: 'payment'
    });
};

module.exports = CashMovement;