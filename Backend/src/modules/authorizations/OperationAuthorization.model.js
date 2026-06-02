const { DataTypes } = require("sequelize");
const sequelize = require('../../config/database');

const OperationAuthorization = sequelize.define("OperationAuthorization", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    operation_type: {
        type: DataTypes.STRING(80),
        allowNull: false
    },

    target_type: {
        type: DataTypes.STRING(80),
        allowNull: false
    },

    target_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },

    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'APPROVED'
    },

    authorization_mode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'MANAGER_PASSWORD'
    },

    requested_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    authorized_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },

    authorized_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "operation_authorizations",
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['operation_type'] },
        { fields: ['target_type', 'target_id'] },
        { fields: ['requested_by'] },
        { fields: ['authorized_by'] },
        { fields: ['status'] },
        { fields: ['authorized_at'] }
    ]
});

OperationAuthorization.associate = function(models) {
    OperationAuthorization.belongsTo(models.User, {
        foreignKey: 'requested_by',
        as: 'requester'
    });

    OperationAuthorization.belongsTo(models.User, {
        foreignKey: 'authorized_by',
        as: 'authorizer'
    });
};

module.exports = OperationAuthorization;