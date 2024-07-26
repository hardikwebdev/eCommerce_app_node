const _ = require("underscore");
const fs = require("fs");
const path = require("path");
const ProductImages = require("../models").ProductImages;
const Products = require("../models").Products;
const BlackoutDates = require("../models").BlackoutDates;
const Orders = require("../models").Orders;
const OrderDetails = require("../models").OrderDetails;
const UserPayoutDetails = require("../models").UserPayoutDetails;
const UserWalletDetails = require("../models").UserWalletDetails;
const StripeCustomers = require("../models").StripeCustomers;
const sequelize = require("../models").sequelize;
const moment = require("moment");
const AWS = require("aws-sdk");
const shipStationApi = require("../routes/v1-api/shipstation/index");
const zipcodes = require("zipcodes");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const transporter = require("../config/nodemailer").transporter;

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

let Sequelize = require("sequelize");
const Op = Sequelize.Op;

/**
 * Function to remove blackout dates
 */
module.exports.remove_blackout_dates = async function () {
  let limit = 3000;
  let offset = 0;
  let page = 1;
  let totalRecords = 3000;

  // Function to update blackout dates
  const deleteBlackoutdates = async (id) => {
    await BlackoutDates.update(
      {
        deletedAt: new Date(),
      },
      {
        where: {
          id,
        },
      }
    );
  };

  let idArr = [];

  // Loop through all IDs and delete blackout dates
  const loop = async () => {
    for (let i = 0; i < idArr.length; i++) {
      await deleteBlackoutdates(idArr[i]);
    }
    process.exit();
  };

  // Function to fetch data and process blackout dates
  let fetchData = async function (offsetD) {
    await BlackoutDates.findAll({
      limit: limit,
      offset: offsetD,
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        for (let k = 0; k < result.length; k++) {
          let startDate = new Date(result[k].dataValues.start_date);
          let endDate = new Date(result[k].dataValues.end_date);
          const date = new Date(startDate.getTime());

          const dates = [];

          while (date <= endDate) {
            dates.push(moment(new Date(date)).format("DD/MM/YYYY"));
            date.setDate(date.getDate() + 1);
          }

          if (dates.includes(moment(new Date()).format("DD/MM/YYYY"))) {
            let id = result[k].dataValues.id;
            idArr.push(id);
          }
        }

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await loop();
        } else {
          await fetchData(offsetd);
        }
      } else {
        await loop();
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await fetchData(offset);
  } else {
    await loop();
  }
};

/**
 * Function to create shipment
 */
module.exports.create_shipment = async function () {
  let shipStationPromiseArr = [];
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;

  // Function to create ShipStation order
  const createShipStationOrder = async (createOrderData) => {
    let shippingType = isJSON(createOrderData.shipping_type)
      ? JSON.parse(createOrderData.shipping_type)
      : createOrderData.shipping_type;
    if (shippingType?.zip_code == "") {
      let carrierData = await shipStationApi.getShipstationCarriers();

      if (carrierData.status == 200) {
        let carrierCodeArr = carrierData.data.carrierCode;
        let curOrderData = isJSON(createOrderData.order_data)
          ? JSON.parse(createOrderData.order_data)
          : createOrderData.order_data;
        let buyerAddressFetched = curOrderData.shippingAddress;
        let sellerAddressFetched = curOrderData.sellerAddress;

        let sellerAddDetails = await zipcodes.lookup(
          sellerAddressFetched.zip_code
        );
        let buyerAddDetails = await zipcodes.lookup(
          buyerAddressFetched.zip_code
        );

        let sellerAddArray = sellerAddressFetched.address.replace(
          /[&\/\\#,+()$~%.:*?<>{}]/g,
          ""
        );
        let buyerAddArray = buyerAddressFetched.address.replace(
          /[&\/\\#,+()$~%.:*?<>{}]/g,
          ""
        );

        let tempObj = {
          carrierCode: "",
          fromPostalCode: sellerAddDetails.zip,
          toCountry: buyerAddDetails.country,
          toPostalCode: buyerAddDetails.zip,
          weight: {
            value: 1,
            units: "pounds",
          },
          confirmation: "delivery",
        };
        let rateLimit = curOrderData.shippingCharges.service_type;
        let ratesData = await shipStationApi.getShipstationRates(
          tempObj,
          rateLimit,
          carrierCodeArr
        );
        let shipDate = moment(curOrderData.items[0].start_date)
          .subtract(4, "d")
          .format("YYYY-MM-DD");
        let returnDate = moment(curOrderData.items[0].end_date).format(
          "YYYY-MM-DD"
        );

        if (ratesData.status == 200) {
          let serviceCode = ratesData.data.lessCost.serviceCode;
          let filteredArr = await carrierCodeArr.filter((val) =>
            serviceCode.includes(val)
          );
          let carrierCode = filteredArr[0];

          if (createOrderData.shipping_label == null) {
            let shippingLabel = {
              carrierCode: carrierCode,
              serviceCode: serviceCode,
              packageCode: "package",
              confirmation: "delivery",
              weight: {
                value: 1,
                units: "pounds",
              },
              shipFrom: {
                name: sellerAddressFetched.name,
                company: null,
                street1: sellerAddArray,
                city: sellerAddDetails.city,
                state: sellerAddDetails.state,
                postalCode: sellerAddDetails.zip,
                country: sellerAddDetails.country,
                phone: sellerAddressFetched.phone_number,
              },
              shipTo: {
                name: buyerAddressFetched.first_name,
                company: null,
                street1: buyerAddArray,
                city: buyerAddDetails.city,
                state: buyerAddDetails.state,
                postalCode: buyerAddDetails.zip,
                country: buyerAddDetails.country,
                phone: buyerAddressFetched.phone_number,
              },
              insuranceOptions: null,
              internationalOptions: null,
              advancedOptions: null,
              testLabel: false,
            };

            let stringfyShippingLabel = JSON.stringify(shippingLabel);
            let createdShippingLabel =
              await shipStationApi.createShipstationShippingLabel(
                stringfyShippingLabel
              );
            if (createdShippingLabel.status == 200) {
              await Orders.update(
                {
                  shipping_label: JSON.stringify(
                    createdShippingLabel.data.generatedLabel
                  ),
                },
                {
                  where: {
                    id: createOrderData.id,
                  },
                }
              );

              // Send Mail
              let label = createdShippingLabel.data.generatedLabel.labelData;

              let orderData = createOrderData.order_data;
              orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

              let items = [...orderData.items];
              const amount = items.reduce((accumulator, object) => {
                return accumulator + object.total_amount * 0.8;
              }, 0);

              orderData.shipping_type = "Shipping";
              orderData.shippingLabel = label;

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
                  image_url:
                    val.dataValues.ProductImages[0].dataValues.image_url,
                  title: val.dataValues.title,
                  id: val.dataValues.id,
                };
                newItemArr.push(tempObj);
              });

              orderData.start_date = convertTimezone(items[0].start_date);
              orderData.end_date = convertTimezone(items[0].end_date);
              orderData.items = newItemArr;
              orderData.order_id = createOrderData.id;
              orderData.amount = amount.toFixed(2);

              let mailOptions = {
                from: CONFIG.welcomeemail,
                to: orderData.sellerAddress.email,
                template: "p0-order-confirmation-shipping-seller",
                subject: "Congratulations! You Have A Rental! ✨",
                context: {
                  fullName: orderData.sellerAddress.name,
                  redirectUrl: CONFIG.BASE_URL,
                  mailTo: CONFIG.welcomeemail,
                  storeUrl: CONFIG.BASE_URL,
                  ecommerceLogo: CONFIG.ecommerce_LOGO,
                  orderDetails: orderData,
                },
              };
              const customPromise = new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                  if (!error) {
                    resolve("Email Sent");
                  } else {
                    resolve("Email Not Sent");
                  }
                });
              });
              shipStationPromiseArr.push(customPromise);
            }
          }
        }
      }
    }
  };

  // Loop through order IDs to create shipments
  const loop = async () => {
    for (let i = 0; i < idArr.length; i++) {
      await createShipStationOrder(idArr[i]);
    }
    process.exit();
  };

  // Function to fetch data and process orders for shipments
  let fetchData = async function (offsetD) {
    await Orders.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        shipping_type: { [Op.ne]: "In-store Pickup" },
        shipping_label: null,
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        for (let k = 0; k < result.length; k++) {
          let id = result[k].dataValues.id;
          idArr.push(id);
        }

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await loop();
        } else {
          await fetchData(offsetd);
        }
      } else {
        await loop();
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await fetchData(offset);
  } else {
    await loop();
  }
};

