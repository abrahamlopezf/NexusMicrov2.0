const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const ClientGarment = sequelize.define("ClientGarment", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    garment_type: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: { notEmpty: true }
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

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'ACTIVE'
    },

    notes: {
        type: DataTypes.TEXT,
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
    tableName: "client_garments",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['client_id'] },
        { fields: ['garment_type'] },
        { fields: ['status'] }
    ]
});

ClientGarment.associate = function (models) {
    ClientGarment.belongsTo(models.Client, {
        foreignKey: 'client_id',
        as: 'client'
    });

    ClientGarment.hasMany(models.GarmentMeasurement, {
        foreignKey: 'client_garment_id',
        as: 'measurements'
    });

    ClientGarment.hasMany(models.GarmentAnnotation, {
        foreignKey: 'client_garment_id',
        as: 'annotations'
    });

    ClientGarment.hasMany(models.SaleItem, {
        foreignKey: 'client_garment_id',
        as: 'saleItems'
    });

    ClientGarment.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    ClientGarment.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

module.exports = ClientGarment;