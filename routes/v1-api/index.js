let express = require('express');
let router = express.Router();
let authRoute = require("./auth/index");
let generalRoute = require("./general/index.js");
let users = require("./users/index");
let checkout = require("./checkout/index");



router.use("/", generalRoute);

router.use("/auth", authRoute);

router.use("/user", users);

router.use("/checkout", checkout);

module.exports = router;