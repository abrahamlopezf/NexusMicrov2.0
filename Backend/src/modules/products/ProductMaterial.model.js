const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const ProductMaterial = sequelize.define("ProductMaterial", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    material_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    required_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    required_subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    material_role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'SUPPLY'
    },

    quantity: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        validate: { min: 0 }
    },

    waste_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
    },

    is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    is_selectable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    auto_add: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "product_materials",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['product_id'] },
        { fields: ['material_id'] },
        { fields: ['required_category_id'] },
        { fields: ['required_subcategory_id'] },
        { fields: ['material_role'] },
        { fields: ['active'] }
    ]
});

ProductMaterial.associate = function(models) {
    ProductMaterial.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
    });

    ProductMaterial.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
    });

    ProductMaterial.belongsTo(models.MaterialCategory, {
        foreignKey: 'required_category_id',
        as: 'requiredCategory'
    });

    ProductMaterial.belongsTo(models.MaterialSubcategory, {
        foreignKey: 'required_subcategory_id',
        as: 'requiredSubcategory'
    });
};

module.exports = ProductMaterial;