/**
 * Helper function to check if a string is JSON
 * @param {string} str
 * @returns {boolean}
 */
const isJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * Helper function to convert date to specific timezone
 * @param {string} date
 * @returns {string}
 */
const convertTimezone = (date) => {
  let formatDate = moment.tz(date, "America/Chicago").format("MM/DD/YYYY");
  return formatDate;
};

// Function to fetch data and check payout status
let fetchData = async function (offsetD) {
  await UserPayoutDetails.findAll({
    limit: limit,
    offset: offsetD,
    where: {
      transfer_id: { [Op.not]: null },
      payout_status: 2,
      wallet_details: { [Op.not]: null },
      payout_id: { [Op.not]: null },
    },
  }).then(async (result) => {
    totalRecords = result.length;
    page++;
    if (result.length > 0) {
      for (let k = 0; k < result.length; k++) {
        promiseArray.push(checkPayoutStatus(result[k].dataValues));
      }

      let offsetd = limit * (parseInt(page) - 1);

      if (totalRecords < limit) {
        await Promise.all(promiseArray);
        process.exit();
      } else {
        await Promise.all(promiseArray);
        await fetchData(offsetd);
      }
    } else {
      await Promise.all(promiseArray);
      process.exit();
    }
  });
};

module.exports.order_reminder_24hours_before_toseller = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  // Function to send a reminder to the seller
  const sendReminder = async (order) => {
    let orderData = isJSON(order.dataValues.order_data)
      ? JSON.parse(order.dataValues.order_data)
      : order.dataValues.order_data;
    let items = [...orderData.items];
    let shippingType = isJSON(orderData.items[0].shipping_type)
      ? JSON.parse(orderData.items[0].shipping_type)
      : orderData.items[0].shipping_type;
    let orderShippingType =
      shippingType.zip_code === ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;

    orderData.shipping_type = orderShippingType;
    if (orderShippingType === "Shipping") {
      let itemIdArr = _.pluck(items, "product_id");

      let products = await Products.findAll({
        where: { id: { [Op.in]: itemIdArr } },
      });

      let newItemArr = products.map((val) => val.dataValues.title);

      orderData.start_date = convertTimezone(items[0].start_date);
      orderData.end_date = convertTimezone(items[0].end_date);
      orderData.order_id = order.dataValues.id;
      orderData.productsList = newItemArr.join(", ");

      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.sellerAddress.email,
        template: "order-reminder-24hours-before-seller",
        subject: "🚨Reminder: Ship Your Upcoming Rental",
        context: {
          fullName: orderData.sellerAddress.name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve) => {
        transporter.sendMail(mailOptions, (error) => {
          resolve("done");
        });
      });
      promiseArray.push(customPromise);
    }
  };

  // Function to fetch data and send reminders
  let fetchData = async function (offsetD) {
    let before24HoursDate = moment().add(24, "hours").format("MM/DD/YYYY");
    let date = new Date(before24HoursDate);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        start_date: date,
        shipping_status: 0,
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: { id: { [Op.in]: sortedOrderId } },
        }).then(async (orders) => {
          for (let k = 0; k < orders.length; k++) {
            promiseArray.push(sendReminder(orders[k]));
          }
          let offsetd = limit * (parseInt(page) - 1);

          if (totalRecords < limit) {
            await Promise.all(promiseArray);
            process.exit();
          } else {
            await Promise.all(promiseArray);
            await fetchData(offsetd);
          }
        });
      } else {
        await Promise.all(promiseArray);
        process.exit();
      }
    });
  };

  if (totalRecords !== 0) {
    offset = limit * (parseInt(page) - 1);
    await fetchData(offset);
  } else {
    process.exit();
  }
};

