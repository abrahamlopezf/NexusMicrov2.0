const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const GarmentAnnotation = sequelize.define("GarmentAnnotation", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    client_garment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    measurement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    note_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'GENERAL'
    },

    note: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },

    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "garment_annotations",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['client_garment_id'] },
        { fields: ['measurement_id'] },
        { fields: ['note_type'] }
    ]
});

GarmentAnnotation.associate = function(models) {
    GarmentAnnotation.belongsTo(models.ClientGarment, {
        foreignKey: 'client_garment_id',
        as: 'garment'
    });

    GarmentAnnotation.belongsTo(models.GarmentMeasurement, {
        foreignKey: 'measurement_id',
        as: 'measurement'
    });

    GarmentAnnotation.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    GarmentAnnotation.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

module.exports = GarmentAnnotation;