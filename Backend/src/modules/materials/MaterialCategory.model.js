const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const MaterialCategory = sequelize.define("MaterialCategory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    tableName: "material_categories",
    timestamps: true,
    paranoid: true,
    underscored: true
});

MaterialCategory.associate = function(models) {
    MaterialCategory.hasMany(models.MaterialSubcategory, {
        foreignKey: 'category_id',
        as: 'subcategories'
    });

    MaterialCategory.hasMany(models.Material, {
        foreignKey: 'category_id',
        as: 'materials'
    });
};

module.exports = MaterialCategory;