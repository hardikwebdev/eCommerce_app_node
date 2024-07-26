"use strict";

module.exports = (sequelize, DataTypes) => {
    let Products = sequelize.define(
        "Products",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            title: DataTypes.STRING,
            description: DataTypes.STRING,
            category: DataTypes.STRING,
            retail_price: DataTypes.DOUBLE(10, 2),
            availability_status: DataTypes.TINYINT, // Deactive = 0, Active = 1, Rotating = 2
            shipping_type: DataTypes.TINYINT, // 0: pickup, 1: shipping, 2: Both
            location_id: DataTypes.STRING,
            rented_count: DataTypes.INTEGER,
            occasion: DataTypes.STRING,
            rental_fee: {
                type: DataTypes.STRING,
                get() {
                    if (this.getDataValue('rental_fee')) {
                        let obj = JSON.parse(this.getDataValue('rental_fee'));
                        return obj;
                    } else {
                        return;
                    }
                }
            },
            two_weeks: DataTypes.INTEGER,
            three_weeks: DataTypes.INTEGER,
            four_weeks: DataTypes.INTEGER,
            five_weeks: DataTypes.INTEGER,
            six_weeks: DataTypes.INTEGER,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "products",
            paranoid: true
        },
    );
    Products.associate = function (models) {
        this.product_id = this.hasMany(models.ProductAttributes, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });

        this.location_id = this.belongsTo(models.Locations, {
            foreignKey: "location_id",
        });

        this.product_id = this.hasMany(models.ProductImages, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });

        this.user_id = this.belongsTo(models.Users, {
            foreignKey: "user_id",
            onDelete: 'cascade',
            hooks: true,
        });

        this.product_id = this.hasMany(models.OrderDetails, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });

        this.product_id = this.hasMany(models.Favorites, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });
    }

    return Products;
};