// Second here
module.exports.day_after_rental_date_start_seller = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  const sendReminder = async (order) => {
    let orderData = order.dataValues.order_data;
    orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

    let items = [...orderData.items];

    let shippingType = orderData.items[0].shipping_type;
    shippingType = isJSON(shippingType)
      ? JSON.parse(shippingType)
      : shippingType;
    let orderShippingType =
      shippingType.zip_code == ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;

    orderData.shipping_type = orderShippingType;
    if (orderShippingType === "Shipping") {
      let itemIdArr = _.pluck(items, "product_id");

      let products = await Products.findAll({
        where: {
          id: { [Op.in]: itemIdArr },
        },
      });

      let newItemArr = [];

      await products.map((val) => {
        newItemArr.push(val.dataValues.title);
      });

      orderData.start_date = convertTimezone(items[0].start_date);
      orderData.end_date = convertTimezone(items[0].end_date);
      orderData.order_id = order.dataValues.id;
      orderData.productsList = newItemArr.join(", ");

      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.sellerAddress.email,
        template: "late-reminder-24hours-after-seller",
        subject: "🚨 Your Rental is Late",
        context: {
          fullName: orderData.sellerAddress.name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (!error) {
            resolve("Done");
          } else {
            console.log("Failed : ", error);
            resolve("done");
          }
        });
      });
      promiseArray.push(customPromise);
    } else {
      return;
    }
  };

  let fetchData = async function (offsetD) {
    let after24HoursDate = moment(new Date())
      .subtract(24, "hours")
      .format("MM/DD/YYYY");
    let date = new Date(after24HoursDate);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        start_date: date,
        shipping_status: 0,
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: {
            id: sortedOrderId,
          },
        }).then(async (orderData) => {
          for (let k = 0; k < orderData.length; k++) {
            await Promise.all(promiseArray).then(async () => {
              promiseArray.push(await sendReminder(orderData[k]));
            });
          }
        });

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        } else {
          await Promise.all(promiseArray)
            .then(async () => {
              await fetchData(offsetd);
            })
            .catch((err) => console.log("ERROR IN PROMISE", err));
        }
      } else {
        await Promise.all(promiseArray).then(async () => {
          process.exit();
        });
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await Promise.all(promiseArray)
      .then(async () => {
        await fetchData(offset);
      })
      .catch((err) => console.log("ERROR IN PROMISE", err));
  } else {
    await Promise.all(promiseArray).then(async () => {
      process.exit();
    });
  }
};

