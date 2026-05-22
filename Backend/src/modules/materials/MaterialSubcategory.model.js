const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const MaterialSubcategory = sequelize.define("MaterialSubcategory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    tableName: "material_subcategories",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['category_id', 'code'] }
    ]
});

MaterialSubcategory.associate = function(models) {
    MaterialSubcategory.belongsTo(models.MaterialCategory, {
        foreignKey: 'category_id',
        as: 'category'
    });

    MaterialSubcategory.hasMany(models.Material, {
        foreignKey: 'subcategory_id',
        as: 'materials'
    });
};

module.exports = MaterialSubcategory;