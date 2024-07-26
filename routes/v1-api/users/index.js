let express = require('express');
let router = express.Router();
let controller = require("./index.controller");
let AuthMiddleware = require("../../../middlewares/auth").AuthMiddleware;
let upload = require("../../../middlewares/image_upload");

/**
 * @api {get} /v1/user/myClothes A. My clothes
 * @apiName My clothes
 * @apiGroup Users(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to get users clothes.
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 

 * @apiSuccessExample Success Response
 *  {
    "payload": {
        "data": [
            {
                "id": 1,
                "user_id": 1,
                "title": "Dummy 1",
                "description": "fsdgdfg",
                "category": "TOP",
                "retail_price": 12,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 1,
                "deletedAt": null,
                "createdAt": "2022-06-10T09:44:14.000Z",
                "updatedAt": "2022-06-15T07:19:26.000Z"
            },
            {
                "id": 2,
                "user_id": 1,
                "title": "Dummy 2",
                "description": "ads",
                "category": "BOTTOM",
                "retail_price": 13,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 5,
                "deletedAt": null,
                "createdAt": "2022-06-09T09:44:14.000Z",
                "updatedAt": "2022-06-09T09:44:14.000Z"
            },
            {
                "id": 15,
                "user_id": 1,
                "title": "Dummy 15",
                "description": "fsdgdfg",
                "category": "BOTTOM",
                "retail_price": 25,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 0,
                "deletedAt": null,
                "createdAt": "2022-06-15T11:04:29.000Z",
                "updatedAt": "2022-06-15T11:04:29.000Z"
            },
            {
                "id": 16,
                "user_id": 1,
                "title": "Dummy 16",
                "description": "fsdgdfg",
                "category": "BOTTOM",
                "retail_price": 25,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 0,
                "deletedAt": null,
                "createdAt": "2022-06-15T11:05:52.000Z",
                "updatedAt": "2022-06-15T11:05:52.000Z"
            },
            {
                "id": 17,
                "user_id": 1,
                "title": "Dummy 17",
                "description": "fsdgdfg",
                "category": "BOTTOM",
                "retail_price": 25,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 0,
                "deletedAt": null,
                "createdAt": "2022-06-15T11:06:24.000Z",
                "updatedAt": "2022-06-15T11:06:24.000Z"
            },
            {
                "id": 18,
                "user_id": 1,
                "title": "Dummy 18",
                "description": "fsdgdfg",
                "category": "BOTTOM",
                "retail_price": 25,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 0,
                "deletedAt": null,
                "createdAt": "2022-06-15T11:22:20.000Z",
                "updatedAt": "2022-06-15T11:22:20.000Z"
            },
            {
                "id": 19,
                "user_id": 1,
                "title": "Dummy 19",
                "description": "fsdgdfg",
                "category": "BOTTOM",
                "retail_price": 25,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 2,
                "rented_count": 0,
                "deletedAt": null,
                "createdAt": "2022-06-15T11:23:53.000Z",
                "updatedAt": "2022-06-15T11:23:53.000Z"
            }
        ]
    },
    "success": true,
    "message": "Users clothes fetched successfully.",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch clothes.",
    "code": 400
}
 */

router.get("/myClothes", AuthMiddleware, controller.myClothes);

/**
 * @api {get} /v1/user/myRentals B. My Rentals
 * @apiName My Rentals
 * @apiGroup Users(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to get users rentals.
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 

 * @apiSuccessExample Success Response
 *  {
    "payload": {
        "result": [
            {
                "id": 3,
                "user_id": 2,
                "title": "Dummy 3",
                "description": "fdsf",
                "category": "TOP",
                "retail_price": 14,
                "availability_status": 0,
                "shipping_type": 1,
                "location_id": 3,
                "rented_count": 2,
                "deletedAt": null,
                "createdAt": "2022-06-09T09:44:14.000Z",
                "updatedAt": "2022-06-09T09:44:14.000Z"
            },
            {
                "id": 4,
                "user_id": 3,
                "title": "Dummy 4",
                "description": "dfsdf",
                "category": "BOTTOM",
                "retail_price": 15,
                "availability_status": 1,
                "shipping_type": 1,
                "location_id": 1,
                "rented_count": 3,
                "deletedAt": null,
                "createdAt": "2022-06-09T09:44:14.000Z",
                "updatedAt": "2022-06-09T09:44:14.000Z"
            }
        ]
    },
    "success": true,
    "message": "Users rentals fetched successfully.",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch rentals.",
    "code": 400
}
 */

router.get("/myRentals", AuthMiddleware, controller.myRentals);

