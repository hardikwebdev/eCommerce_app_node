"use strict";

module.exports = (sequelize, DataTypes) => {
    let Favorites = sequelize.define(
        "Favorites",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            product_id: DataTypes.INTEGER,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "favorites",
            paranoid: true
        },
    );

    Favorites.associate = function (models) {
        this.product_id = this.belongsTo(models.Products, {
            foreignKey: "product_id",
        });

        this.user_id = this.belongsTo(models.Users, {
            foreignKey: "user_id",
        });
    };
    

    return Favorites;
};