const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Purchase = sequelize.define('Purchase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    purchase_number: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true
    },

    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    purchase_type: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'MATERIAL_PURCHASE',
        validate: {
            isIn: [['MATERIAL_PURCHASE', 'ASSET_PURCHASE', 'EXPENSE_PURCHASE']]
        }
    },

    status: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'RECEIVED',
        validate: {
            isIn: [['DRAFT', 'RECEIVED', 'CANCELLED']]
        }
    },

    purchase_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    reference: {
        type: DataTypes.STRING(120),
        allowNull: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'purchases',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['supplier_id'] },
        { fields: ['status'] },
        { fields: ['purchase_date'] }
    ]
});

Purchase.associate = function(models) {
    Purchase.belongsTo(models.Supplier, {
        foreignKey: 'supplier_id',
        as: 'supplier'
    });

    Purchase.hasMany(models.PurchaseItem, {
        foreignKey: 'purchase_id',
        as: 'items'
    });

    Purchase.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });
};

module.exports = Purchase;