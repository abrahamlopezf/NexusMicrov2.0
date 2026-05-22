const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const GarmentMeasurement = sequelize.define("GarmentMeasurement", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    client_garment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },

    measurement_data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    },

    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'CM'
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    taken_by: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    tableName: "garment_measurements",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['client_garment_id'] },
        { fields: ['version'] },
        { fields: ['is_active'] }
    ]
});

GarmentMeasurement.associate = function (models) {
    GarmentMeasurement.belongsTo(models.ClientGarment, {
        foreignKey: 'client_garment_id',
        as: 'garment'
    });

    GarmentMeasurement.hasMany(models.GarmentAnnotation, {
        foreignKey: 'measurement_id',
        as: 'annotations'
    });

    GarmentMeasurement.hasMany(models.SaleItem, {
        foreignKey: 'measurement_id',
        as: 'saleItems'
    });

    GarmentMeasurement.belongsTo(models.User, {
        foreignKey: 'taken_by',
        as: 'takenBy'
    });

    GarmentMeasurement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    GarmentMeasurement.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

module.exports = GarmentMeasurement;