module.exports.on_rental_end_date_buyer = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  const sendReminder = async (order) => {
    let orderData = order.dataValues.order_data;
    orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

    let shippingType = orderData.items[0].shipping_type;
    shippingType = isJSON(shippingType)
      ? JSON.parse(shippingType)
      : shippingType;
    let orderShippingType =
      shippingType.zip_code == ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;

    if (orderShippingType === "Shipping") {
      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.shippingAddress.email,
        template: "on_rental_end_date_buyer",
        subject: `🚨Reminder: Return Rental`,
        context: {
          fullName: orderData.shippingAddress.first_name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (!error) {
            resolve("Done");
          } else {
            console.log("Failed : ", error);
            resolve("done");
          }
        });
      });
      promiseArray.push(customPromise);
    } else {
      return;
    }
  };

  let fetchData = async function (offsetD) {
    let endDate = moment(new Date()).format("MM/DD/YYYY");
    let date = new Date(endDate);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        end_date: date,
        shipping_status: [5, 2], //Status Mark As Delivered or Mark As Shipped.
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: {
            id: sortedOrderId,
          },
        }).then(async (orderData) => {
          for (let k = 0; k < orderData.length; k++) {
            await Promise.all(promiseArray).then(async () => {
              promiseArray.push(await sendReminder(orderData[k]));
            });
          }
        });

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        } else {
          await Promise.all(promiseArray)
            .then(async () => {
              await fetchData(offsetd);
            })
            .catch((err) => console.log("ERROR IN PROMISE", err));
        }
      } else {
        await Promise.all(promiseArray).then(async () => {
          process.exit();
        });
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await Promise.all(promiseArray)
      .then(async () => {
        await fetchData(offset);
      })
      .catch((err) => console.log("ERROR IN PROMISE", err));
  } else {
    await Promise.all(promiseArray).then(async () => {
      process.exit();
    });
  }
};

