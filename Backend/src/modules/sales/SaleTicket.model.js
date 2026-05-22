const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const SaleTicket = sequelize.define("SaleTicket", {
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

    ticket_number: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true
    },

    ticket_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'SALE_SUMMARY'
    },

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'ISSUED'
    },

    snapshot: {
        type: DataTypes.JSONB,
        allowNull: false
    },

    issued_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
    tableName: "sale_tickets",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['sale_id'] },
        { fields: ['ticket_number'] },
        { fields: ['ticket_type'] },
        { fields: ['status'] }
    ]
});

SaleTicket.associate = function (models) {
    SaleTicket.belongsTo(models.Sale, {foreignKey: 'sale_id', as: 'sale'});
};

module.exports = SaleTicket;