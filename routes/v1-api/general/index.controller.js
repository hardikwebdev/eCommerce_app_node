const Sequelize = require("sequelize");
const { where } = require("underscore");
const Op = Sequelize.Op;
const Products = require("../../../models").Products;
const ProductAttributes = require("../../../models").ProductAttributes;
const Testimonials = require("../../../models").Testimonials;
const GeneralAttributes = require("../../../models").GeneralAttributes;
const Users = require("../../../models").Users;
const Locations = require("../../../models").Locations;
const ProductImages = require("../../../models").ProductImages;
const BlackoutDates = require("../../../models").BlackoutDates;
const OrderDetails = require("../../../models").OrderDetails;
const Orders = require("../../../models").Orders;
let _ = require("underscore");
const zipcodes = require("zipcodes");
const moment = require("moment");

module.exports.featuredRentals = async (req, res) => {
  await Products.findAll({
    limit: 4,
    order: [["rented_count", "DESC"]],
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
      return ReS(res, "Products fetched successfully!", {
        payload: data,
      });
    })
    .catch((err) => {
      return ReE(res, "Products not fetched.", 400);
    });
};

module.exports.testimonials = async (req, res) => {
  await Testimonials.findAll({})
    .then(async (data) => {
      return ReS(res, "Testimonials fetched successfully!", {
        payload: data,
      });
    })
    .catch((err) => {
      return ReE(res, "Testimonials not fetched.", 400);
    });
};

