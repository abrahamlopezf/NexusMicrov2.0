const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StockAlert = sequelize.define("StockAlert", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'materials',
            key: 'id'
        }
    },
    message: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    level: {
        type: DataTypes.ENUM('LOW', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'LOW'
    },
    current_stock: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    min_stock: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    resolved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    correlation_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "stock_alerts",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['material_id'],
            where: { resolved: false },
            name: 'unique_unresolved_alert_per_material'
        }
    ]
});

StockAlert.associate = function(models) {
    StockAlert.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
};

module.exports = StockAlert;
