"use strict";

module.exports = (sequelize, DataTypes) => {
    let Orders = sequelize.define(
        "Orders",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            buyer_id: DataTypes.INTEGER,
            seller_id: DataTypes.INTEGER,
            status: DataTypes.TINYINT, // 0: Pending, 1: Completed, 2: Shipped, 3: Mark Picked Up 4: Mark Drop Offed,  5: Mark delivered, 6: Mark return shipped, 7: Mark as picked up on seller side
            shipping_address: DataTypes.TEXT, 
            shipping_type: DataTypes.TINYINT, // 0: Shipping 1: Pickup
            session_id: DataTypes.TEXT,
            session_details: DataTypes.TEXT,
            order_data: DataTypes.TEXT,
            service_type: DataTypes.TINYINT, // 0: Standard, 1: Expedited
            shipping_label: DataTypes.TEXT,
            return_label: DataTypes.TEXT,
            shipstation_details: DataTypes.TEXT,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "orders",
            paranoid: true
        },
    );

    Orders.associate = function (models) {
        this.order_id = this.hasMany(models.OrderDetails, {
            foreignKey: "order_id",
            onDelete: 'cascade',
            hooks: true,
        });
    }

    return Orders;
};