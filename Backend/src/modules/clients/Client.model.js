const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const Client = sequelize.define("Client", {
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
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        validate: { isEmail: true }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "clients",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['name'] },
        { fields: ['phone'] }
    ]
});

Client.associate = function (models) {
    Client.hasMany(models.Sale, { foreignKey: 'client_id', as: 'sales' });
    Client.hasMany(models.Quote, { foreignKey: 'client_id', as: 'quotes' });
    Client.hasMany(models.ClientGarment, { foreignKey: 'client_id', as: 'garments' });
};

module.exports = Client;