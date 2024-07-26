"use strict";

module.exports = (sequelize, DataTypes) => {
    let UserPaymentMethods = sequelize.define(
        "UserPaymentMethods",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            customer_id: DataTypes.STRING,
            type: DataTypes.TINYINT, // 0: Stripe, 1: Paypal
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "user_payment_methods",
            paranoid: true
        },
    );

    return UserPaymentMethods;
};