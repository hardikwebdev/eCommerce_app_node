const Products = require("../../../models").Products;
const Orders = require("../../../models").Orders;
const OrderDetails = require("../../../models").OrderDetails;
const ProductImages = require("../../../models").ProductImages;
const ProductAttributes = require("../../../models").ProductAttributes;
const Locations = require("../../../models").Locations;
const UserAddresses = require("../../../models").UserAddresses;
const Users = require("../../../models").Users;
const UserCartDetails = require("../../../models").UserCartDetails;
const Reviews = require("../../../models").Reviews;
const Favorites = require("../../../models").Favorites;
const fs = require("fs");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const bcrypt = require("bcryptjs");
const moment = require("moment");
let _ = require("underscore");
const base64Func = require("../../../middlewares/image_upload");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const transporter = require("../../../config/nodemailer").transporter;
const StripeCustomers = require("../../../models").StripeCustomers;
const BlackoutDates = require("../../../models").BlackoutDates;
const UserWalletDetails = require("../../../models").UserWalletDetails;
const UserPayoutDetails = require("../../../models").UserPayoutDetails;
const CryptoJS = require("crypto-js");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

let isJsonParsable = (string) => {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
};

const sendMailHandler = async (mailOptions, callback) => {
  transporter.sendMail(mailOptions, (error, info) => {
    if (!error) {
      let tempObj = {
        status: 200,
        data: "Success",
      };
      callback(tempObj);
    } else {
      console.log("Failed : ", error);
      let tempObj = {
        status: 400,
        error: error,
      };
      callback(tempObj);
    }
  });
};

module.exports.myClothes = async (req, res) => {
  await Products.findAll({
    where: {
      user_id: req.user.id,
    },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: ProductImages,
        attributes: ["image_url"],
      },
      {
        model: ProductAttributes,
        attributes: ["meta_type", "meta_value"],
      },
    ],
  })
    .then(async (data) => {
      return ReS(res, "Users clothes fetched successfully.", {
        payload: {
          data,
        },
      });
    })
    .catch((err) => {
      return ReE(res, "Failed to fetch clothes.", 400);
    });
};

module.exports.myRentals = async (req, res) => {
  await Orders.findAll({
    where: {
      buyer_id: req.user.id,
    },
    attributes: ["buyer_id", "seller_id"],
    include: [
      {
        model: OrderDetails,
        required: true,
        attributes: ["order_id", "product_id", "end_date"],
      },
    ],
  })
    .then(async (data) => {
      let productArr = [];
      if (data.length > 0) {
        await data.map(async (val) => {
          await val.dataValues.OrderDetails.map(async (val2, i) => {
            let id = val?.dataValues.OrderDetails[i]?.dataValues.product_id;
            productArr.push(id);
          });
        });
        await Products.findAll({
          where: {
            id: productArr,
          },
          include: [
            {
              model: ProductImages,
              attributes: ["image_url"],
            },
            {
              model: Users,
              attributes: ["first_name"],
            },
          ],
        }).then(async (result) => {
          let sortedArr = [];
          await result.map(async (curVal) => {
            await data.map(async (curData) => {
              await curData.dataValues.OrderDetails.map((val, i) => {
                let obj = {};
                if (
                  curVal.user_id == curData?.dataValues.seller_id &&
                  curVal.id ==
                    curData?.dataValues.OrderDetails[i]?.dataValues.product_id
                ) {
                  obj = {
                    ...curVal?.dataValues,
                    ...curData?.dataValues,
                    ...curData?.dataValues.OrderDetails[i]?.dataValues,
                  };
                  delete obj.OrderDetails;
                  sortedArr.push(obj);
                }
              });
            });
          });
          return ReS(res, "Users rentals fetched successfully.", {
            payload: {
              data: sortedArr,
            },
          });
        });
      } else {
        return ReS(res, "You have no rentals");
      }
    })
    .catch((err) => {
      console.log("Error in the my rentals : ", err.message);
      return ReE(res, "Failed to fetch rentals.", 400);
    });
};

module.exports.addProduct = async (req, res) => {
  let postdata = req.body;
  req.checkBody({
    title: {
      notEmpty: true,
      errorMessage: "Title is required",
    },
    description: {
      notEmpty: true,
      errorMessage: "Description is required",
    },
    category: {
      notEmpty: true,
      errorMessage: "Category is required",
    },
    retail_price: {
      notEmpty: true,
      errorMessage: "Retail price is required",
    },
    shipping_type: {
      notEmpty: true,
      errorMessage: "Shipping type is required",
    },
    location_id: {
      notEmpty: true,
      errorMessage: "Location is required",
    },
    size: {
      notEmpty: true,
      errorMessage: "Size is required",
    },
    color: {
      notEmpty: true,
      errorMessage: "Color is required",
    },
    brand: {
      notEmpty: true,
      errorMessage: "Brand is required",
    },
    week: {
      notEmpty: true,
      errorMessage: "Rental preiod is required",
    },
  });

  let errors = req.validationErrors();

  if (errors) {
    return ReE(res, errors, 400);
  }
  let address = await Users.findOne({
    where: {
      id: postdata.user_id,
    },
    attributes: [],
    include: [
      {
        model: UserAddresses,
        required: true,
        attributes: ["address", "type"],
      },
    ],
  });

  let addressType = address
    ? address.dataValues.UserAddresses[0].dataValues.type
    : null;

  if (address && addressType == 0) {
    postdata.availability_status = 1;
    let category = { ...postdata.category };
    let parsedObj = { ...postdata.rental_fee };
    postdata.category = postdata.category.mainCategory;
    postdata.occasion = postdata.occasion.join(", ");
    postdata.rental_fee = JSON.stringify(postdata.rental_fee);
    postdata.two_weeks = parsedObj["2weeks"];
    postdata.three_weeks = parsedObj["3weeks"];
    postdata.four_weeks = parsedObj["4weeks"];
    postdata.five_weeks = parsedObj["5weeks"];
    postdata.six_weeks = parsedObj["6weeks"];

    await Products.create(postdata)
      .then(async (data) => {
        let attributesArr = [
          {
            product_id: data.id,
            meta_type: "Size",
            meta_value: postdata.size,
          },
          {
            product_id: data.id,
            meta_type: "Brand",
            meta_value: postdata.brand,
          },
          {
            product_id: data.id,
            meta_type: "Week",
            meta_value: postdata.week,
          },
          {
            product_id: data.id,
            meta_type: "Type",
            meta_value: category.type,
          },
        ];
        await postdata.color.map((val) => {
          let curObj = {
            product_id: data.id,
            meta_type: "Color",
            meta_value: val,
          };
          attributesArr.push(curObj);
        });
        await ProductAttributes.bulkCreate(attributesArr).catch((err) => {
          return ReE(res, err, 400);
        });

        if (postdata.ProductImages.length > 0) {
          let totalFiles = postdata.ProductImages;

          await totalFiles.map(async (val) => {
            let fileObj = {
              product_id: data.id,
              image_url: val.image_url,
              index: val.index,
            };
            await ProductImages.create(fileObj).catch((err) => {
              console.log("ERROR : ", err);
              return ReE(res, err, 400);
            });
          });
          return ReS(res, "Product added successfully", {
            payload: {
              data,
            },
          });
        } else {
          return ReS(res, "Product added successfully", {
            payload: {
              data,
            },
          });
        }
      })
      .catch((err) => {
        return ReE(res, err, 400);
      });
  } else {
    return ReE(res, "Enter your shipping address", 400);
  }
};

