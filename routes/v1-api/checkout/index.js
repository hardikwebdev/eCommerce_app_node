let express = require('express');
let router = express.Router();
let controller = require("./index.controller");
let AuthMiddleware = require("../../../middlewares/auth").AuthMiddleware;

router.post("/", AuthMiddleware, controller.checkout);

module.exports = router;