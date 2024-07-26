const axios = require("axios");
const _ = require("underscore");

module.exports.getShipstationCarriers = async () => {
  let data = await axios
    .get(process.env.GET_SHIPSTATION_CARRIERS, {
      headers: {
        Authorization: process.env.SHIPSTATION_AUTHORIZATION_KEY,
        Host: process.env.SHIPSTATION_HOST,
      },
    })
    .then((response) => {
      let data = { ...response.data };
      let id = _.filter(data, function (o) {
        return o.code.includes("ups") || o.code.includes("fedex");
      });
      let tempObj = {
        status: 200,
        data: {
          carrierCode: "",
        },
      };
      if (id.length > 0) {
        let carrierCode = _.pluck(id, "code");
        tempObj = {
          status: 200,
          data: {
            carrierCode,
          },
        };
      }
      return tempObj;
    })
    .catch((err) => {
      let errObj = {
        status: 400,
        data: {
          err,
        },
      };
      return errObj;
    });
  return data;
};

module.exports.getShipstationRates = async (
  dataObj,
  rateLimit,
  carrierArray
) => {
  let ratesArray = [];
  let promiseArray = [];

  const getRatesFunc = async (obj) => {
    await axios
      .post(process.env.GET_SHIPSTATION_RATES, obj, {
        headers: {
          Authorization: process.env.SHIPSTATION_AUTHORIZATION_KEY,
          Host: process.env.SHIPSTATION_HOST,
          "Content-Type": "application/json",
        },
      })
      .then((result) => {
        let tempArr = [...ratesArray, ...result.data];
        ratesArray = [...tempArr];
        return;
      })
      .catch((err) => {
        console.log("ERROR IN GETTING RATES API : ", err);
        return err;
      });
  };

  for (let i = 0; i < carrierArray.length; i++) {
    let tempObj = { ...dataObj };
    tempObj.carrierCode = carrierArray[i];
    promiseArray.push(await getRatesFunc(tempObj));
  }

  let data = await Promise.all(promiseArray)
    .then(() => {
      let lessCost = ratesArray.reduce(function (prev, curr) {
        return prev.shipmentCost < curr.shipmentCost &&
          (rateLimit
            ? prev.shipmentCost >= 10 && prev.shipmentCost <= 15
            : true)
          ? prev
          : curr;
      });

      let tempObj = {
        status: 200,
        data: {
          lessCost,
        },
      };
      return tempObj;
    })
    .catch((err) => {
      let errObj = {
        status: 400,
        data: {
          err,
        },
      };
      return errObj;
    });

  return data;
};

module.exports.createShipstationOrder = async (createOrderData) => {
  let data = await axios
    .post("https://ssapi.shipstation.com/orders/createorder", createOrderData, {
      headers: {
        Authorization: process.env.SHIPSTATION_AUTHORIZATION_KEY,
        Host: process.env.SHIPSTATION_HOST,
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      let tempObj = {
        status: 200,
        data: {
          orderData: result.data,
        },
      };
      return tempObj;
    })
    .catch((err) => {
      let errObj = {
        status: 400,
        data: {
          err,
        },
      };
      return errObj;
    });
  return data;
};

module.exports.createShipstationShippingLabel = async (labelData) => {
  let data = await axios
    .post(process.env.CREATE_SHIPSTATION_SHIPPING_LABEL, labelData, {
      headers: {
        Authorization: process.env.SHIPSTATION_AUTHORIZATION_KEY,
        Host: process.env.SHIPSTATION_HOST,
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      let tempObj = {
        status: 200,
        data: {
          generatedLabel: result.data,
        },
      };
      return tempObj;
    })
    .catch((err) => {
      let errObj = {
        status: 400,
        data: {
          err,
        },
      };
      return errObj;
    });
  return data;
};
