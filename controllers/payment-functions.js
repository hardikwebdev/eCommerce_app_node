const Orders = require("../models").Orders;
const Products = require("../models").Products;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const transporter = require("../config/nodemailer").transporter;
const OrderDetails = require("../models").OrderDetails;
const UserCartDetails = require("../models").UserCartDetails;
const Users = require("../models").Users;
const StripeCustomers = require("../models").StripeCustomers;
const UserAddresses = require("../models").UserAddresses;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const _ = require('underscore');
const ProductImages = require("../models").ProductImages;
const moment = require('moment');


const sendMailHandler = async (mailOptions, callback) => {
  transporter.sendMail(mailOptions, (error, info) => {
    if (!error) {
      let tempObj = {
        status: 200,
        data: "Success"
      };
      callback(tempObj);
    } else {
      console.log("Failed : ", error)
      let tempObj = {
        status: 400,
        error: error
      };
      callback(tempObj);
    }
  });
};

module.exports.paymentSucceed = async (sessionData, req, callback) => {
  let metaData = { ...sessionData.metadata };
  // let orderArr = isJSON(sessionData.metadata.orderArr) ? JSON.parse(sessionData.metadata.orderArr) : sessionData.metadata.orderArr;
  let orderArr = [];
  for (const key in metaData) {
    if (key.includes("itemDetail_")) {
      let isParse = isJSON(metaData[key]) ? JSON.parse(metaData[key]) : metaData[key];
      orderArr.push(isParse);
    }
  }

  let promiseArr = [];
  let sortedArr = [];
  let session_id = sessionData.id;
  const customer = await stripe.customers.retrieve(sessionData?.customer);
  let address = JSON.stringify(customer?.shipping?.address);
  let session_details = JSON.stringify(sessionData);
  let orderIdArr = [];

  let orderData = {
    items: orderArr,
    paymentData: isJSON(sessionData.metadata.paymentData) ? JSON.parse(sessionData.metadata.paymentData) : sessionData.metadata.paymentData,
    shippingAddress: isJSON(sessionData.metadata.shippingAddress) ? JSON.parse(sessionData.metadata.shippingAddress) : sessionData.metadata.shippingAddress,
    shippingCharges: isJSON(sessionData.metadata.shippingCharges) ? JSON.parse(sessionData.metadata.shippingCharges) : sessionData.metadata.shippingCharges
  };

  orderData = JSON.stringify(orderData);

  let exisitngOrder = await Orders.findOne({
    where: {
      session_id
    }
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
      await Products.increment("rented_count", { by: 1, where: { id } }).catch(err => console.log("ERROR In Update Rented Count : ", err));
      await Products.update({
        availability_status: 2
      }, {
        where: {
          id
        }
      }).catch(err => console.log("ERROR  IN PRODUCT AVAILABITLITY STATUS"))
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
      ).then(() => console.log("SUccess CART STATUS UPdate")).catch(err => console.log("ERROR iN cart status update : ", err));
    };

    const sendMail = async (id, order, sendTo) => {
      let orderData = order.dataValues.order_data;
      orderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;

      let items = [...orderData.items];
      const amount = items.reduce((accumulator, object) => {
        return accumulator + object.total_amount;
      }, 0);


      let shippingType = orderData.items[0].shipping_type;
      shippingType = isJSON(shippingType) ? JSON.parse(shippingType) : shippingType;
      let orderShippingType = shippingType.zip_code == "" ? "Shipping" : orderData.sellerAddress.zip_code;

      let seller = await Users.findOne({
        where: {
          id
        }
      });

      orderData.shipping_type = orderShippingType;

      let itemIdArr = _.pluck(items, "product_id");

      let products = await Products.findAll({
        where: {
          id: { [Op.in]: itemIdArr }
        },
        include: [
          {
            model: ProductImages,
            attributes: ["image_url"]
          }
        ]
      });

      let newItemArr = [];

      await products.map(val => {
        let tempObj = {
          image_url: val.dataValues.ProductImages[0].dataValues.image_url,
          title: val.dataValues.title,
          id: val.dataValues.id
        };
        newItemArr.push(tempObj);
      });

      orderData.start_date = convertTimezone(items[0].start_date);
      orderData.end_date = convertTimezone(items[0].end_date);
      orderData.items = newItemArr;
      orderData.order_id = order.dataValues.id;
      if (sendTo == "seller") {
        console.log("SELLER ")
        let total_earnings = 0;
        await items.map((val) => {
          total_earnings = (val.total_amount * 0.8).toFixed(2);
        })
        console.log("TOTAL EARNINGs : ", total_earnings);
        orderData.amount = total_earnings;
      } else {
        console.log("BUYER")
        orderData.amount = amount;
      }

      let template = shippingType.zip_code == "" ? sendTo == "buyer" ? 'p0-order-confirmation-shipping-buyer' : "p0-order-confirmation-shipping-seller" : sendTo == "buyer" ? 'p0-order-confirmation-local-pickup-buyer' : 'p0-order-confirmation-local-pickup-seller';
      let subject = shippingType.zip_code == "" ? sendTo == "buyer" ? `Your Order #${order.dataValues.id} Has Been Confirmed` : "Congratulations! You Have A Rental! ✨" : sendTo == "buyer" ? `Your Local Pick Up Order #${order.dataValues.id} Has Been Confirmed` : "🚨Congratulations! You Have A Local Pick Up Rental!";
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
          // filePath: CONFIG.IMAGE_URL,
          ecommerceLogo: CONFIG.ecommerce_LOGO,
          orderDetails: orderData
        }
      };

      sendMailHandler(mailOptions, (response) => {
        return;
      });
    }

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
      await OrderDetails.create(appendOrder).then(async (data) => {
        promiseArr.push(updateRentedCout(data.product_id));
        promiseArr.push(updateCartStatus(val));
      }).then(() => console.log("OrderDetails CREATED ")).catch(err => console.log("ERROR in OrdeOrderDetailsr Create : ", err));
    };

    const createOrderFunc = async (curval) => {
      let sellerDetails = await Users.findOne({
        where: {
          id: curval.seller_id
        },
        include: [
          {
            model: UserAddresses,
            required: true,
            where: {
              type: 0
            }
          },
        ],
        attributes: ["first_name", "last_name", "email"],
      });

      let sellerAddress = {
        ...sellerDetails.dataValues.UserAddresses[0].dataValues,
        ...sellerDetails.dataValues
      };
      delete sellerAddress.UserAddresses;

      let buyerDetails = await Users.findOne({
        where: {
          id: curval.buyer_id
        },
        attributes: ["first_name", "last_name", "email"],
      });

      let tempOrderData = isJSON(orderData) ? JSON.parse(orderData) : orderData;
      let tempObj = {
        ...tempOrderData.shippingAddress,
        ...buyerDetails.dataValues
      };
      tempOrderData.sellerAddress = sellerAddress;
      tempOrderData.shippingAddress = tempObj;

      let dateSortObj = {};
      let itemsArr = curval.orders;
      await itemsArr.map(val => {
        let str = `${moment(val.start_date).format("MM/DD/YYYY")} - ${moment(val.end_date).format("MM/DD/YYYY")}`;
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
            session_id: session_id,
            order_data: stringifyedData
          };

          await Orders.create(addOrder).then(async (data) => {
            console.log("ORDER DATA : ", data.dataValues.id);
            let tempId = data.dataValues.id;
            orderIdArr.push(tempId);
            console.log("oRder Id : ", orderIdArr)
            await itemsArray.map(async (val) => {
              promiseArr.push(await appendOrderFunc(val, data.id));
            });
            await sendMail(curval.seller_id, data, sendTo = "seller");
            await sendMail(curval.buyer_id, data, sendTo = "buyer");
          });
        });
      }
    };

    // await sortedArr.map(async (curVal) => {
    //   promiseArr.push(createOrderFunc(curVal));
    // });
    for(let i = 0; i < sortedArr.length; i++) {
      await Promise.all(promiseArr).then(async () => {
        promiseArr.push(await createOrderFunc(sortedArr[i]));
      });
    }

    await Promise.all(promiseArr)
      .then(() => {
        let responseData = {
          code: 200,
          data: "Order placed successfully!"
        }
        return callback(req, responseData);
      })
      .catch((err) => {
        console.log("LAST CATCH : ", err)
        let responseData = {
          code: 400,
          data: null,
          err: "Failed to place order!"
        }
        return callback(req, responseData);
      });
  } else {
    let responseData = {
      code: 200,
      data: "Order placed successfully!"
    }
    return callback(req, responseData);
  }
}