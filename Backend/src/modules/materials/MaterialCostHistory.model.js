const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const MaterialCostHistory = sequelize.define("MaterialCostHistory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    material_id: { type: DataTypes.INTEGER, allowNull: false },
    previous_cost: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    new_cost: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'MANUAL' },
    created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: "material_cost_history",
    timestamps: true,
    updatedAt: false,
    underscored: true
});

MaterialCostHistory.associate = function(models) {
    MaterialCostHistory.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    MaterialCostHistory.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });
};

module.exports = MaterialCostHistory;