let express = require("express");
let router = express.Router();
const Orders = require("../../models").Orders;
const Products = require("../../models").Products;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const transporter = require("../../config/nodemailer").transporter;
const OrderDetails = require("../../models").OrderDetails;
const UserCartDetails = require("../../models").UserCartDetails;
const Users = require("../../models").Users;
const StripeCustomers = require("../../models").StripeCustomers;
const UserAddresses = require("../../models").UserAddresses;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const _ = require("underscore");
const ProductImages = require("../../models").ProductImages;
const moment = require("moment");
const paymentFunc = require("../../controllers/payment-functions");

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

const paymentFailed = async (sessionData, req, callback) => {
  let cus_id = sessionData.customer;
  let user_id = await StripeCustomers.findOne({
    where: {
      customer_id: cus_id,
    },
  });

  let sender = await Users.findOne({
    where: {
      id: user_id.user_id,
    },
  });
  if (sender) {
    let mailOptions = {
      from: CONFIG.welcomeemail,
      to: sender.email,
      template: "payment-failed",
      subject: "Payment Failed.",
      context: {
        fullName: sender.first_name,
        redirectUrl: CONFIG.BASE_URL + "/cart",
        mailTo: CONFIG.welcomeemail,
        storeUrl: CONFIG.BASE_URL,
        // filePath: CONFIG.IMAGE_URL
        ecommerceLogo: CONFIG.ecommerce_LOGO,
      },
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Failed sending mail", error);
        let responseData = {
          code: 400,
          data: null,
          err: "Failed to send mail!",
        };
        return callback(req, responseData);
      } else {
        let responseData = {
          code: 200,
          data: "Mail sent!",
        };
        return callback(req, responseData);
      }
    });
  } else {
    let responseData = {
      code: 400,
      data: null,
      err: "Failed to send mail!",
    };
    return callback(req, responseData);
  }
};

// webhook for checkout session
router.post("/", function (req, res, next) {
  const event = req.body;

  // Handle the event
  switch (event.type) {
    case "charge.failed":
      const session = event.data.object;

      new Promise((resolve, reject) => {
        paymentFailed(session, req, function (req, responseData) {
          if (responseData.code == 200) {
            resolve(responseData);
            return res.status(200).send(responseData.data);
          } else {
            reject(responseData);
            return res.status(200).send(responseData.err);
          }
        });
      });
      break;
    case "checkout.session.completed":
      const sessionA = event.data.object;

      new Promise((resolve, reject) => {
        paymentFunc.paymentSucceed(sessionA, req, function (req, responseData) {
          if (responseData.code == 200) {
            resolve(responseData);
            return res.status(200).send(responseData.data);
          } else {
            reject(responseData);
            return res.status(200).send(responseData.err);
          }
        });
      });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
});

module.exports = router;