module.exports.after_1day_rental_end_date_buyer = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  const sendReminder = async (order) => {
    let orderData = order.dataValues.order_data;
    orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

    let items = [...orderData.items];

    let shippingType = orderData.items[0].shipping_type;
    shippingType = isJSON(shippingType)
      ? JSON.parse(shippingType)
      : shippingType;
    let orderShippingType =
      shippingType.zip_code == ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;
    if (orderShippingType === "Shipping") {
      orderData.end_date = convertTimezone(items[0].end_date);

      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.shippingAddress.email,
        template: "1day_after_rental_end_date_buyer",
        subject: `🚨 Your Rental Return is Late`,
        context: {
          fullName: orderData.shippingAddress.first_name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (!error) {
            resolve("Done");
          } else {
            console.log("Failed : ", error);
            resolve("done");
          }
        });
      });
      promiseArray.push(customPromise);
    } else {
      return;
    }
  };

  let fetchData = async function (offsetD) {
    let after1DayDate = moment(new Date())
      .subtract(1, "days")
      .format("MM/DD/YYYY");
    let date = new Date(after1DayDate);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        end_date: date,
        shipping_status: [5, 2], //Status Mark As Delivered or Mark As Shipped.
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: {
            id: sortedOrderId,
          },
        }).then(async (orderData) => {
          for (let k = 0; k < orderData.length; k++) {
            await Promise.all(promiseArray).then(async () => {
              promiseArray.push(await sendReminder(orderData[k]));
            });
          }
        });

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        } else {
          await Promise.all(promiseArray)
            .then(async () => {
              await fetchData(offsetd);
            })
            .catch((err) => console.log("ERROR IN PROMISE", err));
        }
      } else {
        await Promise.all(promiseArray).then(async () => {
          process.exit();
        });
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await Promise.all(promiseArray)
      .then(async () => {
        await fetchData(offset);
      })
      .catch((err) => console.log("ERROR IN PROMISE", err));
  } else {
    await Promise.all(promiseArray).then(async () => {
      process.exit();
    });
  }
};

module.exports.local_pickup_reminder_24hours_before_start_date_tobuyer =
  async function () {
    let limit = 100;
    let offset = 0;
    let page = 1;
    let totalRecords = 100;
    let promiseArray = [];

    const sendReminder = async (order) => {
      let orderData = order.dataValues.order_data;
      orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

      let items = [...orderData.items];

      let shippingType = orderData.items[0].shipping_type;
      shippingType = isJSON(shippingType)
        ? JSON.parse(shippingType)
        : shippingType;
      let orderShippingType =
        shippingType.zip_code == ""
          ? "Shipping"
          : orderData.sellerAddress.zip_code;
      if (orderShippingType != "Shipping") {
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
        orderData.items = newItemArr;
        orderData.order_id = order.dataValues.id;

        let mailOptions = {
          from: CONFIG.welcomeemail,
          to: orderData.shippingAddress.email,
          template: "local_pickup_reminder_24hours_before_start_date_tobuyer",
          subject: `✨ You Local Pick Up Order Starts in 24 hours! `,
          context: {
            fullName: orderData.shippingAddress.first_name,
            redirectUrl: CONFIG.BASE_URL,
            mailTo: CONFIG.welcomeemail,
            storeUrl: CONFIG.BASE_URL,
            // filePath: CONFIG.IMAGE_URL,
            ecommerceLogo: CONFIG.ecommerce_LOGO,
            orderDetails: orderData,
          },
        };

        const customPromise = new Promise((resolve, reject) => {
          transporter.sendMail(mailOptions, (error, info) => {
            if (!error) {
              resolve("Done");
            } else {
              console.log("Failed : ", error);
              resolve("done");
            }
          });
        });
        promiseArray.push(customPromise);
      } else {
        return;
      }
    };

    let fetchData = async function (offsetD) {
      let after1DayDate = moment(new Date())
        .add(24, "hours")
        .format("MM/DD/YYYY");
      let date = new Date(after1DayDate);
      await OrderDetails.findAll({
        limit: limit,
        offset: offsetD,
        where: {
          start_date: date,
          shipping_status: 0,
        },
      }).then(async (result) => {
        totalRecords = result.length;
        page++;
        if (result.length > 0) {
          let orderIds = _.pluck(result, "order_id");
          let sortedOrderId = _.uniq(orderIds);

          await Orders.findAll({
            where: {
              id: sortedOrderId,
            },
          }).then(async (orderData) => {
            for (let k = 0; k < orderData.length; k++) {
              await Promise.all(promiseArray).then(async () => {
                promiseArray.push(await sendReminder(orderData[k]));
              });
            }
          });

          let offsetd = limit * (parseInt(page) - 1);

          if (totalRecords < limit) {
            await Promise.all(promiseArray).then(async () => {
              process.exit();
            });
          } else {
            await Promise.all(promiseArray)
              .then(async () => {
                await fetchData(offsetd);
              })
              .catch((err) => console.log("ERROR IN PROMISE", err));
          }
        } else {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        }
      });
    };

    if (totalRecords != 0) {
      offset = limit * (parseInt(page) - 1);
      await Promise.all(promiseArray)
        .then(async () => {
          await fetchData(offset);
        })
        .catch((err) => console.log("ERROR IN PROMISE", err));
    } else {
      await Promise.all(promiseArray).then(async () => {
        process.exit();
      });
    }
  };

