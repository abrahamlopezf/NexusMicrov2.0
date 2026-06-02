const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const Quote = sequelize.define("Quote", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quote_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        validate: { notEmpty: true }
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clients',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'DRAFT',
        validate: { isIn: [['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED']] }
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    valid_until: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    pricing_snapshot: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "quotes",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['quote_number'] },
        { fields: ['client_id'] },
        { fields: ['status'] }
    ]
});

Quote.associate = function(models) {
    Quote.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Quote.hasMany(models.QuoteItem, { foreignKey: 'quote_id', as: 'items' });
    Quote.hasOne(models.Sale, { foreignKey: 'quote_id', as: 'sale' });
};

module.exports = Quote;
