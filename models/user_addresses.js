"use strict";

module.exports = (sequelize, DataTypes) => {
    let UserAddresses = sequelize.define(
        "UserAddresses",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            name: DataTypes.STRING,
            address: DataTypes.STRING,
            zip_code: DataTypes.STRING,
            phone_number: DataTypes.STRING,
            type: DataTypes.TINYINT, // 0: Shipping Address, 1: Billing Address
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "user_addresses",
            paranoid: true
        },
    );

    UserAddresses.associate = function (models) {
        this.user_id = this.belongsTo(models.Users, {
            foreignKey: "user_id",
            onDelete: 'cascade',
            hooks: true,
        });
    };

    return UserAddresses;
};