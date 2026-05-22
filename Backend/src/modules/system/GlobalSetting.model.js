const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const GlobalSetting = sequelize.define("GlobalSetting", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    operational_factor: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.14,
        comment: "Ej. 0.14 para un 14% de gasto operativo"
    },
    profit_margin: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.20,
        comment: "Ej. 0.20 para un 20% de ganancia"
    },
    labor_rate_pattern: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 50.50,
        comment: "Tarifa por hora de patronista"
    },
    labor_rate_sewing: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 44.38,
        comment: "Tarifa por hora de confeccion"
    },
    fixed_supplies_costs: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            SENCILLO: 30.00,
            REGULAR: 40.00,
            ESPECIAL: 50.00,
            SASTRERIA: 60.00,
            OTRO: 90.00,
            MAXIMO: 100.00,
            PREMIUM: 150.00
        },
        comment: "Mapeo de Insumos Fijos por Niveles"
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "global_settings",
    timestamps: true,
    underscored: true
});

GlobalSetting.associate = function(models) {
    if (models.User) {
        GlobalSetting.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
    }
};

module.exports = GlobalSetting;
