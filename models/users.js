"use strict";

const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  let Users = sequelize.define(
    "Users",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      customer_id: DataTypes.STRING,
      profile_url: DataTypes.STRING,
      status: DataTypes.TINYINT,  // 0: Inactive, 1: Active
      on_vacation: DataTypes.TINYINT, // 0 = "false" 1 = "true"
      reset_token: DataTypes.STRING,
      verification_token: DataTypes.STRING,
      deletedAt: { type: DataTypes.DATE, defaultValue: null }
    },
    {
      freezeTableName: true,
      tableName: "users",
      paranoid: true,
      getterMethods: {
        profile_url: function () {
          let signatureUrl = this.getDataValue('profile_url');
          if (signatureUrl) {
            let baseurl = CONFIG.IMAGE_URL + '/media/thumbnail/';
            return baseurl + signatureUrl;
          }
          return signatureUrl ? signatureUrl : '';
        }
      },
    },
  );
  Users.associate = function (models) {
    this.user_id = this.hasMany(models.Products, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.UserAddresses, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.Reviews, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.StripeCustomers, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.BlackoutDates, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.Favorites, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.UserWalletDetails, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });

    this.user_id = this.hasMany(models.UserPayoutDetails, {
      foreignKey: "user_id",
      onDelete: 'cascade',
      hooks: true,
    });
  }

  Users.prototype.toWeb = function (pw) {
    let json = this.toJSON();
    delete json["password"];
    return json;
  };

  Users.prototype.getJWT = function (isRememberMe) {
    let expiration_time = isRememberMe == 1 ? parseInt(CONFIG.jwt_expiration_remember_me) : parseInt(CONFIG.jwt_expiration);
    console.log("EXPIRATION TIME *********************************************************", expiration_time)
    return (
      "Bearer " +
      jwt.sign({ id: this.id }, CONFIG.jwt_encryption_admin, {
        expiresIn: expiration_time
      })
    );
  };

  return Users;
};