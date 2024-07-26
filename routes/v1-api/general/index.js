let express = require("express");
let router = express.Router();
let general = require("./index.controller");

/**
 * @api {get} /v1/featuredRentals  A. Featured Rentals
 * @apiName Featured Rentals
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to fetch featured rentals.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 
 * @apiSuccessExample Success Response
 * {
        "payload": [
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
                "updatedAt": "2022-06-09T09:44:14.000Z",
                "ProductImages": [
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/image4.png"
                    }
                ]
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
                "updatedAt": "2022-06-09T09:44:14.000Z",
                "ProductImages": [
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/wmR0WS6fbd.png"
                    }
                ]
            },
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
                "updatedAt": "2022-06-09T09:44:14.000Z",
                "ProductImages": []
            },
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
                "updatedAt": "2022-06-15T07:19:26.000Z",
                "ProductImages": [
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/image2.png"
                    },
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/image3.png"
                    },
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/qpHHw88WP7.png"
                    },
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/AoJn5sBxMx.png"
                    },
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/s8MC3r2FM6.png"
                    },
                    {
                        "image_url": "http://localhost:3010/media/thumbnail/tICeNjKwwv.png"
                    }
                ]
            }
        ],
        "success": true,
        "message": "Products fetched successfully!",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Products not fetched.",
    "code": 400
}
 */

router.get("/featuredRentals", general.featuredRentals);

/**
 * @api {get} /v1/testimonials  B. Testimonials
 * @apiName Testimonials
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to fetch the testimonials.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 
 * @apiSuccessExample Success Response
 * {
        "payload": [
            {
                "user_profile_image": "http://localhost:3010/media/thumbnail/image1.png",
                "id": 1,
                "user_name": "Dummy Testimonials",
                "user_location": "usa",
                "review": null,
                "rating": 0,
                "deletedAt": null,
                "createdAt": "2022-06-09T09:44:14.000Z",
                "updatedAt": "2022-06-09T09:44:14.000Z"
            },
            {
                "user_profile_image": "http://localhost:3010/media/thumbnail/image2.png",
                "id": 2,
                "user_name": "Dummy 2",
                "user_location": "california",
                "review": null,
                "rating": 0,
                "deletedAt": null,
                "createdAt": "2022-06-09T09:44:14.000Z",
                "updatedAt": "2022-06-09T09:44:14.000Z"
            },
            {
                "user_profile_image": "http://localhost:3010/media/thumbnail/image3.png",
                "id": 3,
                "user_name": "Dummy 3",
                "user_location": "USA",
                "review": null,
                "rating": 0,
                "deletedAt": null,
                "createdAt": "2022-06-14T09:42:27.000Z",
                "updatedAt": "2022-06-14T09:42:27.000Z"
            },
            {
                "user_profile_image": "http://localhost:3010/media/thumbnail/image4.png",
                "id": 4,
                "user_name": "Dummy 4",
                "user_location": "mississippi",
                "review": null,
                "rating": 0,
                "deletedAt": null,
                "createdAt": "2022-06-14T09:42:27.000Z",
                "updatedAt": "2022-06-14T09:42:27.000Z"
            }
        ],
        "success": true,
        "message": "Testimonials fetched successfully!",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Testimonials not fetched.",
    "code": 400
}
 */

router.get("/testimonials", general.testimonials);

/**
 * @api {get} /v1/allProducts  C. All Products
 * @apiName All Products
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to fetch all products.
 * 
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiParam {String} limit                limit to fetch limited products. 
 * @apiParam {Number} availability_status  products availability status.
 * @apiParam {String} sortBy               field to be sort by.
 * @apiParam {String} sortOrder            sorting order.
 * @apiParam {String} category             category of the product.
 * @apiParam {Number} fromPrice           products price to be start from.
 * @apiParam {Number} toPrice             products price to limit at.
 * @apiParam {Number} zipcode             zipcode to fetch products from particular location.
 * @apiParam {String[]} meta_type             it consist the array of the type that need to be filter.
 * @apiParam {String[]} meta_value            it consist the array of the values to be filter on the basis of meta_type.
 * @apiParam {String} closet               the user closet to be fetched. 
 * 
 
 * @apiSuccessExample Success Response
 * {
        "payload": {
            "data": {
                "count": 12,
                "rows": [
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
                        "updatedAt": "2022-06-09T09:44:14.000Z",
                        "ProductAttributes": [
                            {
                                "meta_type": "Week",
                                "meta_value": "4"
                            },
                            {
                                "meta_type": "Color",
                                "meta_value": "Blue"
                            },
                            {
                                "meta_type": "Brand",
                                "meta_value": "PUMA"
                            },
                            {
                                "meta_type": "Size",
                                "meta_value": "XL"
                            }
                        ],
                        "Location": {
                            "zipcode": "222333"
                        }
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
                        "updatedAt": "2022-06-09T09:44:14.000Z",
                        "ProductAttributes": [],
                        "Location": {
                            "zipcode": "382330"
                        }
                    }
                ]
            }
        },
        "success": true,
        "message": "Products fetched successfully.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch products.",
    "code": 400
}
 */

router.get("/allProducts", general.allProducts);

