const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const IdempotencyKey = sequelize.define("IdempotencyKey", {
    idempotency_key: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    request_path: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    response_body: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    response_status: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    correlation_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    locked_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "idempotency_keys",
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = IdempotencyKey;
