"use strict";

module.exports = (sequelize, DataTypes) => {
    let Locations = sequelize.define(
        "Locations",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            zipcode: DataTypes.STRING,
            location_name: DataTypes.STRING,
            status: DataTypes.TINYINT, // 0: Inactive, 1: Active
            deletedAt: { type: DataTypes.DATE, defaultValue: null }
        },
        {
            freezeTableName: true,
            tableName: "locations",
            paranoid: true
        },
    );

    Locations.associate = function (models) {
        this.location_id = this.hasMany(models.Products, {
            foreignKey: "location_id",
            onDelete: 'cascade',
            hooks: true,
        });
    }

    return Locations;
};