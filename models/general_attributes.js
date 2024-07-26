"use strict";

module.exports = (sequelize, DataTypes) => {
    let GeneralAttributes = sequelize.define(
        "GeneralAttributes",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            meta_type: DataTypes.STRING,
            meta_value: DataTypes.TEXT,
            status: DataTypes.TINYINT, // 0: Inactive, 1: Active
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "general_attributes",
            paranoid: true
        },
    );

    return GeneralAttributes;
};