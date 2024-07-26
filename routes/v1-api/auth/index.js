let express = require("express");
let router = express.Router();
let controller = require("./index.controller");
let AuthMiddleware = require("../../../middlewares/auth").AuthMiddleware;

/**
 * @api {post} /v1/auth/registration  A. Registration
 * @apiName Registration
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to register user in the system.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiBody {String} email         User's email.
 * @apiBody {String} password      User's password.
 * @apiBody {String} first_name    User's first name.
 * @apiBody {String} last_name     User's last name.
 * 
 * @apiParamExample {json} Request Example
 * {
        "email": "test@gmail.com",
        "password": "password",
        "first_name": "Test",
        "last_name": "User"
   }
 
 * @apiSuccessExample Success Response
 * {
        "data": {
            "payload": {
                "deletedAt": null,
                "id": 4,
                "email": "test@gmail.com",
                "password": "$2a$10$qVRKXk/RFlCWThqsmhmxMu0t0yhNoSQqRFNMP5eBcDe9/40oBAh9q",
                "first_name": "Test",
                "last_name": "User",
                "verification_token": "$2a$15$Kl4M8uhfmNxGxwiYd/kmOe8C3J5o5BcCU.FghfoQbRg137rvM1v46",
                "updatedAt": "2022-06-10T05:46:54.077Z",
                "createdAt": "2022-06-10T05:46:54.077Z",
                "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNjU0ODQwMDE0LCJleHAiOjE2NTQ4OTAwMTR9.1Bxh9jFBvcjV9pZOug6T1bMlLDk38wvaCBRwTebGddw"
            },
            "verification_token": "$2a$15$Kl4M8uhfmNxGxwiYd/kmOe8C3J5o5BcCU.FghfoQbRg137rvM1v46"
        },
        "success": true,
        "message": "User registered successfully.  Please check your mail for verification.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "An account already exists with the same email address!",
    "code": 400
}
 */

router.post("/registration", controller.registration);

/**
 * @api {post} /v1/auth/login  B. Login
 * @apiName Login
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to login user in the system.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiBody {String} email         User's email.
 * @apiBody {String} password      User's password.
 * 
 * @apiParamExample {json} Request Example
 * {
        "email": "test@gmail.com",
        "password": "password"
   }
 
 * @apiSuccessExample Success Response
 * {
        "payload": {
            "id": 1,
            "first_name": "Test",
            "last_name": "User",
            "email": "test@gmail.com",
            "password": "$2a$10$g5qaS8eNam7eTeNXKuawU.QeCPd9fE7dJxN48vVyHj7y2BffKsz46",
            "phone_number": null,
            "customer_id": null,
            "profile_url": null,
            "status": 1,
            "on_vacation": 0,
            "reset_token": "$2a$15$gA99jztYqgQJ3xwQlaSaRO07x0NMTO/NYdZS2f7msJqZ71xpXcz7S",
            "verification_token": null,
            "deletedAt": null,
            "createdAt": "2022-06-09T09:44:14.000Z",
            "updatedAt": "2022-06-10T05:43:35.000Z",
            "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjU0ODQxNzYwLCJleHAiOjE2NTQ4OTE3NjB9.CPqNRlbzm5qrbvKZ_gW3_DdpQzIEkN2qu8F1zIYH41k"
        },
        "success": true,
        "message": "",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Incorrect password.",
    "code": 500
}
 */

router.post("/login", controller.login);

/**
 * @api {post} /v1/auth/forgotPassword  C. Forgot Password
 * @apiName Forgot Password
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to get password reset link in email if user forgot password.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiBody {String} email         User's email.
 * 
 * @apiParamExample {json} Request Example
 * {
        "email": "test@gmail.com"
   }
 
 * @apiSuccessExample Success Response
 * {
        "data": {
            "email": "test@gmail.com",
            "token": "$2a$15$YRpfEZkl17y/8WfDF2iGlOPS0qK6/Ks6gvTUXHIkI5YkpCAZUUQYi"
        },
        "success": true,
        "message": "A reset password email was sent!  Please check your email to continue.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "There is no user with this email address, please try another.",
    "code": 400
}
 */

router.post("/forgotPassword", controller.forgotPassword);

/**
 * @api {post} /v1/auth/changePassword  D. Change Password
 * @apiName Change Password
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to change password from reset password link.
 * 
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiBody {String} email     User's email.
 * @apiBody {String} token     Reset token.
 * @apiBody {String} password  New password
  
 * @apiParamExample {json} Request Example
 * {
        "email": "test@gmail.com",
        "token": "$2a$15$B7zkXq3fp0eF0IaA6EJgLedlPZ69O6kYOfkPP5NPJk5MB8qTCWszW",
        "password": "password"
   }
 
 * @apiSuccessExample Success Response
 * {
        "success": true,
        "message": "Password updated successfully!",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "Failed to update password!",
    "code": 400
}
 */

router.post("/changePassword", controller.changePassword);

/**
 * @api {get} /v1/auth/userActivation E. User Activation
 * @apiName User Activation
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 * 
 * @apiDescription This API is used to activate User account
 *
 * @apiHeader {String} Content-Type application/json
 
 * @apiParam {String} email                email of the user for activation 
 * @apiParam {String} verification_token   verifcation token to verify user.

 * @apiSuccessExample Success Response
 *  {
        "success": true,
        "message": "User activated successfully.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "User not found",
    "code": 500
}
 */

router.get("/userActivation", controller.userActivation);

/**
 * @api {post} /v1/auth/resendVerification F. Resend Verification
 * @apiName Resend Verification
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiDescription This API is used to resend verification link
 
 * @apiBody {String} email  email of the user to resend verification link. 

 * @apiSuccessExample Success Response
 *  {
        "data": {
            "payload": "test@gmail.com",
            "verification_token": "$2a$15$ppSDQSNVfW1rTO0GhpMHx.rvXJcKzEIGf20s/5y.7Jwx68rayTmRu"
        },
        "success": true,
        "message": "Resend verification successful.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "User not found",
    "code": 500
}
 */

router.post("/resendVerification", controller.resendVerification);

/**
 * @api {get} /v1/auth/logout G. Logout
 * @apiName Logout
 * @apiGroup Auth(v1-api)
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiDescription This API is used to logout the user.
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json 

 * @apiSuccessExample Success Response
 *  {
        "success": true,
        "message": "Logged out successfully.",
        "code": 200
    }

 * @apiErrorExample Error Response
{
    "success": false,
    "message": "No logged in user found.",
    "code": 400
}
 */

router.get("/logout", AuthMiddleware, controller.logout);

module.exports = router;