module.exports.allProducts = async function (req, res, next) {
  let query = req.query;
  query.sortBy = parseInt(query.sortBy);
  let sortBy;

  if (query.sortBy === 3) {
    sortBy = "createdAt";
  } else if (query.sortBy === 1 || query.sortBy === 2) {
    sortBy = "retail_price";
  } else {
    sortBy = "rented_count";
  }
  let sortOrder = "DESC";

  if (query.sortBy) {
    if (query.sortBy === 0 || query.sortBy === 2 || query.sortBy === 3) {
      sortOrder = "DESC";
    } else if (query.sortBy === 1) {
      sortOrder = "ASC";
    }
  }

  let limit = 8;
  let offset = 0;
  let require = false;

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

  let wheres = {};
  let wherein = {};
  let whereinl = {};
  let whereO = {};
  let whereA = {};

  if (query.availability_status) {
    if (query.availability_status != 2) {
      wheres.availability_status = query.availability_status;
    } else if (query.availability_status == 2) {
      let dateRange = query.date_range
        ? isJSON(query.date_range)
          ? JSON.parse(query.date_range)
          : query.date_range
        : {};
      if (dateRange?.startDate && dateRange?.endDate) {
        let startDate = new Date(
          moment(new Date(dateRange.startDate)).subtract(7, "days")
        );
        let endDate = new Date(
          moment(new Date(dateRange.endDate)).add(7, "days")
        );
        let blackOutStartDate = new Date(dateRange.startDate);
        let blackOutEndDate = new Date(dateRange.endDate);

        let productIdArr = [];

        whereO[Op.not] = {
          [Op.or]: [
            {
              [Op.and]: [
                { start_date: { [Op.lt]: startDate } },
                { start_date: { [Op.lt]: endDate } },
                { end_date: { [Op.lt]: startDate } },
                { end_date: { [Op.lt]: endDate } },
              ],
            },
            {
              [Op.and]: [
                { start_date: { [Op.gt]: startDate } },
                { start_date: { [Op.gt]: endDate } },
                { end_date: { [Op.gt]: startDate } },
                { end_date: { [Op.gt]: endDate } },
              ],
            },
          ],
        };

        whereA[Op.not] = {
          [Op.or]: [
            {
              [Op.and]: [
                { start_date: { [Op.lt]: blackOutStartDate } },
                { start_date: { [Op.lt]: blackOutEndDate } },
                { end_date: { [Op.lt]: blackOutStartDate } },
                { end_date: { [Op.lt]: blackOutEndDate } },
              ],
            },
            {
              [Op.and]: [
                { start_date: { [Op.gt]: blackOutStartDate } },
                { start_date: { [Op.gt]: blackOutEndDate } },
                { end_date: { [Op.gt]: blackOutStartDate } },
                { end_date: { [Op.gt]: blackOutEndDate } },
              ],
            },
          ],
        };

        await Products.findAll({
          where: wheres,
          distinct: true,
          attributes: ["id"],
          include: [
            {
              model: OrderDetails,
              required: true,
              where: whereO,
              attributes: [],
            },
          ],
        }).then((result) => {
          let id = _.pluck(result, "id");
          productIdArr = [...productIdArr, ...id];
        });

        await Products.findAll({
          where: wheres,
          distinct: true,
          attributes: ["id"],
          include: [
            {
              model: Users,
              attributes: [],
              required: true,
              include: [
                {
                  model: BlackoutDates,
                  required: true,
                  where: whereA,
                  attributes: [],
                },
              ],
            },
          ],
        }).then((result) => {
          let id = _.pluck(result, "id");
          productIdArr = [...productIdArr, ...id];
        });

        wheres.id = { [Op.not]: productIdArr };
      }
    }
  } else {
    wheres.availability_status = { [Op.not]: 0 };
  }

  if (query.category) {
    let category = isJSON(query.category)
      ? JSON.parse(query.category)
      : query.category;
    if (category.length > 0) {
      wheres.category = { [Op.in]: category };
    }
  }

  if (query.price) {
    let priceD = isJSON(query.price) ? JSON.parse(query.price) : query.price;
    if (priceD.length > 0) {
      let tempArr = [];
      await priceD.map((val) => {
        let obj = {};
        obj[Op.between] = [val.fromPrice, val.toPrice];
        tempArr.push(obj);
      });
      wheres.two_weeks = { [Op.or]: tempArr };
    }
  }

  let location = isJSON(query.zipcode)
    ? JSON.parse(query.zipcode)
    : query.zipcode;
  if (location.zip_code && location.selected_mile) {
    let zipCodeArr = zipcodes.radius(location.zip_code, location.selected_mile);
    wheres.location_id = { [Op.in]: zipCodeArr };
  }
  if (query.closet) {
    let closet = isJSON(query.closet) ? JSON.parse(query.closet) : query.closet;
    wheres.user_id = { [Op.in]: closet };
  }

  if (query.occasion) {
    let occasion = isJSON(query.occasion)
      ? JSON.parse(query.occasion)
      : query.occasion;
    wheres.occasion = occasion;
  }

  if (query.meta_type && query.meta_value) {
    let meta_type = isJSON(query.meta_type)
      ? _.uniq(JSON.parse(query.meta_type))
      : query.meta_type;
    let meta_value = isJSON(query.meta_value)
      ? _.uniq(JSON.parse(query.meta_value))
      : query.meta_value;
    require = true;
    wherein[Op.and] = [
      { meta_type: { [Op.in]: meta_type } },
      { meta_value: { [Op.in]: meta_value } },
    ];
  }
  let order = [[sortBy, sortOrder]];
  if (sortBy === "rented_count") {
    order = [
      ["rented_count", sortOrder],
      ["title", "ASC"],
    ];
  }

  await Products.findAll({
    where: wheres,
    offset: offset,
    limit: limit,
    order: order,
    distinct: true,
    include: [
      {
        model: ProductAttributes,
        required: require,
        where: wherein,
        attributes: ["meta_type", "meta_value"],
      },
      {
        model: ProductImages,
        attributes: ["image_url"],
      },
    ],
  })
    .then(async (data) => {
      let productCount = await Products.count({
        where: wheres,
        distinct: true,
        include: [
          {
            model: ProductAttributes,
            required: require,
            where: wherein,
          },
          {
            model: ProductImages,
          },
        ],
      });
      console.log("PRODUCt Count : ", productCount);
      return ReS(res, "Products fetched successfully.", {
        payload: {
          data: {
            count: productCount,
            rows: data,
          },
        },
      });
    })
    .catch((err) => {
      console.log("ERRROR : ", err);
      return ReE(res, "Failed to fetch products.", 400);
    });
};