/**
 * @api {get} /v1/searchProducts  D. Search Products
 * @apiName Search Products
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to make search the products.
 * 
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiParam {String} search               query to make a search.
 * @apiParam {String} limit                limit to fetch limited products. 
 * @apiParam {Number} availability_status  products availability status.
 * @apiParam {String} sortBy               field to be sort by.
 * @apiParam {String} sortOrder            sorting order.
 * @apiParam {String} category             category of the product.
 * @apiParam {Number} fromPrice           products price to be start from.
 * @apiParam {Number} toPrice             products price to limit at.
 * @apiParam {Number} zipcode             zipcode to fetch products from particular location.
 * @apiParam {String[]} meta_type             it consist the array of the type that need to be filter.
 * @apiParam {String[]} meta_value            it consist the array of the values to be filter on the basis of meta_type.
 * @apiParam {String} closet               the user closet to be fetched. 
 * 
 
 * @apiSuccessExample Success Response
 * {
        "payload": {
            "data": {
                "count": 1,
                "rows": [
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
                        "updatedAt": "2022-06-09T09:44:14.000Z",
                        "ProductAttributes": [
                            {
                                "meta_type": "Color",
                                "meta_value": "Green"
                            }
                        ]
                    }
                ]
            }
        },
        "success": true,
        "message": "Products fetched successfully.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch products.",
    "code": 400
}
 */

router.get("/searchProducts", general.searchProducts);

/**
 * @api {get} /v1/productDetails  E. Product Details
 * @apiName Product Details
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to fetch product details.
 * 
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiParam {Number} product_id         products id to fetch the details for.
 * 
 
 * @apiSuccessExample Success Response
 * {
    "payload": {
        "data": {
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
            "updatedAt": "2022-06-15T07:19:26.000Z",
            "ProductAttributes": [
                {
                    "meta_type": "Size",
                    "meta_value": "L"
                },
                {
                    "meta_type": "Brand",
                    "meta_value": "AFRM"
                },
                {
                    "meta_type": "Color",
                    "meta_value": "BLUE"
                },
                {
                    "meta_type": "Week",
                    "meta_value": "4"
                }
            ],
            "Location": {
                "location_name": "dfsd"
            },
            "ProductImages": [
                {
                    "image_url": "http://localhost:3010/media/thumbnail/image2.png"
                },
                {
                    "image_url": "http://localhost:3010/media/thumbnail/image3.png"
                },
                {
                    "image_url": "http://localhost:3010/media/thumbnail/qpHHw88WP7.png"
                },
                {
                    "image_url": "http://localhost:3010/media/thumbnail/AoJn5sBxMx.png"
                },
                {
                    "image_url": "http://localhost:3010/media/thumbnail/s8MC3r2FM6.png"
                },
                {
                    "image_url": "http://localhost:3010/media/thumbnail/tICeNjKwwv.png"
                }
            ]
        }
    },
    "success": true,
    "message": "Product details fetched successfully.",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch product details.",
    "code": 400
}
 */

router.get("/productDetails", general.productDetails);

/**
 * @api {get} /v1/generalAttributes  F. General Attributes
 * @apiName General Attributes
 * @apiGroup General(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to fetch general attributes.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 
 * @apiSuccessExample Success Response
 * {
    "payload": {
        "Size": [
            "XXS",
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "2X",
            "0",
            "2",
            "4",
            "6",
            "8",
            "10",
            "12",
            "14"
        ],
        "Bottom": [
            "23",
            "24",
            "25",
            "26",
            "27",
            "28",
            "29",
            "30",
            "31",
            "32",
            "33",
            "34"
        ],
        "Color": [
            "Black",
            "White",
            "Blue",
            "Pink",
            "Yellow",
            "Green",
            "Red",
            "Orange",
            "Purple",
            "Brown",
            "Multi"
        ],
        "Type": [
            "Tops",
            "Matching Sets",
            "Jackets",
            "Jeans",
            "Dresses",
            "Pants",
            "Bags",
            "Blazers",
            "Jumpsuits & Rompers",
            "Skirts",
            "Accessories",
            "Shoes"
        ],
        "Brand": [
            "AFRM",
            "Aritzia",
            "Bobi",
            "Cleobella",
            "Lionness",
            "Alice & Olivia",
            "ASTR the Label",
            "Cami NYC",
            "Cult Gaia",
            "Lovers + Friends",
            "Amanda Uprichard",
            "Ba&sh",
            "Cia Lucia",
            "Ganni",
            "WeWoreWhat"
        ],
        "Closet": [
            {
                "id": 1,
                "first_name": "test",
                "last_name": "dom"
            },
            {
                "id": 2,
                "first_name": "test 2",
                "last_name": "dom"
            },
            {
                "id": 3,
                "first_name": "test 3",
                "last_name": "dom"
            },
            {
                "id": 4,
                "first_name": "test 4",
                "last_name": "dom"
            }
        ]
    },
    "success": true,
    "message": "GeneralAttributes fetched successfully!",
    "code": 200
}

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to fetch general attributes.",
    "code": 400
}
 */

router.get("/generalAttributes", general.generalAttrributes);

router.get("/localPickUpAvailability", general.localPickUpAvailability);

module.exports = router;