module.exports.local_pickup_before_48hours_rental_end_date_buyer =
  async function () {
    let limit = 100;
    let offset = 0;
    let page = 1;
    let totalRecords = 100;
    let promiseArray = [];

    const sendReminder = async (order) => {
      let orderData = order.dataValues.order_data;
      orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

      let items = [...orderData.items];

      let shippingType = orderData.items[0].shipping_type;
      shippingType = isJSON(shippingType)
        ? JSON.parse(shippingType)
        : shippingType;
      let orderShippingType =
        shippingType.zip_code == ""
          ? "Shipping"
          : orderData.sellerAddress.zip_code;

      if (orderShippingType !== "Shipping") {
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
        orderData.items = newItemArr;

        let mailOptions = {
          from: CONFIG.welcomeemail,
          to: orderData.shippingAddress.email,
          template: "local_pickup_48hours_before_rental_end_date_buyer",
          subject: `🚨Reminder: Return Rental`,
          context: {
            fullName: orderData.shippingAddress.first_name,
            redirectUrl: CONFIG.BASE_URL,
            mailTo: CONFIG.welcomeemail,
            storeUrl: CONFIG.BASE_URL,
            // filePath: CONFIG.IMAGE_URL,
            ecommerceLogo: CONFIG.ecommerce_LOGO,
            orderDetails: orderData,
          },
        };

        const customPromise = new Promise((resolve, reject) => {
          transporter.sendMail(mailOptions, (error, info) => {
            if (!error) {
              resolve("Done");
            } else {
              console.log("Failed : ", error);
              resolve("done");
            }
          });
        });
        promiseArray.push(customPromise);
      } else {
        return;
      }
    };

    let fetchData = async function (offsetD) {
      let before48HoursDate = moment(new Date())
        .add(48, "hours")
        .format("MM/DD/YYYY");
      let date = new Date(before48HoursDate);
      await OrderDetails.findAll({
        limit: limit,
        offset: offsetD,
        where: {
          end_date: date,
          shipping_status: 3, //Mark As Picked Up.
        },
      }).then(async (result) => {
        totalRecords = result.length;
        page++;
        if (result.length > 0) {
          let orderIds = _.pluck(result, "order_id");
          let sortedOrderId = _.uniq(orderIds);

          await Orders.findAll({
            where: {
              id: sortedOrderId,
            },
          }).then(async (orderData) => {
            for (let k = 0; k < orderData.length; k++) {
              await Promise.all(promiseArray).then(async () => {
                promiseArray.push(await sendReminder(orderData[k]));
              });
            }
          });

          let offsetd = limit * (parseInt(page) - 1);

          if (totalRecords < limit) {
            await Promise.all(promiseArray).then(async () => {
              process.exit();
            });
          } else {
            await Promise.all(promiseArray)
              .then(async () => {
                await fetchData(offsetd);
              })
              .catch((err) => console.log("ERROR IN PROMISE", err));
          }
        } else {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        }
      });
    };

    if (totalRecords != 0) {
      offset = limit * (parseInt(page) - 1);
      await Promise.all(promiseArray)
        .then(async () => {
          await fetchData(offset);
        })
        .catch((err) => console.log("ERROR IN PROMISE", err));
    } else {
      await Promise.all(promiseArray).then(async () => {
        process.exit();
      });
    }
  };

