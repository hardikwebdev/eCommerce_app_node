"use strict";

module.exports = (sequelize, DataTypes) => {
    let StripeCustomers = sequelize.define(
        "StripeCustomers",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            customer_id: DataTypes.STRING,
            account_id: DataTypes.STRING,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "stripe_customers",
            paranoid: true
        },
    );

    StripeCustomers.associate = function (models) {
        this.user_id = this.belongsTo(models.Users, {
            foreignKey: "user_id",
            onDelete: 'cascade',
            hooks: true,
        });
    };

    return StripeCustomers;
};