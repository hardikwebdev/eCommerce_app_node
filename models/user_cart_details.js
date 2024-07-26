"use strict";

module.exports = (sequelize, DataTypes) => {
    let UserCartDetails = sequelize.define(
        "UserCartDetails",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            seller_id: DataTypes.INTEGER,
            product_id: DataTypes.INTEGER,
            amount: DataTypes.INTEGER,
            color: DataTypes.STRING,
            size: DataTypes.STRING,
            quantity: DataTypes.INTEGER,
            rental_period: DataTypes.STRING,
            shipping_type: DataTypes.TEXT,
            start_date: DataTypes.DATE,
            end_date: DataTypes.DATE,
            status: DataTypes.TINYINT, // 0:Pending, 1: Ordered
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "user_cart_details",
            paranoid: true
        },
    );

    return UserCartDetails;
};