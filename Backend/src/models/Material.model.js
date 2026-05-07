const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Material = sequelize.define("Material", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    current_stock: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 } // Constraint preventivo
    },
    reserved_stock: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    available_stock: {
        type: DataTypes.VIRTUAL,
        get() {
            return parseFloat(this.current_stock || 0) - parseFloat(this.reserved_stock || 0);
        }
    },
    min_stock: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'suppliers',
            key: 'id'
        }
    }
}, {
    tableName: "materials",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['name'] }
    ]
});

Material.associate = function(models) {
    Material.hasMany(models.ProductMaterial, { foreignKey: 'material_id', as: 'product_materials' });
    Material.hasMany(models.InventoryMovement, { foreignKey: 'material_id', as: 'inventory_movements' });
    Material.hasMany(models.PurchaseItem, { foreignKey: 'material_id', as: 'purchase_items' });
};

module.exports = Material;