module.exports.local_pickup_1day_after_rental_end_date_buyer =
  async function () {
    let limit = 100;
    let offset = 0;
    let page = 1;
    let totalRecords = 100;
    let promiseArray = [];

    const sendReminder = async (order) => {
      let orderData = order.dataValues.order_data;
      orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

      let items = [...orderData.items];

      let shippingType = orderData.items[0].shipping_type;
      shippingType = isJSON(shippingType)
        ? JSON.parse(shippingType)
        : shippingType;
      let orderShippingType =
        shippingType.zip_code == ""
          ? "Shipping"
          : orderData.sellerAddress.zip_code;

      if (orderShippingType !== "Shipping") {
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
        orderData.items = newItemArr;

        let mailOptions = {
          from: CONFIG.welcomeemail,
          to: orderData.shippingAddress.email,
          template: "local_pickup_1day_after_rental_end_date_buyer",
          subject: `🚨Reminder: Return Rental`,
          context: {
            fullName: orderData.shippingAddress.first_name,
            redirectUrl: CONFIG.BASE_URL,
            mailTo: CONFIG.welcomeemail,
            storeUrl: CONFIG.BASE_URL,
            // filePath: CONFIG.IMAGE_URL,
            ecommerceLogo: CONFIG.ecommerce_LOGO,
            orderDetails: orderData,
          },
        };

        const customPromise = new Promise((resolve, reject) => {
          transporter.sendMail(mailOptions, (error, info) => {
            if (!error) {
              resolve("Done");
            } else {
              console.log("Failed : ", error);
              resolve("done");
            }
          });
        });
        promiseArray.push(customPromise);
      } else {
        return;
      }
    };

    let fetchData = async function (offsetD) {
      let after1Day = moment(new Date())
        .subtract(1, "days")
        .format("MM/DD/YYYY");
      let date = new Date(after1Day);
      await OrderDetails.findAll({
        limit: limit,
        offset: offsetD,
        where: {
          end_date: date,
          shipping_status: 3, //Mark As Picked Up.
        },
      }).then(async (result) => {
        totalRecords = result.length;
        page++;
        if (result.length > 0) {
          let orderIds = _.pluck(result, "order_id");
          let sortedOrderId = _.uniq(orderIds);

          await Orders.findAll({
            where: {
              id: sortedOrderId,
            },
          }).then(async (orderData) => {
            for (let k = 0; k < orderData.length; k++) {
              await Promise.all(promiseArray).then(async () => {
                promiseArray.push(await sendReminder(orderData[k]));
              });
            }
          });

          let offsetd = limit * (parseInt(page) - 1);

          if (totalRecords < limit) {
            await Promise.all(promiseArray).then(async () => {
              process.exit();
            });
          } else {
            await Promise.all(promiseArray)
              .then(async () => {
                await fetchData(offsetd);
              })
              .catch((err) => console.log("ERROR IN PROMISE", err));
          }
        } else {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        }
      });
    };

    if (totalRecords != 0) {
      offset = limit * (parseInt(page) - 1);
      await Promise.all(promiseArray)
        .then(async () => {
          await fetchData(offset);
        })
        .catch((err) => console.log("ERROR IN PROMISE", err));
    } else {
      await Promise.all(promiseArray).then(async () => {
        process.exit();
      });
    }
  };

