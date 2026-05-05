const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryMovement = sequelize.define("InventoryMovement", {
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
    type: {
        type: DataTypes.ENUM('ENTRADA_COMPRA', 'SALIDA_PRODUCCION', 'SALIDA_VENTA', 'AJUSTE', 'DEVOLUCION', 'ENTRADA_MANUAL', 'SALIDA_MANUAL'),
        allowNull: false,
        validate: { isIn: [['ENTRADA_COMPRA', 'SALIDA_PRODUCCION', 'SALIDA_VENTA', 'AJUSTE', 'DEVOLUCION', 'ENTRADA_MANUAL', 'SALIDA_MANUAL']] }
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "inventory_movements",
    timestamps: true,
    updatedAt: false, // Inmutable
    underscored: true,
    indexes: [
      { fields: ['material_id'] },
      { fields: ['reference_type', 'reference_id'] },
      { fields: ['type'] },
      { fields: ['created_at'] }
    ]
});

InventoryMovement.associate = function(models) {
    InventoryMovement.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
};

module.exports = InventoryMovement;
