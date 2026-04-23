const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeatureFlag = sequelize.define("FeatureFlag", {
    name: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: "feature_flags",
    timestamps: true,
    createdAt: false,
    underscored: true
});

module.exports = FeatureFlag;
