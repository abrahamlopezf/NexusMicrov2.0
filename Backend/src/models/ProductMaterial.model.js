const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductMaterial = sequelize.define("ProductMaterial", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'materials',
            key: 'id'
        }
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
    }
}, {
    tableName: "product_materials",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['product_id', 'material_id'] },
        { fields: ['material_id'] }
    ]
});

ProductMaterial.associate = function(models) {
    ProductMaterial.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    ProductMaterial.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
};

module.exports = ProductMaterial;
