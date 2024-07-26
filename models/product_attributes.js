"use strict";

module.exports = (sequelize, DataTypes) => {
    let ProductAttributes = sequelize.define(
        "ProductAttributes",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            product_id: DataTypes.INTEGER,
            meta_type: DataTypes.STRING,
            meta_value: DataTypes.STRING,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "product_attributes",
            paranoid: true
        },
    );

    ProductAttributes.associate = function (models) {
        this.product_id = this.belongsTo(models.Products, {
            foreignKey: "product_id",
            onDelete: 'cascade',
            hooks: true,
        });
    };

    return ProductAttributes;
};