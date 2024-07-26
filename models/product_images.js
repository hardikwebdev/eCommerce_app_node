"use strict";

module.exports = (sequelize, DataTypes) => {
    let ProductImages = sequelize.define(
        "ProductImages",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            product_id: DataTypes.INTEGER,
            image_url: DataTypes.STRING,
            index: DataTypes.INTEGER,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "product_images",
            paranoid: true,
        },
    );

    ProductImages.associate = function (models) {
        this.product_id = this.belongsTo(models.Products, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });
    };

    return ProductImages;
};