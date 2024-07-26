const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const StripeCustomers = require("../../../models").StripeCustomers;

module.exports.checkout = async (req, res) => {
  let postdata = req.body;
  let productArr = [];
  let address = postdata.address;
  let addressObj = {
    city: address ? (address.city ? address.city : "") : "",
    country: address ? (address.country ? address.country : "") : "",
    line1: address ? (address.address ? address.address : "") : "",
    postal_code: address ? (address.zip_code ? address.zip_code : "") : "",
    state: address ? (address.state ? address.state : "") : "",
  };
  await postdata.products.map((val) => {
    let curObj = {
      price_data: {
        currency: "usd",
        product_data: {
          name: val.productname,
        },
        unit_amount: val.price * 100,
      },
      quantity: val.count,
    };
    productArr.push(curObj);
  });

  const createCheckoutSession = async (customerId) => {
    let obj = {
      payment_method_types: ["card"],
      mode: "payment",
      customer: customerId,
      line_items: productArr,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${process.env.BASE_URL}/checkout?session_id= {CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/checkout`,
      metadata: {
        user_id: postdata.user_id,
        shippingCharges: postdata.shippingCharges,
        paymentData: postdata.paymentData,
        shippingAddress: postdata.shippingAddress,
      },
    };
    let detailsArray = isJSON(postdata.orderArr)
      ? JSON.parse(postdata.orderArr)
      : postdata.orderArr;
    if (detailsArray.length > 0) {
      await detailsArray.map((val, i) => {
        obj.metadata["itemDetail_" + i] = JSON.stringify(val);
      });
    }
    await stripe.checkout.sessions
      .create(obj)
      .then((session) => {
        return ReS(res, "Checkout Session created.", session);
      })
      .catch((err) => ReE(res, err, 400));
  };

  const updateCustomerAddress = async (customer_id) => {
    await stripe.customers
      .update(customer_id, {
        shipping: {
          address: addressObj,
          name: postdata.firstName,
          phone: address.phone_number,
        },
      })
      .then(async (data) => {
        await createCheckoutSession(customer_id);
      });
  };

  const existingCustomer = await StripeCustomers.findOne({
    where: {
      user_id: postdata.user_id,
    },
  });

  if (existingCustomer && existingCustomer.customer_id) {
    await updateCustomerAddress(existingCustomer.customer_id);
  } else {
    await stripe.customers
      .create({
        email: postdata.email,
        name: postdata.firstName,
        metadata: {
          userId: postdata.user_id,
        },
        description: "",
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
              await updateCustomerAddress(customer.id);
            })
            .catch((err) => ReE(res, err, 400));
        } else {
          await StripeCustomers.create({
            user_id: postdata.user_id,
            customer_id: customer.id,
          })
            .then(async (data) => {
              await updateCustomerAddress(data.customer_id);
            })
            .catch((err) => ReE(res, err, 400));
        }
      });
  }
};
