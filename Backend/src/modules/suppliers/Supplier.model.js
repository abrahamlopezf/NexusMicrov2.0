const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Supplier = sequelize.define(
    'Supplier',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.STRING(180),
            allowNull: false,
            validate: { notEmpty: true }
        },

        business_name: {
            type: DataTypes.STRING(180),
            allowNull: true
        },

        rfc: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        supplier_type: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: 'MATERIAL_SUPPLIER',
            validate: {
                isIn: [['MATERIAL_SUPPLIER', 'SERVICE_SUPPLIER', 'MIXED']]
            }
        },

        phone: {
            type: DataTypes.STRING(30),
            allowNull: true
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: true,
            validate: {
                isEmailOrEmpty(value) {
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        throw new Error('Invalid email');
                    }
                }
            }
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        contact_name: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        payment_terms: {
            type: DataTypes.STRING(80),
            allowNull: true
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'ACTIVE',
            validate: {
                isIn: [['ACTIVE', 'INACTIVE']]
            }
        },

        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },
    {
        tableName: 'suppliers',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [{ fields: ['supplier_type'] }, { fields: ['status'] }, { fields: ['name'] }]
    }
);

Supplier.associate = function (models) {
    Supplier.hasMany(models.Material, {
        foreignKey: 'supplier_id',
        as: 'materials'
    });

    Supplier.hasMany(models.Purchase, {
        foreignKey: 'supplier_id',
        as: 'purchases'
    });

    Supplier.hasMany(models.ExternalServiceOrder, {
        foreignKey: 'supplier_id',
        as: 'external_services'
    });
};

module.exports = Supplier;
