const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const WorkOrder = sequelize.define("WorkOrder", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // ═════════════════════════════════════════════════════
    // LEGACY RELATION (TEMPORARY)
    // ═════════════════════════════════════════════════════
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'id'
        }
    },

    // ═════════════════════════════════════════════════════
    // NEW ITEM-LEVEL RELATION
    // ═════════════════════════════════════════════════════
    sale_item_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'sale_items',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'PENDING'
    },

    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },

    end_date: {
        type: DataTypes.DATE,
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
    tableName: "work_orders",
    timestamps: true,
    underscored: true,

    indexes: [
        { fields: ['sale_id'] },
        { fields: ['sale_item_id'] },
        { fields: ['status'] }
    ]
});

WorkOrder.associate = function(models) {

    // LEGACY
    WorkOrder.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
    });

    // NEW
    WorkOrder.belongsTo(models.SaleItem, {
        foreignKey: 'sale_item_id',
        as: 'sale_item'
    });

    WorkOrder.hasMany(models.ProductionTask, {
        foreignKey: 'work_order_id',
        as: 'tasks'
    });
};

module.exports = WorkOrder;