module.exports.searchProducts = async function (req, res, next) {
  let query = req.query;
  query.sortBy = parseInt(query.sortBy);
  let sortBy = query.sortBy
    ? query.sortBy === 3
      ? "createdAt"
      : query.sortBy === 1 || query.sortBy === 2
      ? "retail_price"
      : "rented_count"
    : "rented_count";
  let sortOrder = query.sortBy
    ? query.sortBy === 2
      ? "DESC"
      : query.sortBy === 0 || query.sortBy === 3
      ? "DESC"
      : "ASC"
    : "DESC";

  let limit = 8;
  let offset = 0;
  let require = false;
  let locationRequire = false;
  let orderDetailRequire = false;

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

  let wheres = {};
  let wherein = {};
  let whereinl = {};
  let whereO = {};
  let whereA = {};

  if (query.availability_status) {
    if (query.availability_status != 2) {
      wheres.availability_status = query.availability_status;
    } else if (query.availability_status == 2) {
      let dateRange = query.date_range
        ? isJSON(query.date_range)
          ? JSON.parse(query.date_range)
          : query.date_range
        : {};
      if (dateRange?.startDate && dateRange?.endDate) {
        let startDate = new Date(
          moment(new Date(dateRange.startDate)).subtract(7, "days")
        );
        let endDate = new Date(
          moment(new Date(dateRange.endDate)).add(7, "days")
        );
        let blackOutStartDate = new Date(dateRange.startDate);
        let blackOutEndDate = new Date(dateRange.endDate);

        let productIdArr = [];

        whereO[Op.not] = {
          [Op.or]: [
            {
              [Op.and]: [
                { start_date: { [Op.lt]: startDate } },
                { start_date: { [Op.lt]: endDate } },
                { end_date: { [Op.lt]: startDate } },
                { end_date: { [Op.lt]: endDate } },
              ],
            },
            {
              [Op.and]: [
                { start_date: { [Op.gt]: startDate } },
                { start_date: { [Op.gt]: endDate } },
                { end_date: { [Op.gt]: startDate } },
                { end_date: { [Op.gt]: endDate } },
              ],
            },
          ],
        };

        whereA[Op.not] = {
          [Op.or]: [
            {
              [Op.and]: [
                { start_date: { [Op.lt]: blackOutStartDate } },
                { start_date: { [Op.lt]: blackOutEndDate } },
                { end_date: { [Op.lt]: blackOutStartDate } },
                { end_date: { [Op.lt]: blackOutEndDate } },
              ],
            },
            {
              [Op.and]: [
                { start_date: { [Op.gt]: blackOutStartDate } },
                { start_date: { [Op.gt]: blackOutEndDate } },
                { end_date: { [Op.gt]: blackOutStartDate } },
                { end_date: { [Op.gt]: blackOutEndDate } },
              ],
            },
          ],
        };

        await Products.findAll({
          where: wheres,
          distinct: true,
          attributes: ["id"],
          include: [
            {
              model: OrderDetails,
              required: true,
              where: whereO,
              attributes: [],
            },
          ],
        }).then((result) => {
          let id = _.pluck(result, "id");
          productIdArr = [...productIdArr, ...id];
        });

        await Products.findAll({
          where: wheres,
          distinct: true,
          attributes: ["id"],
          include: [
            {
              model: Users,
              attributes: [],
              required: true,
              include: [
                {
                  model: BlackoutDates,
                  required: true,
                  where: whereA,
                  attributes: [],
                },
              ],
            },
          ],
        }).then((result) => {
          let id = _.pluck(result, "id");
          productIdArr = [...productIdArr, ...id];
        });

        wheres.id = { [Op.not]: productIdArr };
      }
    }
  } else {
    wheres.availability_status = { [Op.not]: 0 };
  }

  if (query.category) {
    let category = isJSON(query.category)
      ? JSON.parse(query.category)
      : query.category;
    if (category.length > 0) {
      wheres.category = { [Op.in]: category };
    }
  }

  if (query.localPickUp && query.localPickUp != "") {
    let zipArr = [];
    await GeneralAttributes.findOne({
      where: {
        meta_type: query.localPickUp,
      },
    }).then((val) => {
      if (val) {
        zipArr = isJSON(val.dataValues.meta_value)
          ? JSON.parse(val.dataValues.meta_value)
          : val.dataValues.meta_value;
      }
    });
    if (zipArr.length > 0) {
      wheres.location_id = { [Op.in]: zipArr };
    }
  }

  if (query.price) {
    let priceD = isJSON(query.price) ? JSON.parse(query.price) : query.price;
    if (priceD.length > 0) {
      let tempArr = [];
      await priceD.map((val) => {
        let obj = {};
        obj[Op.between] = [val.fromPrice, val.toPrice];
        tempArr.push(obj);
      });
      wheres.two_weeks = { [Op.or]: tempArr };
    }
  }

  let location = isJSON(query.zipcode)
    ? JSON.parse(query.zipcode)
    : query.zipcode;
  if (location.zip_code && location.selected_mile) {
    let zipCodeArr = zipcodes.radius(location.zip_code, location.selected_mile);
    wheres.location_id = { [Op.in]: zipCodeArr };
  }

  if (query.closet) {
    let closet = isJSON(query.closet) ? JSON.parse(query.closet) : query.closet;
    wheres.user_id = { [Op.in]: closet };
  }
  if (query.occasionsFilter) {
    console.log("Query occasionsFilter : ");
    let occasion = isJSON(query.occasionsFilter)
      ? JSON.parse(query.occasionsFilter)
      : query.occasionsFilter;
    console.log("QUERY OCCASION 2: ", occasion.length, occasion);
    if (occasion.length > 0) {
      wheres.occasion = occasion;
    }
  }

  if (query.meta_type && query.meta_value) {
    let meta_type = isJSON(query.meta_type)
      ? _.uniq(JSON.parse(query.meta_type))
      : query.meta_type;
    let meta_value = isJSON(query.meta_value)
      ? _.uniq(JSON.parse(query.meta_value))
      : query.meta_value;
    require = true;
    wherein[Op.and] = [
      { meta_type: { [Op.in]: meta_type } },
      { meta_value: { [Op.in]: meta_value } },
    ];
  }

  if (query.search && !query.localPickUp && query.localPickUp == "") {
    let searchData = decodeURIComponent(query.search);
    wheres[Op.or] = [
      { title: searchData },
      { category: searchData },
      { occasion: searchData },
      { "$ProductAttributes.meta_value$": searchData },
      { "$User.first_name$": searchData },
    ];
  }
  console.log("Query : ", wheres);

  await Products.findAndCountAll({
    where: wheres,
    offset: offset,
    distinct: true,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: ProductAttributes,
        required: require,
        where: wherein,
        attributes: ["meta_type", "meta_value"],
      },
      {
        model: ProductImages,
        attributes: ["image_url"],
      },
      {
        model: Users,
        attributes: [],
      },
    ],
  })
    .then(async (data) => {
      return ReS(res, "Products fetched successfully.", {
        payload: {
          data: {
            count: data.count,
            rows: data.rows,
          },
        },
      });
    })
    .catch((err) => {
      console.log("ERROR : ", err);
      return ReE(res, "Failed to fetch products.", 400);
    });
};

