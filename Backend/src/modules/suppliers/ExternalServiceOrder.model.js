const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ExternalServiceOrder = sequelize.define('ExternalServiceOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    service_number: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true
    },

    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    sale_item_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },

    work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    service_type: {
        type: DataTypes.STRING(80),
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 1
    },

    unit_cost: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0
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

    total_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    status: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
            isIn: [['PENDING', 'SENT', 'IN_PROGRESS', 'RECEIVED', 'CANCELLED']]
        }
    },

    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    expected_return_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    received_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    metadata: {
        type: DataTypes.JSONB,
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
    tableName: 'external_service_orders',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['supplier_id'] },
        { fields: ['sale_id'] },
        { fields: ['sale_item_id'] },
        { fields: ['status'] }
    ]
});

ExternalServiceOrder.associate = function(models) {
    ExternalServiceOrder.belongsTo(models.Supplier, {
        foreignKey: 'supplier_id',
        as: 'supplier'
    });

    ExternalServiceOrder.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
    });

    ExternalServiceOrder.belongsTo(models.SaleItem, {
        foreignKey: 'sale_item_id',
        as: 'saleItem'
    });

    ExternalServiceOrder.belongsTo(models.WorkOrder, {
        foreignKey: 'work_order_id',
        as: 'workOrder'
    });

    ExternalServiceOrder.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });
};

module.exports = ExternalServiceOrder;