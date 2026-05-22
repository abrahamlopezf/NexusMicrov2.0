const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Material = sequelize.define(
    'Material',
    {
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
        },
        sku: { type: DataTypes.STRING(80), allowNull: true, unique: true },
        category_id: { type: DataTypes.INTEGER, allowNull: true },
        subcategory_id: { type: DataTypes.INTEGER, allowNull: true },
        color: { type: DataTypes.STRING(80), allowNull: true },
        size: { type: DataTypes.STRING(80), allowNull: true },
        brand: { type: DataTypes.STRING(120), allowNull: true },
        inventory_type: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'CONSUMABLE'
        },
        tracking_method: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'STOCK' },
        affects_product_cost: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        costing_method: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'LAST_COST' },
        cost_updated_at: { type: DataTypes.DATE, allowNull: true },
        status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'ACTIVE' },
        created_by: { type: DataTypes.INTEGER, allowNull: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'materials',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [{ fields: ['name'] }]
    }
);

Material.associate = function (models) {
    Material.hasMany(models.ProductMaterial, { 
        foreignKey: 'material_id',
        as: 'product_materials'
    });
    Material.hasMany(models.InventoryMovement, {
        foreignKey: 'material_id',
        as: 'inventory_movements'
    });
    Material.hasMany(models.PurchaseItem, { foreignKey: 'material_id', as: 'purchase_items' });
    Material.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Material.belongsTo(models.MaterialCategory, {
        foreignKey: 'category_id',
        as: 'category'
    });

    Material.belongsTo(models.MaterialSubcategory, {
        foreignKey: 'subcategory_id',
        as: 'subcategory'
    });

    Material.hasMany(models.MaterialCostHistory, {
        foreignKey: 'material_id',
        as: 'cost_history'
    });

    Material.hasMany(models.MaterialLot, {
        foreignKey: 'material_id',
        as: 'lots'
    });
};

module.exports = Material;
