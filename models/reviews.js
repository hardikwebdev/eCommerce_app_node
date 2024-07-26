"use strict";

module.exports = (sequelize, DataTypes) => {
    let Reviews = sequelize.define(
        "Reviews",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: DataTypes.INTEGER,
            product_id: DataTypes.INTEGER,
            review: DataTypes.TEXT,
            rating: DataTypes.INTEGER,
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "reviews",
            paranoid: true
        },
    );

    Reviews.associate = function (models) {
        this.user_id = this.belongsTo(models.Users, {
            foreignKey: "user_id",
        });
    }

    return Reviews;
};