const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductionTask = sequelize.define("ProductionTask", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'work_orders',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    task_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    real_materials_used: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER, // duration in minutes or seconds
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
    tableName: "production_tasks",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['work_order_id'] },
        { fields: ['employee_id'] },
        { fields: ['status'] }
    ]
});

ProductionTask.associate = function(models) {
    ProductionTask.belongsTo(models.WorkOrder, { foreignKey: 'work_order_id', as: 'work_order' });
    ProductionTask.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    ProductionTask.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
};

module.exports = ProductionTask;