module.exports.local_pickup_on_end_date_seller = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  const sendReminder = async (order) => {
    let orderData = order.dataValues.order_data;
    orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

    let items = [...orderData.items];

    let shippingType = orderData.items[0].shipping_type;
    shippingType = isJSON(shippingType)
      ? JSON.parse(shippingType)
      : shippingType;
    let orderShippingType =
      shippingType.zip_code == ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;
    if (orderShippingType != "Shipping") {
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
      orderData.items = newItemArr;
      orderData.order_id = order.dataValues.id;

      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.sellerAddress.email,
        template: "local_pickup_on_end_date_seller",
        subject: `Have you coordinated your return pickup?`,
        context: {
          fullName: orderData.sellerAddress.first_name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (!error) {
            resolve("Done");
          } else {
            console.log("Failed : ", error);
            resolve("done");
          }
        });
      });
      promiseArray.push(customPromise);
    } else {
      return;
    }
  };

  let fetchData = async function (offsetD) {
    let after1DayDate = moment(new Date()).format("MM/DD/YYYY");
    let date = new Date(after1DayDate);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        end_date: date,
        shipping_status: 3,
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: {
            id: sortedOrderId,
          },
        }).then(async (orderData) => {
          for (let k = 0; k < orderData.length; k++) {
            await Promise.all(promiseArray).then(async () => {
              promiseArray.push(await sendReminder(orderData[k]));
            });
          }
        });

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        } else {
          await Promise.all(promiseArray)
            .then(async () => {
              await fetchData(offsetd);
            })
            .catch((err) => console.log("ERROR IN PROMISE", err));
        }
      } else {
        await Promise.all(promiseArray).then(async () => {
          process.exit();
        });
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await Promise.all(promiseArray)
      .then(async () => {
        await fetchData(offset);
      })
      .catch((err) => console.log("ERROR IN PROMISE", err));
  } else {
    await Promise.all(promiseArray).then(async () => {
      process.exit();
    });
  }
};

module.exports.local_pickup_3days_after_end_date_buyer = async function () {
  let limit = 100;
  let offset = 0;
  let page = 1;
  let totalRecords = 100;
  let promiseArray = [];

  const sendReminder = async (order) => {
    let orderData = order.dataValues.order_data;
    orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

    let items = [...orderData.items];

    let shippingType = orderData.items[0].shipping_type;
    shippingType = isJSON(shippingType)
      ? JSON.parse(shippingType)
      : shippingType;
    let orderShippingType =
      shippingType.zip_code == ""
        ? "Shipping"
        : orderData.sellerAddress.zip_code;

    if (orderShippingType !== "Shipping") {
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
      orderData.items = newItemArr;

      let mailOptions = {
        from: CONFIG.welcomeemail,
        to: orderData.shippingAddress.email,
        template: "local_pickup_3days_after_end_date_buyer",
        subject: `🚨Reminder: Return Rental`,
        context: {
          fullName: orderData.shippingAddress.first_name,
          redirectUrl: CONFIG.BASE_URL,
          mailTo: CONFIG.welcomeemail,
          storeUrl: CONFIG.BASE_URL,
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData,
        },
      };

      const customPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (!error) {
            resolve("Done");
          } else {
            console.log("Failed : ", error);
            resolve("done");
          }
        });
      });
      promiseArray.push(customPromise);
    } else {
      return;
    }
  };

  let fetchData = async function (offsetD) {
    let after3Day = moment(new Date()).subtract(3, "days").format("MM/DD/YYYY");
    let date = new Date(after3Day);
    await OrderDetails.findAll({
      limit: limit,
      offset: offsetD,
      where: {
        end_date: date,
        shipping_status: 3, //Mark As Picked Up.
      },
    }).then(async (result) => {
      totalRecords = result.length;
      page++;
      if (result.length > 0) {
        let orderIds = _.pluck(result, "order_id");
        let sortedOrderId = _.uniq(orderIds);

        await Orders.findAll({
          where: {
            id: sortedOrderId,
          },
        }).then(async (orderData) => {
          for (let k = 0; k < orderData.length; k++) {
            await Promise.all(promiseArray).then(async () => {
              promiseArray.push(await sendReminder(orderData[k]));
            });
          }
        });

        let offsetd = limit * (parseInt(page) - 1);

        if (totalRecords < limit) {
          await Promise.all(promiseArray).then(async () => {
            process.exit();
          });
        } else {
          await Promise.all(promiseArray)
            .then(async () => {
              await fetchData(offsetd);
            })
            .catch((err) => console.log("ERROR IN PROMISE", err));
        }
      } else {
        await Promise.all(promiseArray).then(async () => {
          process.exit();
        });
      }
    });
  };

  if (totalRecords != 0) {
    offset = limit * (parseInt(page) - 1);
    await Promise.all(promiseArray)
      .then(async () => {
        await fetchData(offset);
      })
      .catch((err) => console.log("ERROR IN PROMISE", err));
  } else {
    await Promise.all(promiseArray).then(async () => {
      process.exit();
    });
  }
};
