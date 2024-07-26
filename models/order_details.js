"use strict";

module.exports = (sequelize, DataTypes) => {
    let OrderDetails = sequelize.define(
        "OrderDetails",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            order_id: DataTypes.INTEGER,
            product_id: DataTypes.INTEGER,
            amount: DataTypes.INTEGER,
            start_date: DataTypes.DATE,
            end_date: DataTypes.DATE,
            total_amount: DataTypes.STRING,
            total_earnings: DataTypes.DOUBLE(10, 2),
            quantity: DataTypes.INTEGER,
            rental_period: DataTypes.STRING,
            shipping_status: DataTypes.TINYINT, // 0: Pending, 1: Completed, 2: Shipped, 3: Mark Picked Up 4: Mark Drop Offed,  5: Mark delivered, 6: Mark return shipped, , 7: Mark as picked up on seller side
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "order_details",
            paranoid: true
        },
    );

    OrderDetails.associate = function (models) {
        this.order_id = this.belongsTo(models.Orders, {
            foreignKey: "order_id",
        });

        this.product_id = this.belongsTo(models.Products, {
            foreignKey: "product_id",
        });
    };

    return OrderDetails;
};