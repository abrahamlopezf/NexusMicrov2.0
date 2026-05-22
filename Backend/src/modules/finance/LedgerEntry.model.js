const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const LedgerEntry = sequelize.define("LedgerEntry", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entry_group_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    account_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    debit: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    credit: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    reference_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    correlation_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: "ledger_entries",
    timestamps: true,
    updatedAt: false, // Append-only structure
    underscored: true,
    indexes: [
        { fields: ['entry_group_id'] },
        { fields: ['reference_type', 'reference_id'] }
    ]
});

module.exports = LedgerEntry;
