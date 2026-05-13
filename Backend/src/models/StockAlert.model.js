const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAlert = sequelize.define('StockAlert', {
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
        type: DataTypes.STRING,
        allowNull: false
    },
    level: {
        type: DataTypes.ENUM('LOW', 'CRITICAL'),
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
        defaultValue: false
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'stock_alerts',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['material_id'],
            where: {
                resolved: false
            }
        }
    ]
});

StockAlert.associate = (models) => {
    StockAlert.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });
};

module.exports = StockAlert;