module.exports.addProductImage = async (req, res) => {
  let postdata = req.body;
  if (postdata.files) {
    let totalFiles = isJSON(postdata.files)
      ? JSON.parse(postdata.files)
      : postdata.files;

    if (totalFiles.length > 0) {
      let base64 = totalFiles[0];

      AWS.config.setPromisesDependency(require("bluebird"));

      const s3 = new AWS.S3();

      const base64Data = new Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const type = base64.split(";")[0].split("/")[1];
      let fileName = `PT_${postdata.userId}${randomStr(5)}.${type}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `products/${fileName}`, // type is not required
        Body: base64Data,
        ACL: "public-read",
        ContentEncoding: "base64", // required
        ContentType: `image/${type}`, // required. Notice the back ticks
      };

      const { Location, Key } = await s3.upload(params).promise();
      if (Location) {
        return ReS(res, "Product image added successfully", {
          payload: {
            url: Location,
          },
        });
      } else {
        return ReE(res, "Failed to upload image");
      }
    }
  } else {
    return ReE(res, "File is required!", 400);
  }
};

module.exports.deleteProduct = async (req, res) => {
  if (req.body.product_id) {
    let product_id = req.body.product_id;

    await Products.update(
      {
        deletedAt: new Date(),
      },
      {
        where: {
          id: product_id,
        },
      }
    )
      .then(async () => {
        await ProductAttributes.update(
          {
            deletedAt: new Date(),
          },
          {
            where: {
              product_id,
            },
          }
        ).catch((err) => {
          return ReE(res, err, 400);
        });

        await ProductImages.destroy({
          where: {
            product_id,
          },
          force: true,
        }).catch((err) => {
          return ReE(res, err, 400);
        });

        return ReS(res, "Product deleted ");
      })
      .catch((err) => {
        return ReE(res, err, 400);
      });
  } else {
    return ReE(res, "Product id required", 400);
  }
};

module.exports.userProfile = async (req, res) => {
  let user_id = req.query.user_id;

  if (user_id) {
    await Users.findOne({
      where: {
        id: user_id,
      },
      include: [
        {
          model: UserAddresses,
        },
      ],
    })
      .then((user) => {
        if (user) {
          let uAdd = user.dataValues.UserAddresses;
          user.dataValues["ShippingAddress"] =
            uAdd.length > 0
              ? uAdd.filter((it) => it.dataValues.type === 0)
              : [];
          user.dataValues["BillingAddress"] =
            uAdd.length > 0
              ? uAdd.filter((it) => it.dataValues.type === 1)
              : [];
          delete user.dataValues.UserAddresses;
          delete user.dataValues.password;

          return ReS(res, "Users data fetched successfully", {
            payload: {
              data: user,
            },
          });
        } else {
          return ReS(res, "No Address found.");
        }
      })
      .catch((err) => {
        return ReE(res, err, 400);
      });
  } else {
    return ReE(res, "User id required", 400);
  }
};

module.exports.addAddress = async (req, res) => {
  let postdata = req.body;
  req.checkBody({
    name: {
      notEmpty: true,
      errorMessage: "Name is required",
    },
    address: {
      notEmpty: true,
      errorMessage: "Address is required",
    },
    zip_code: {
      notEmpty: true,
      errorMessage: "Zipcode is required",
    },
    phone_number: {
      notEmpty: true,
      errorMessage: "Phone number is required",
      isLength: {
        options: { min: 10, max: 10 },
        errorMessage: "Phone number doesn't meet the valid format ",
      },
    },
    type: {
      notEmpty: true,
      errorMessage: "Address type is required",
    },
  });

  let errors = req.validationErrors();

  if (errors) {
    return ReE(res, errors, 400);
  }

  await UserAddresses.create(postdata)
    .then((data) => {
      return ReS(res, "Address added successfully!", {
        postdata: {
          data,
        },
      });
    })
    .catch((err) => {
      return ReE(res, err, 400);
    });
};

module.exports.changePassword = async (req, res) => {
  let postdata = req.body;
  req.checkBody({
    password: {
      notEmpty: true,
      errorMessage: "Password is required",
      isLength: {
        options: { min: 8, max: 20 },
        errorMessage: "Password must be at least 8 chars long",
      },
    },
  });

  let errors = req.validationErrors();

  if (errors) {
    return ReE(res, errors, 400);
  }

  let password = bcrypt.hashSync(postdata.password, 10);
  await Users.update(
    {
      password,
    },
    {
      where: {
        email: postdata.email,
      },
    }
  )
    .then((updated) => {
      if (updated == 1) {
        return ReS(res, "Password updated successfully!");
      } else {
        return ReE(res, "Failed to update password!", 400);
      }
    })
    .catch((err) => {
      return ReE(res, err, 400);
    });
};

module.exports.addToCart = async (req, res) => {
  let postdata = req.body;
  if (postdata.user_id === postdata.seller_id) {
    return ReS(res, "You can't add your own product");
  } else {
    let addedProduct = await UserCartDetails.findOne({
      where: {
        [Op.and]: {
          user_id: postdata.user_id,
          product_id: postdata.product_id,
          status: 0,
        },
      },
    });

    if (addedProduct) {
      await UserCartDetails.update(postdata, {
        where: {
          [Op.and]: {
            user_id: postdata.user_id,
            product_id: postdata.product_id,
            status: 0,
          },
        },
      })
        .then((updated) => {
          if (updated > 0) {
            return ReS(res, "Product updated successfully!");
          } else {
            return ReE(res, "Failed to update product!", 400);
          }
        })
        .catch((err) => {
          return ReE(res, err, 400);
        });
    } else {
      await UserCartDetails.create(postdata)
        .then((data) => {
          return ReS(res, "Product added successfully!");
        })
        .catch((err) => {
          return ReE(res, err, 400);
        });
    }
  }
};

module.exports.removeFromCart = async (req, res) => {
  let postdata = req.body;

  await UserCartDetails.update(
    {
      deletedAt: new Date(),
    },
    {
      where: {
        [Op.and]: {
          user_id: postdata.user_id,
          product_id: postdata.product_id,
          status: 0,
        },
      },
    }
  )
    .then((updated) => {
      if (updated > 0) {
        return ReS(res, "Product removed successfully!");
      } else {
        return ReE(res, "Failed to remove product!", 400);
      }
    })
    .catch((err) => {
      return ReE(res, err, 400);
    });
};

module.exports.cartDetails = async (req, res) => {
  let user_id = req.query.user_id;

  await UserCartDetails.findAll({
    where: {
      [Op.and]: {
        user_id,
        status: 0,
      },
    },
    attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
  })
    .then(async (data) => {
      let promiseArr = [];
      let sortedArr = [];

      let fetchProductDetails = async (curVal) => {
        let obj = curVal?.dataValues;
        let productData = await Products.findOne({
          where: {
            id: curVal.product_id,
          },
          attributes: [
            "title",
            "location_id",
            "rental_fee",
            "availability_status",
          ],
          include: [
            {
              model: ProductImages,
              attributes: ["image_url"],
            },
            {
              model: Users,
              attributes: ["first_name"],
            },
          ],
        });
        if (productData) {
          let rentalDates = [];
          await OrderDetails.findAll({
            where: {
              shipping_status: { [Op.not]: 1 },
              product_id: curVal.product_id,
            },
            attributes: ["start_date", "end_date"],
            include: [
              {
                model: Orders,
                attributes: ["shipping_type"],
              },
            ],
          }).then((data) => {
            data.map((val) => {
              let tempObj = {
                ...val.dataValues,
              };
              let shiipingType = isJSON(
                val.dataValues.Order.dataValues.shipping_type
              )
                ? JSON.parse(val.dataValues.Order.dataValues.shipping_type)
                : val.dataValues.Order.dataValues.shipping_type;
              tempObj.shipping_type = shiipingType;
              delete tempObj.Order;
              rentalDates.push(tempObj);
            });
          });
          obj = {
            ...obj,
            ...productData?.dataValues,
            image_url: productData?.dataValues?.ProductImages[0]
              ? productData?.dataValues?.ProductImages[0]?.image_url
              : "",
            seller_name: productData?.dataValues?.User?.first_name,
            rentalDates,
            rental_fee: isJSON(productData?.dataValues?.rental_fee)
              ? JSON.parse(productData?.dataValues?.rental_fee)
              : productData?.dataValues?.rental_fee,
          };
          delete obj.ProductImages;
          delete obj.User;
          sortedArr.push(obj);

          let updateObj = {
            amount: parseInt(obj.rental_fee[`${obj.rental_period}weeks`]),
          };
          await UserCartDetails.update(updateObj, {
            where: {
              id: curVal.id,
            },
          }).catch((err) => {
            console.log("ERROR IN UPDATING USER CART DETAILS : ", err);
            return;
          });
        }
      };
      await data.map(async (curVal) => {
        promiseArr.push(fetchProductDetails(curVal));
      });

      Promise.all(promiseArr)
        .then(() => {
          return ReS(res, "Cart items fetched successfully!", {
            postdata: {
              data: sortedArr,
            },
          });
        })
        .catch((err) => {
          console.log("ERROR IN CARTDETAILS : ", err);
          return ReE(res, err, 400);
        });
    })
    .catch((err) => {
      console.log("ERROR IN CARTDETAILS : ", err);
      return ReE(res, err, 400);
    });
};

module.exports.order = async (req, res) => {
  let postdata = req.body;
  let orderArr = postdata.orderArr;
  let promiseArr = [];
  let sortedArr = [];
  let session_id = postdata.session_id.trim();
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const customer = await stripe.customers.retrieve(session?.customer);
  let address = JSON.stringify(customer?.shipping?.address);
  let session_details = JSON.stringify(session);
  let orderIdArr = [];

  let exisitngOrder = await Orders.findOne({
    where: {
      session_id,
    },
  });

  if (!exisitngOrder) {
    await orderArr.map(async (curOrder, index) => {
      let obj = {};
      let found = false;

      if (sortedArr.length > 0) {
        sortedArr.map(async (curDetails, i) => {
          if (
            curDetails &&
            curDetails.buyer_id == curOrder.buyer_id &&
            curDetails.seller_id == curOrder.seller_id
          ) {
            sortedArr[i].orders.push(curOrder);
            found = true;
          }
        });

        if (!found) {
          obj.buyer_id = curOrder.buyer_id;
          obj.seller_id = curOrder.seller_id;
          obj.shipping_address = curOrder.shipping_address;
          obj.shipping_type = curOrder.shipping_type;
          obj.service_type = curOrder.service_type;
          obj.orders = [curOrder];
          sortedArr.push(obj);
        }
      } else {
        obj.buyer_id = curOrder.buyer_id;
        obj.seller_id = curOrder.seller_id;
        obj.shipping_address = curOrder.shipping_address;
        obj.shipping_type = curOrder.shipping_type;
        obj.service_type = curOrder.service_type;
        obj.orders = [curOrder];
        sortedArr.push(obj);
      }
    });

    const updateRentedCout = async (id) => {
      await Products.increment("rented_count", { by: 1, where: { id } });
      await Products.update(
        {
          availability_status: 2,
        },
        {
          where: {
            id,
          },
        }
      );
    };

    const updateCartStatus = async (val) => {
      await UserCartDetails.update(
        { status: 1 },
        {
          where: {
            [Op.and]: {
              user_id: val.buyer_id,
              product_id: val.product_id,
              status: 0,
            },
          },
        }
      );
    };

    const sendMail = async (id, order, sendTo) => {
      let orderData = order.dataValues.order_data;
      orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

      let items = [...orderData.items];
      const amount = items.reduce((accumulator, object) => {
        return accumulator + object.total_amount;
      }, 0);

      let shippingType = orderData.items[0].shipping_type;
      shippingType = isJSON(shippingType)
        ? JSON.parse(shippingType)
        : shippingType;
      let orderShippingType =
        shippingType.zip_code == ""
          ? "Shipping"
          : orderData.sellerAddress.zip_code;

      let seller = await Users.findOne({
        where: {
          id,
        },
      });

      orderData.shipping_type = orderShippingType;

      let itemIdArr = _.pluck(items, "product_id");

      let products = await Products.findAll({
        where: {
          id: { [Op.in]: itemIdArr },
        },
        include: [
          {
            model: ProductImages,
            attributes: ["image_url"],
          },
        ],
      });

      let newItemArr = [];

      await products.map((val) => {
        let tempObj = {
          image_url: val.dataValues.ProductImages[0].dataValues.image_url,
          title: val.dataValues.title,
          id: val.dataValues.id,
        };
        newItemArr.push(tempObj);
      });

      orderData.start_date = convertTimezone(items[0].start_date);
      orderData.end_date = convertTimezone(items[0].end_date);
      console.log("Start Date : ", orderData.start_date);
      console.log("End date : ", orderData.end_date);
      orderData.items = newItemArr;
      orderData.order_id = order.dataValues.id;
      if (sendTo == "seller") {
        console.log("SELLER ");
        let total_earnings = 0;
        await items.map((val) => {
          total_earnings = (val.total_amount * 0.8).toFixed(2);
        });
        console.log("TOTAL EARNINGs : ", total_earnings);
        orderData.amount = total_earnings;
      } else {
        console.log("BUYER");
        orderData.amount = amount;
      }

      let template =
        shippingType.zip_code == ""
          ? sendTo == "buyer"
            ? "p0-order-confirmation-shipping-buyer"
            : "p0-order-confirmation-shipping-seller"
          : sendTo == "buyer"
          ? "p0-order-confirmation-local-pickup-buyer"
          : "p0-order-confirmation-local-pickup-seller";
      let subject =
        shippingType.zip_code == ""
          ? sendTo == "buyer"
            ? `Your Order #${order.dataValues.id} Has Been Confirmed`
            : "Congratulations! You Have A Rental! ✨"
          : sendTo == "buyer"
          ? `Your Local Pick Up Order #${order.dataValues.id} Has Been Confirmed`
          : "🚨Congratulations! You Have A Local Pick Up Rental!";
      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: seller.email,
        template: template,
        subject: subject,
        context: {
          fullName: seller.first_name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      sendMailHandler(mailOptions, (response) => {
        return;
      });
    };

    const appendOrderFunc = async (val, id) => {
      let appendOrder = {
        order_id: id,
        product_id: val.product_id,
        amount: val.amount,
        start_date: val.start_date,
        end_date: val.end_date,
        total_amount: val.total_amount,
        quantity: val.quantity,
        rental_period: val.rental_period,
      };
      let total_earnings = (val.total_amount * 0.8).toFixed(2);
      appendOrder.total_earnings = total_earnings;
      console.log("APPEND ORDER : ", appendOrder);
      await OrderDetails.create(appendOrder).then(async (data) => {
        promiseArr.push(updateRentedCout(data.product_id));
        promiseArr.push(updateCartStatus(val));
      });
    };

    const createOrderFunc = async (curval) => {
      console.log("CurVal : ", curval);
      let sellerDetails = await Users.findOne({
        where: {
          id: curval.seller_id,
        },
        include: [
          {
            model: UserAddresses,
            required: true,
            where: {
              type: 0,
            },
          },
        ],
        attributes: ["first_name", "last_name", "email"],
      });

      let sellerAddress = {
        ...sellerDetails.dataValues.UserAddresses[0].dataValues,
        ...sellerDetails.dataValues,
      };
      delete sellerAddress.UserAddresses;

      let buyerDetails = await Users.findOne({
        where: {
          id: curval.buyer_id,
        },
        attributes: ["first_name", "last_name", "email"],
      });

      let tempOrderData = isJSON(postdata.orderData)
        ? JSON.parse(postdata.orderData)
        : postdata.orderData;
      let tempObj = {
        ...tempOrderData.shippingAddress,
        ...buyerDetails.dataValues,
      };
      tempOrderData.sellerAddress = sellerAddress;
      tempOrderData.shippingAddress = tempObj;

      let dateSortObj = {};
      let itemsArr = curval.orders;
      await itemsArr.map((val) => {
        let str = `${moment(val.start_date).format("MM/DD/YYYY")} - ${moment(
          val.end_date
        ).format("MM/DD/YYYY")}`;
        if (!dateSortObj[str]) {
          dateSortObj[str] = [];
        }
        dateSortObj[str].push(val);
      });

      for (let key in dateSortObj) {
        await Promise.all(promiseArr).then(async () => {
          let itemsArray = dateSortObj[key];
          tempOrderData.items = itemsArray;
          let stringifyedData = JSON.stringify({ ...tempOrderData });

          let addOrder = {
            buyer_id: curval.buyer_id,
            seller_id: curval.seller_id,
            shipping_address: address,
            shipping_type: curval.shipping_type,
            service_type: curval.service_type,
            session_details: session_details,
            session_id: session.id,
            order_data: stringifyedData,
          };

          await Orders.create(addOrder).then(async (data) => {
            console.log("ORDER DATA : ", data.dataValues.id);
            let tempId = data.dataValues.id;
            orderIdArr.push(tempId);
            console.log("oRder Id : ", orderIdArr);
            await itemsArray.map(async (val) => {
              promiseArr.push(await appendOrderFunc(val, data.id));
            });
            await sendMail(curval.seller_id, data, (sendTo = "seller"));
            await sendMail(curval.buyer_id, data, (sendTo = "buyer"));
          });
        });
      }
    };
    for (let i = 0; i < sortedArr.length; i++) {
      await Promise.all(promiseArr).then(async () => {
        promiseArr.push(await createOrderFunc(sortedArr[i]));
      });
    }
    await Promise.all(promiseArr)
      .then(() => {
        console.log(
          "ORDER ID ARRAY ****************************************************: ",
          orderIdArr
        );
        return ReS(res, "Order placed successfully!", {
          postdata: {
            orderIdArr,
          },
        });
      })
      .catch((err) => {
        console.log("ERROR : ###########################################", err);
        return ReE(res, err, 400);
      });
  } else {
    return ReS(res, "Order placed successfully!", {
      postdata: {
        orderIdArr: [exisitngOrder.id],
      },
    });
  }
};

module.exports.orderDetails = async (req, res) => {
  let query = req.query;

  await Orders.findOne({
    where: {
      id: query.order_id,
    },
    include: [
      {
        model: OrderDetails,
        attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
        include: [
          {
            model: Products,
            include: [
              {
                model: ProductImages,
                attributes: ["image_url"],
              },
              {
                model: Users,
                attributes: [
                  "first_name",
                  "last_name",
                  "email",
                  "phone_number",
                ],
                include: [
                  {
                    model: UserAddresses,
                    attribute: ["address", "zip_code", "phone_number"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })
    .then(async (data) => {
      let sortedArr = [];
      await data.dataValues.OrderDetails.map(async (details) => {
        let curObj = { ...data.dataValues };
        let tempObj = {
          ...details.dataValues,
          title: details.dataValues.Product?.dataValues.title,
          retail_price: details.dataValues.Product?.dataValues.retail_price,
          image_url:
            details.dataValues.Product?.dataValues.ProductImages[0]?.dataValues
              .image_url,
        };

        curObj.sellerDetails =
          details.dataValues.Product?.dataValues.User?.dataValues;
        curObj.sellerAddress =
          details.dataValues.Product?.dataValues.User?.dataValues.UserAddresses[0]?.dataValues;
        delete tempObj.Product;
        delete curObj.OrderDetails;
        curObj.OrderDetails = tempObj;

        let shipping_address = isJsonParsable(curObj.shipping_address)
          ? JSON.parse(curObj.shipping_address)
          : curObj.shipping_address;
        let session_details = isJsonParsable(curObj.session_details)
          ? JSON.parse(curObj.session_details)
          : curObj.session_details;
        let orderData = isJsonParsable(curObj.order_data)
          ? JSON.parse(curObj.order_data)
          : curObj.order_data;
        let shippingType = isJsonParsable(curObj.shipping_type)
          ? JSON.parse(curObj.shipping_type)
          : curObj.shipping_type;
        let shippingLabel = isJsonParsable(curObj.shipping_label)
          ? JSON.parse(curObj.shipping_label)
          : curObj.shipping_label;
        let returnLabel = isJsonParsable(curObj.return_label)
          ? JSON.parse(curObj.return_label)
          : curObj.return_label;
        curObj.shipping_label = shippingLabel;
        curObj.return_label = returnLabel;
        curObj.shipping_address = shipping_address;
        curObj.session_details = session_details;
        curObj.order_data = orderData;
        curObj.shipping_type = shippingType;
        sortedArr.push(curObj);
      });

      return ReS(res, "Order details fetched successfully!", {
        postdata: {
          data: sortedArr,
        },
      });
    })
    .catch((err) => {
      console.log("ERROR : ", err);
      return ReE(res, "Failed to fetch order details.", 400);
    });
};

module.exports.markShipped = async (req, res) => {
  let postdata = req.body;
  let promiseArr = [];

  const updateFunction = async (curId) => {
    await OrderDetails.update(
      {
        shipping_status: 2,
      },
      {
        where: {
          id: curId,
          shipping_status: 0,
        },
      }
    ).catch((err) => {
      console.log("ERROR", err);
    });
  };

  await postdata.orderDetail.map((val) => {
    promiseArr.push(updateFunction(val));
  });

  Promise.all(promiseArr)
    .then(async () => {
      await Orders.update(
        {
          status: 2,
        },
        {
          where: {
            id: postdata.order_id,
          },
        }
      )
        .then((updated) => {
          if (updated > 0) {
            return ReS(res, "Order shipped!");
          } else {
            return ReE(res, "Failed to update status!", 400);
          }
        })
        .catch((err) => {
          return ReE(res, err, 400);
        });
    })
    .catch((err) => {
      console.log("ERROR : ", err);
      return ReE(res, "Failed to update status!", 400);
    });
};

module.exports.addReview = async (req, res) => {
  let postdata = req.body;

  let postdata = req.body;
  req.checkBody({
    review: {
      notEmpty: true,
      errorMessage: "Review is required",
    },
    rating: {
      notEmpty: true,
      errorMessage: "Rating is required",
    },
  });

  let errors = req.validationErrors();

  if (errors) {
    return ReE(res, errors, 400);
  }

  await Reviews.create(postdata)
    .then((data) => {
      return ReS(res, "Review added!");
    })
    .catch((err) => ReE(res, "Failed to add review!", 400));
};

module.exports.getReviews = async (req, res) => {
  let query = req.query;

  await Reviews.findAll({
    where: {
      product_id: query.product_id,
    },
    include: [
      {
        model: Users,
        attributes: ["first_name", "last_name", "email", "profile_url"],
      },
    ],
  })
    .then((data) => {
      return ReS(res, "Reviews fetched successfully!", {
        postdata: {
          data,
        },
      });
    })
    .catch((err) => ReE(res, "Failed to fetch review!", 400));
};

module.exports.orderHistory = async (req, res) => {
  let query = req.query;

  let limit = 2;
  let offset = 0;
  let wheres = { seller_id: query.user_id };
  if (
    query.limit &&
    parseInt(query.limit) > 0 &&
    parseInt(query.limit) <= 100
  ) {
    limit = parseInt(query.limit);
  }

  if (query.page && parseInt(query.page) > 0 && parseInt(query.page) <= 100) {
    offset = limit * (parseInt(query.page) - 1);
  }

  if (query.intoMyCloset && query.intoMyCloset == 1) {
    wheres = { buyer_id: query.user_id };
  }

  if (query.isActiveOrders && query.isActiveOrders == 1) {
    wheres.status = { [Op.ne]: 1 };
  } else {
    wheres.status = 1;
  }

  await Orders.findAndCountAll({
    where: wheres,
    limit: limit,
    offset: offset,
    distinct: true,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: OrderDetails,
        attributes: { exclude: ["createdAt", "deletedAt", "updatedAt"] },
        include: [
          {
            model: Products,
            attributes: ["title", "retail_price"],
            include: [
              {
                model: ProductImages,
                attributes: ["image_url"],
              },
            ],
          },
        ],
      },
    ],
  })
    .then(async (data) => {
      let sortedArr = [];
      await data.rows.map(async (curVal) => {
        let tempArr = [];
        await curVal.dataValues.OrderDetails.map((val) => {
          let tempObj = {
            ...val.dataValues,
            ...val.dataValues.Product.dataValues,
            image_url:
              val.dataValues.Product.dataValues.ProductImages[0].dataValues
                .image_url,
          };
          delete tempObj.Product;
          delete tempObj.ProductImages;

          tempArr.push({ ...tempObj });
        });

        let curObj = {
          ...curVal.dataValues,
        };
        delete curObj.OrderDetails;
        curObj.OrderDetails = [...tempArr];
        let shippingTypeParsed = isJsonParsable(curObj.shipping_type)
          ? JSON.parse(curObj.shipping_type)
          : curObj.shipping_type;
        let orderData = isJsonParsable(curObj.order_data)
          ? JSON.parse(curObj.order_data)
          : curObj.order_data;
        let shippingType =
          shippingTypeParsed.zip_code === "" ? "shipping" : "localpickup";
        curObj.shippingType = shippingType;
        curObj.order_data = orderData;
        sortedArr.push({ ...curObj });
      });

      return ReS(res, "Orders History fetched successfully!", {
        postdata: {
          data: sortedArr,
          count: data.count,
        },
      });
    })
    .catch((err) => {
      console.log("ORDER ERROR : ", err);
      ReE(res, "Failed to fetch order history!", 400);
    });
};

module.exports.addCard = async (req, res) => {
  let data = req.body;

  let token = data.cardData;
  let bytes = CryptoJS.AES.decrypt(token, CONFIG.jwt_encryption_admin);
  let postdata = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  let expDate = postdata.expirationDate;
  let exp_month = expDate.slice(0, 2);
  let exp_year = expDate.slice(3, 7);
  const createCard = async (cusId) => {
    if (postdata.updateCardNumber == "addNew") {
      let cardData = {
        number: postdata.cardNumber,
        exp_month: exp_month,
        exp_year: exp_year,
        cvc: postdata.cardCvc,
        name: postdata.name,
        address_zip: postdata.zipCode,
      };

      if (postdata.billingAddress) {
        cardData.address_line1 = postdata.billingAddress;
      }

      await stripe.tokens
        .create({
          card: cardData,
        })
        .then(async (data) => {
          await stripe.customers
            .createSource(cusId, { source: data.id })
            .then((result) => {
              return ReS(res, "Card added successfully!", result);
            })
            .catch((error) => {
              let err = error.raw.message;
              console.log("ERROR in add card : ", error);
              return ReE(res, err, 400);
            });
        })
        .catch((err) => {
          console.log("ERROR in Create Token : ", err);
          let error = err.raw.message;
          return ReE(res, error, 400);
        });
    } else {
      await stripe.customers
        .updateSource(cusId, postdata.updateCardNumber, {
          exp_month: exp_month,
          exp_year: exp_year,
          name: postdata.name,
          address_zip: postdata.zipCode,
        })
        .then((result) => {
          return ReS(res, "Card updated successfully!", result);
        })
        .catch((error) => {
          let err = error.raw.message;
          console.log("ERROR in update card : ", error);
          return ReE(res, err, 400);
        });
    }
  };

  const existingCustomer = await StripeCustomers.findOne({
    where: {
      user_id: postdata.user_id,
    },
  });

  if (existingCustomer && existingCustomer.customer_id) {
    await createCard(existingCustomer.customer_id);
  } else {
    await stripe.customers
      .create({
        email: postdata.email,
        name: postdata.firstName,
        metadata: {
          userId: postdata.user_id,
        },
      })
      .then(async (customer) => {
        if (existingCustomer) {
          await StripeCustomers.update(
            {
              customer_id: customer.id,
            },
            {
              where: {
                user_id: postdata.user_id,
              },
            }
          )
            .then(async (data) => {
              await createCard(data.customer_id);
            })
            .catch((err) => ReE(res, err, 400));
        } else {
          await StripeCustomers.create({
            user_id: postdata.user_id,
            customer_id: customer.id,
          })
            .then(async (data) => {
              await createCard(data.customer_id);
            })
            .catch((err) => ReE(res, err, 400));
        }
      });
  }
};

module.exports.getCardDetails = async (req, res) => {
  let query = req.query;

  const existingCustomer = await StripeCustomers.findOne({
    where: {
      user_id: query.user_id,
      customer_id: {
        [Op.not]: null,
      },
    },
  });

  if (existingCustomer) {
    const cards = await stripe.customers.listSources(
      existingCustomer.customer_id,
      { object: "card", limit: 5 }
    );
    return ReS(res, "Card fetched successfully!", {
      cards: cards.data,
    });
  } else {
    return ReS(res, "Card fetched successfully!", {
      cards: [],
    });
  }
};

module.exports.sendSizeRequest = async (req, res) => {
  let postdata = req.body;
  let sender = await Users.findOne({
    where: {
      id: postdata.sender_id,
    },
  });
  if (sender) {
    let mailOptions = {
      from: sender.email,
      to: CONFIG.welcomeemail,
      template: "add-user",
      subject: "New Size Request." + postdata.size,
      context: {
        fullName: sender.first_name,
        redirectUrl: CONFIG.BASE_URL,
        mailTo: CONFIG.welcomeemail,
        storeUrl: CONFIG.BASE_URL,
        ecommerceLogo: CONFIG.ecommerce_LOGO,
      },
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Failed sending mail", error);
        return ReE(res, "Failed to send your request!", 400);
      } else {
        return ReS(
          res,
          "Your request for the new size has been sent successfully!"
        );
      }
    });
  } else {
    return ReE(res, "Failed to send your request!", 400);
  }
};

module.exports.updateProductStatus = async (req, res) => {
  let postdata = req.body;
  await Products.update(
    {
      availability_status: postdata.status,
    },
    {
      where: {
        [Op.and]: {
          user_id: postdata.user_id,
          availability_status: { [Op.ne]: postdata.status },
          id: postdata.product_id,
        },
      },
    }
  )
    .then(async (data) => {
      return ReS(res, "Product status updated successfully.");
    })
    .catch((err) => {
      return ReE(res, "Failed to update product status.", 400);
    });
};

module.exports.addBlackOutDates = async (req, res) => {
  let postdata = req.body;
  if (postdata.isUpdate) {
    let updateData = {
      start_date: postdata.start_date,
      end_date: postdata.end_date,
    };
    await BlackoutDates.update(updateData, {
      where: {
        id: postdata.id,
        user_id: postdata.user_id,
      },
    })
      .then(async (data) => {
        return ReS(res, "Blackout dates successfully.");
      })
      .catch((err) => {
        return ReE(res, "Failed to add blackout dates.", 400);
      });
  } else {
    let addData = {
      user_id: postdata.user_id,
      start_date: postdata.start_date,
      end_date: postdata.end_date,
    };
    await BlackoutDates.create(addData)
      .then(async (data) => {
        return ReS(res, "Blackout dates successfully.");
      })
      .catch((err) => {
        return ReE(res, "Failed to add blackout dates.", 400);
      });
  }
};

module.exports.cashOut = async (req, res) => {
  let user_id = req.body.user_id;
  let walletDetails = req.body.walletDetails;
  let idArr = _.pluck(walletDetails, "id");
  let bankAccountId = req.body.bankAccountId;

  const sendRequest = async (amount) => {
    const existingCustomer = await StripeCustomers.findOne({
      where: {
        user_id: user_id,
      },
    });

    if (existingCustomer && existingCustomer.account_id) {
      const retrivedCustomerDetails = await stripe.accounts.retrieve(
        existingCustomer.account_id
      );

      if (retrivedCustomerDetails.payouts_enabled === true) {
        const mainAccountBalance = await stripe.balance.retrieve();

        if (mainAccountBalance.available[0].amount * 100 > amount) {
          let externalAccounts = retrivedCustomerDetails.external_accounts.data;
          let bankObject = externalAccounts.filter(
            (val) => val.object == "bank_account"
          );
          if (bankObject.length > 0) {
            let tempObj = {
              amount: amount * 100,
              currency: "usd",
              destination: retrivedCustomerDetails.id,
              metadata: {
                user_id: JSON.stringify(user_id),
                walletIdArr: JSON.stringify(idArr),
              },
            };
            await stripe.transfers
              .create(tempObj)
              .then(async (data) => {
                let userPayoutObj = {
                  user_id,
                  transfer_id: data.id,
                  payout_amount: amount,
                  wallet_details: JSON.stringify(walletDetails),
                };
                await UserPayoutDetails.create(userPayoutObj)
                  .then(async (userPayoutData) => {
                    await UserWalletDetails.update(
                      {
                        status: 2,
                      },
                      {
                        where: {
                          id: idArr,
                        },
                      }
                    )
                      .then(async () => {
                        let connectedAccountBalance =
                          await stripe.balance.retrieve({
                            stripe_account: retrivedCustomerDetails.id,
                          });
                        if (
                          connectedAccountBalance.available[0].amount * 100 >
                          amount
                        ) {
                          let tempPayoutObj = {
                            amount: amount * 100,
                            currency: "usd",
                            destination: bankObject[0].id,
                            metadata: {
                              user_id: JSON.stringify(user_id),
                              walletIdArr: JSON.stringify(idArr),
                            },
                          };

                          await stripe.payouts
                            .create(tempPayoutObj, {
                              stripeAccount: retrivedCustomerDetails.id,
                            })
                            .then(async (result) => {
                              let obj = {
                                payout_id: result.id,
                                payout_status: 2,
                              };
                              await UserPayoutDetails.update(obj, {
                                where: {
                                  user_id,
                                  id: userPayoutData.id,
                                },
                              })
                                .then(async (data) => {
                                  if (
                                    result.status == "paid" &&
                                    result.failure_code == null
                                  ) {
                                    await UserWalletDetails.update(
                                      {
                                        status: 1,
                                      },
                                      {
                                        where: {
                                          id: idArr,
                                        },
                                      }
                                    )
                                      .then(async (updated) => {
                                        await UserPayoutDetails.update(
                                          {
                                            payout_status: 1,
                                          },
                                          {
                                            where: {
                                              user_id,
                                              id: userPayoutData.id,
                                            },
                                          }
                                        )
                                          .then(async (updated) => {
                                            return ReS(
                                              res,
                                              "Cashout request has been sent.",
                                              {
                                                accountLink: false,
                                              }
                                            );
                                          })
                                          .catch((err) => {
                                            console.log(
                                              "ERROR IN UPDATING PAYOUT DETAILS FOR COMPLETING PAYOUT : ",
                                              err
                                            );
                                            return ReS(
                                              res,
                                              "Cashout request has been sent.",
                                              {
                                                accountLink: false,
                                              }
                                            );
                                          });
                                      })
                                      .catch((err) => {
                                        console.log(
                                          "ERROR IN UPDATING WALLET DETAILS FOR COMPLETING PAYOUT : ",
                                          err
                                        );
                                        return ReS(
                                          res,
                                          "Cashout request has been sent.",
                                          {
                                            accountLink: false,
                                          }
                                        );
                                      });
                                  } else {
                                    return ReS(
                                      res,
                                      "Cashout request has been sent.",
                                      {
                                        accountLink: false,
                                      }
                                    );
                                  }
                                })
                                .catch((err) => {
                                  console.log(
                                    "ERROR IN CREATE USER PAYOUT DETAILS : ",
                                    err
                                  );
                                  return ReE(
                                    res,
                                    "Failed to send your request",
                                    400
                                  );
                                });
                            })
                            .catch((err) => {
                              console.log("ERROR IN CREATE PAYOUT : ", err);
                              return ReE(
                                res,
                                "Failed to send your request",
                                400
                              );
                            });
                        } else {
                          return ReS(res, "Cashout request has been sent.", {
                            accountLink: false,
                          });
                        }
                      })
                      .catch((err) => {
                        console.log(
                          "ERROR IN UPDATE USER WALLET DETAILS : ",
                          err
                        );
                        return ReE(res, "Failed to send your request", 400);
                      });
                  })
                  .catch((err) => {
                    console.log("ERROR IN CREATE User Payout Details : ", err);
                    return ReE(res, "Failed to send your request", 400);
                  });
              })
              .catch((err) => {
                console.log("ERROR IN CREATE TRANSFER : ", err);
                return ReE(res, "Failed to send your request", 400);
              });
          } else {
            return ReE(res, "Failed to send your request", 400);
          }
        } else {
          return ReE(res, "Failed to send your request", 400);
        }
      } else {
        if (
          retrivedCustomerDetails.requirements.disabled_reason ==
          "requirements.pending_verification"
        ) {
          return ReE(
            res,
            "Your bank account verification is in process. Please try after sometime.",
            400
          );
        } else {
          await stripe.accountLinks
            .create({
              account: retrivedCustomerDetails.id,
              refresh_url: `${process.env.BASE_URL}/profile`,
              return_url: `${process.env.BASE_URL}/profile`,
              type: "account_onboarding",
            })
            .then((result) => {
              return ReS(res, "Account Link Created.", {
                accountLink: true,
                data: result,
              });
            })
            .catch((err) => {
              console.log("Error In Creating Account Link : ", err);
              return ReE(res, "Failed to send your request", 400);
            });
        }
      }
    } else {
      return ReE(res, "Please add bank account to proceed further.", 400);
    }
  };

  let inProcessCount = await UserWalletDetails.count({
    where: {
      user_id,
      status: 2,
    },
  });
  if (inProcessCount > 0) {
    return ReE(res, "Your last payout request is in process!", 400);
  } else {
    await UserWalletDetails.findAll({
      where: {
        user_id,
        id: idArr,
        status: 0,
      },
    })
      .then(async (data) => {
        let amount = 0;
        await data.map((val) => {
          amount += val.dataValues.amount;
        });
        if (amount > 0) {
          await sendRequest(amount);
        } else {
          return ReE(res, "Insufficient balance in wallet.", 400);
        }
      })
      .catch((err) => {
        console.log("ERROR in GET Wallet details: ", err);
        return ReE(res, "Failed to send your request", 400);
      });
  }
};

module.exports.addBankAccount = async (req, res) => {
  let postdata = req.body;

  const existingCustomer = await StripeCustomers.findOne({
    where: {
      user_id: postdata.user_id,
    },
  });

  if (existingCustomer && existingCustomer.account_id) {
    const retrivedCustomerDetails = await stripe.accounts.retrieve(
      existingCustomer.account_id
    );
    let externalAccounts = retrivedCustomerDetails.external_accounts.data;
    let bankObject = externalAccounts.filter(
      (val) => val.object == "bank_account"
    );
    if (
      retrivedCustomerDetails.payouts_enabled === true &&
      bankObject.length > 0
    ) {
      return ReE(res, "You have an existing bank account", 400);
    } else {
      await stripe.accountLinks
        .create({
          account: retrivedCustomerDetails.id,
          refresh_url: `${process.env.BASE_URL}/profile`,
          return_url: `${process.env.BASE_URL}/profile`,
          type: "account_onboarding",
        })
        .then((result) => {
          return ReS(res, "Account Link Created.", {
            accountLink: true,
            data: result,
          });
        })
        .catch((err) => {
          console.log("Error In Creating Account Link : ", err);
          return ReE(res, "Failed to add bank account", 400);
        });
    }
  } else {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: postdata.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const createLink = async () => {
      await stripe.accountLinks
        .create({
          account: account.id,
          refresh_url: `${process.env.BASE_URL}/profile`,
          return_url: `${process.env.BASE_URL}/profile`,
          type: "account_onboarding",
        })
        .then((result) => {
          return ReS(res, "Account Link Created.", {
            accountLink: true,
            data: result,
          });
        })
        .catch((err) => {
          console.log("Error In Creating Account Link : ", err);
          return ReE(res, "Failed to add bank account", 400);
        });
    };

    if (existingCustomer) {
      await StripeCustomers.update(
        {
          account_id: account.id,
        },
        {
          where: {
            user_id: postdata.user_id,
          },
        }
      )
        .then(async (data) => {
          await createLink();
        })
        .catch((err) => {
          console.log("Error In Creating Stripe Customer Database : ", err);
          return ReE(res, "Failed to add bank account", 400);
        });
    } else {
      await StripeCustomers.create({
        user_id: postdata.user_id,
        account_id: account.id,
      })
        .then(async (data) => {
          await createLink();
        })
        .catch((err) => {
          console.log("Error In Creating Stripe Customer Database : ", err);
          return ReE(res, "Failed to add bank account", 400);
        });
    }
  }
};