/**
 * @api {post} /v1/user/addProduct  C. Add Product
 * @apiName Add Product
 * @apiGroup Users(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to add the product.
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 
 *
 * @apiBody {Number} user_id               User id.
 * @apiBody {String} title                 Title for the product.
 * @apiBody {String} description           Description for the product.
 * @apiBody {String} category              Category of the product.
 * @apiBody {Number} retail_price          Retail price of the product.
 * @apiBody {Number} availability_status   Availability status of the product.
 * @apiBody {Number} shipping_type         Shipping type.
 * @apiBody {Number} location_id           Location id.
 * @apiBody {String} size                  Size of the product.
 * @apiBody {String} color                 Color of the product.
 * @apiBody {String} brand                 Brand of the product.
 * @apiBody {Number} week                  Rental period.
 * @apiBody {String[]} files              Array of the images to be add.
 * 
 
 * @apiSuccessExample Success Response
 * {
    "payload": {
        "data": {
            "deletedAt": null,
            "id": 20,
            "user_id": "1",
            "title": "Dummy 20",
            "description": "fsdgdfg",
            "category": "BOTTOM",
            "retail_price": "25",
            "availability_status": "1",
            "shipping_type": "1",
            "location_id": "2",
            "updatedAt": "2022-06-17T06:44:13.662Z",
            "createdAt": "2022-06-17T06:44:13.662Z"
        }
    },
    "success": true,
    "message": "Product added successfully",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Enter your shipping address",
    "code": 400
}
 */

router.post("/addProduct", AuthMiddleware, controller.addProduct);

router.post("/addProductImage", AuthMiddleware, controller.addProductImage);

/**
 * @api {post} /v1/user/deleteProduct  E. Delete Product
 * @apiName Delete Product
 * @apiGroup Users(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to delete the product.
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 
 * 
 * @apiParam {Number} product_id           Id of the product to deleted.
 * 
 
 * @apiSuccessExample Success Response
 * {
    "success": true,
    "message": "Product deleted ",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Product id required",
    "code": 400
}
 */

router.post("/deleteProduct", AuthMiddleware, controller.deleteProduct);

/**
 * @api {get} /v1/user/userProfile  F. User Profile
 * @apiName User Profile
 * @apiGroup Users(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to get the user profile.
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 
 * 
 * @apiParam {Number} user_id           Id of the user to fetch details.
 * 
 
 * @apiSuccessExample Success Response
 * {
    "payload": {
        "data": {
            "id": 1,
            "first_name": "test",
            "last_name": "dom",
            "email": "test@gmail.com",
            "password": "$2a$10$MJqELY4TIib7wv.B4zW.juomyCsEVoGhyA2smHT2gHpSXZ4d1eQHe",
            "phone_number": null,
            "customer_id": null,
            "profile_url": null,
            "status": 1,
            "on_vacation": 0,
            "reset_token": "",
            "verification_token": "",
            "deletedAt": null,
            "createdAt": "2022-06-09T09:44:14.000Z",
            "updatedAt": "2022-06-10T07:15:32.000Z",
            "UserAddresses": [
                {
                    "id": 1,
                    "user_id": 1,
                    "name": "Dummy",
                    "address": "ADSAJKH",
                    "zip_code": "382330",
                    "phone_number": "556452121",
                    "type": 0,
                    "deletedAt": null,
                    "createdAt": "2022-06-15T11:16:53.000Z",
                    "updatedAt": "2022-06-15T11:16:53.000Z"
                }
            ]
        }
    },
    "success": true,
    "message": "Users data fetched successfully",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "User id required",
    "code": 400
}
 */

router.post("/addAddress", AuthMiddleware, controller.addAddress);

router.post("/addToCart", AuthMiddleware, controller.addToCart);

router.post("/removeFromCart", AuthMiddleware, controller.removeFromCart);

router.get("/cartDetails", AuthMiddleware, controller.cartDetails);

router.post("/order", AuthMiddleware, controller.order);

router.get("/orderDetails", AuthMiddleware, controller.orderDetails);

router.post("/markShipped", AuthMiddleware, controller.markShipped);

router.post("/addReview", AuthMiddleware, controller.addReview);

router.get("/getReviews", AuthMiddleware, controller.getReviews);

router.get("/orderHistory", AuthMiddleware, controller.orderHistory);

router.post("/addCard", AuthMiddleware, controller.addCard);

router.get("/getCards", AuthMiddleware, controller.getCardDetails);

router.post("/sendSizeRequest", AuthMiddleware, controller.sendSizeRequest);

router.post("/updateProductStatus", AuthMiddleware, controller.updateProductStatus);

router.post("/addBlackOutDates", AuthMiddleware, controller.addBlackOutDates);

router.post("/cashOut", AuthMiddleware, controller.cashOut);

router.post("/addBankAccount", AuthMiddleware, controller.addBankAccount);

module.exports = router;