module.exports.productDetails = async (req, res) => {
  let id = req.query.product_id;
  await Products.findOne({
    where: { id },
    include: [
      {
        model: ProductAttributes,
        attributes: ["meta_type", "meta_value"],
      },
      {
        model: ProductImages,
        attributes: ["image_url", "index"],
      },
      {
        model: Users,
        attributes: ["first_name", "last_name"],
        include: [
          {
            model: BlackoutDates,
            attributes: ["start_date", "end_date"],
          },
        ],
      },
    ],
  })
    .then(async (data) => {
      let rentalDates = [];
      await OrderDetails.findAll({
        where: {
          shipping_status: { [Op.not]: 1 },
          product_id: id,
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
      return ReS(res, "Product details fetched successfully.", {
        payload: {
          data,
          rentalDates,
        },
      });
    })
    .catch((err) => {
      return ReE(res, "Failed to fetch product details.", 400);
    });
};

module.exports.generalAttrributes = async (req, res) => {
  await GeneralAttributes.findAll({})
    .then(async (data) => {
      let size = [];
      let bottom = [];
      let color = [];
      let type = [];
      let brand = [];
      let occasion = [];
      if (data) {
        await data.map((val) => {
          switch (val.dataValues.meta_type) {
            case "Size":
              return size.push(val.dataValues.meta_value);

            case "Bottom":
              return bottom.push(val.dataValues.meta_value);

            case "Color":
              return color.push(val.dataValues.meta_value);

            case "Type": {
              val.dataValues.meta_value = isJSON(val.dataValues.meta_value)
                ? JSON.parse(val.dataValues.meta_value)
                : val.dataValues.meta_value;

              type.push(val.dataValues.meta_value);
              break;
            }

            case "Brand":
              return brand.push(val.dataValues.meta_value);

            case "Occasion":
              return occasion.push(val.dataValues.meta_value);

            default:
              break;
          }
        });
      }
      let closet = await Users.findAll({
        attributes: ["id", "first_name", "last_name"],
        include: [
          {
            model: Products,
            required: true,
            attributes: [],
          },
        ],
      });
      return ReS(res, "GeneralAttributes fetched successfully!", {
        payload: {
          size,
          bottom,
          color,
          type,
          brand,
          closet,
          occasion,
        },
      });
    })
    .catch((err) => {
      return ReE(res, "Failed to fetch general attributes.", 400);
    });
};

module.exports.localPickUpAvailability = async (req, res) => {
  let query = req.query;
  let zipArr =
    query.zipArr && (await isJSON(query.zipArr))
      ? JSON.parse(query.zipArr)
      : query.zipArr;
  let location =
    query.zipcode && (await isJSON(query.zipcode))
      ? JSON.parse(query.zipcode)
      : query.zipcode;

  if (location.zip_code && location.selected_mile && zipArr.length > 0) {
    let notAvailable = [];
    let zipCodeArr = zipcodes.radius(location.zip_code, location.selected_mile);
    await zipArr.map((val) => {
      if (!zipCodeArr.includes(val.toString())) {
        notAvailable.push(val);
      }
    });
    return ReS(res, "Localpickup availability successfully!", notAvailable);
  } else {
    return ReE(res, "Please provide a proper data.", 400);
  }
};
