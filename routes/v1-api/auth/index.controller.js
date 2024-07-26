let Sequelize = require("sequelize");
let bcrypt = require("bcryptjs");
let Users = require("../../../models").Users;
let UserAddresses = require("../../../models").UserAddresses;
const transporter = require("../../../config/nodemailer").transporter;
const axios = require('axios');
let Products = require("../../../models").Products;
let ProductImages = require("../../../models").ProductImages;

const sendMail = async (mailOptions, callback) => {
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

module.exports.registration = async function (req, res, next) {
    let postdata = req.body;
    req.checkBody({
        'email': {
            notEmpty: true,
            isEmail: true,
            errorMessage: 'Email is required'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Password is required',
            isLength: {
                options: { min: 8},
                errorMessage: 'Password must be at least 8 characters long'
            }
        },
        'first_name': {
            notEmpty: true,
            errorMessage: 'First Name is required'
        },
        'last_name': {
            notEmpty: true,
            errorMessage: 'Last Name is required'
        },
        'captcha_token': {
            notEmpty: true,
            errorMessage: 'CAPTCHA is required'
        },
    });

    let errors = req.validationErrors();

    if (errors) {
        return ReE(res, errors[0].msg, 400);
    }

    const googleVerifyUrl = `${process.env.googleVerifyUrl}?secret=${process.env.SECRETKEY}&response=${req.body.captcha_token}`;
    const response = await axios.post(googleVerifyUrl);
    const { success } = response.data;
    if (success) {
        let userExist = await Users.findOne({
            where: { email: postdata.email }
        }).catch(err => { return ReE(res, err, 400) });


        if (!userExist) {

            postdata.password = bcrypt.hashSync(postdata.password, 10);
            let verification_token = bcrypt.hashSync(postdata.email + postdata.first_name + CONFIG.jwt_encryption_admin, 15);
            postdata.verification_token = verification_token;
            await Users.create(postdata).then(async user => {
                if (user) {
                    let token = user.getJWT();
                    req.session.sessionexpiretime = CONFIG.jwt_expiration;
                    user.dataValues.token = token;
                    req.session.user = user.dataValues;

                    let url = CONFIG.BASE_URL + '/account/account-verification';

                    let mailOptions = {
                        from: CONFIG.welcomeemail,
                        to: user.email,
                        template: 'add-user',
                        subject: "Verify your new account on E-Commerce",
                        context: {
                            fullName: user.first_name,
                            redirectUrl: url + '?email=' + user.email + "&verification_token=" + verification_token,
                            mailTo: CONFIG.welcomeemail,
                            storeUrl: CONFIG.BASE_URL,
                            // filePath: CONFIG.IMAGE_URL,
                            ecommerceLogo: CONFIG.ecommerce_LOGO,
                        }
                    };
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (!error) {
                            return ReS(res, "User registered successfully.  Please check your mail for verification.", {
                                data: {
                                    payload: user,
                                    verification_token
                                }
                            });
                        } else {
                            return ReE(res, "Failed to send email!", 400);
                        }
                    });

                } else {
                    return ReE(res, "Failed to register user!", 400);
                }

            }).catch(err => {
                return ReE(res, err, 400)
            });

        } else {
            if (userExist.status != 1 && userExist.verification_token) {
                return ReE(res, `Your account verification is pending.  Check your email at ${userExist.email}`, 400, {
                    payload: {
                        email: userExist.email,
                        isVerified: false
                    }
                })
            } else {
                return ReE(res, "An account already exists with same email address!", 400)
            }
        }
    } else {
        return ReE(res, "Invalid CAPTCHA.  Try again.", 400)
    }

}


module.exports.login = async function (req, res, next) {
    let postdata = req.body;
    req.checkBody({
        'email': {
            notEmpty: true,
            isEmail: true,
            errorMessage: 'Email is required'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Password is required',
            isLength: {
                options: { min: 8},
                errorMessage: 'The password must be at least 8 characters long'
            }
        },
        'captcha_token': {
            notEmpty: true,
            errorMessage: 'You have to verify the CAPTCHA and click the Not a Robot box'
        },
    });

    let errors = req.validationErrors();

    if (errors) {
        return ReE(res, errors, 400);
    }

    const googleVerifyUrl = `${process.env.googleVerifyUrl}?secret=${process.env.SECRETKEY}&response=${req.body.captcha_token}`;
    const response = await axios.post(googleVerifyUrl);
    const { success } = response.data;

    if (success) {
        await Users.findOne({
            where: {
                email: postdata.email
            },
            include: [
                {
                    model: UserAddresses,
                },
            ],
        }).then(user => {
            if (!user) {
                return ReE(res, "User not found.");
            }

            if (user.status != 1 && user.verification_token) {
                return ReE(res, `Your account verification is pending.  A verification email was sent to ${user.email}`, 400, {
                    payload: {
                        email: user.email,
                        isVerified: false
                    }
                })
            } else if (user.status != 1) {
                return ReE(res, `Your account has been deactivated ${user.email}, please contact us at ${CONFIG.welcomeemail}`, 400,
                    {
                        payload: {
                            email: user.email
                        }
                    })
            }

            bcrypt
                .compare(postdata.password, user.password)
                .then(async function (result) {
                    if (result == true) {

                        let uAdd = user.dataValues.UserAddresses;
                        user.dataValues['ShippingAddress'] = uAdd.length > 0 ? uAdd.filter(it => it.dataValues.type === 0) : [];
                        user.dataValues['BillingAddress'] = uAdd.length > 0 ? uAdd.filter(it => it.dataValues.type === 1) : [];
                        delete user.dataValues.UserAddresses;
                        delete user.dataValues.password;

                        let isRememberMe = postdata.isRememberMe ? 1 : 0;
                        let token = user.getJWT(isRememberMe);
                        let expiration_time = isRememberMe ? CONFIG.jwt_expiration_remember_me : CONFIG.jwt_expiration;
                        req.session.sessionexpiretime = expiration_time;
                        user.dataValues.token = token;
                        req.session.user = user.dataValues;

                        return ReS(res, "Logged in successfully.", {
                            payload: user
                        });
                    } else {
                        return ReE(res, "Invalid Credentials!");
                    }
                })
                .catch(err => {
                    return ReE(res, err, 400);
                });
        });
    } else {
        return ReE(res, "Invalid CAPTCHA. Try again.", 400)
    }
}


module.exports.forgotPassword = async function (req, res, next) {
    let postdata = req.body;

    let user = await Users.findOne({
        where: {
            email: postdata.email
        }
    }).catch(err => {
        return ReE(res, err, 400);
    });

    if (user) {
        let token = bcrypt.hashSync(user.id + user.first_name + CONFIG.jwt_encryption_admin, 15);

        await Users.update({
            reset_token: token
        }, {
            where: {
                email: postdata.email
            }
        }).then(updated => {
            if (updated == 1) {
                let url = CONFIG.BASE_URL + '/account/reset-password';
                let mailOptions = {
                    from: CONFIG.welcomeemail,
                    to: postdata.email,
                    template: 'password-reset',
                    subject: "Reset your E-Commerce account password",
                    context: {
                        fullName: user.first_name,
                        redirectUrl: url + '?email=' + postdata.email + '&resetToken=' + token,
                        storeUrl: CONFIG.BASE_URL,
                        // filePath: CONFIG.IMAGE_URL,
                        ecommerceLogo: CONFIG.ecommerce_LOGO,
                        mailTo: CONFIG.welcomeemail
                    }
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (!error) {
                        return ReS(res, "The reset password email was sent!  Please check your email to continue.", {
                            data: {
                                email: postdata.email,
                                token: token
                            }
                        });
                    } else {
                        console.log(error);
                        return ReE(res, "Failed to send email", 400);
                    }
                });

            }
            else {
                return ReE(res, "Failed to send email", 400);
            }
        }).catch(err => {
            return ReE(res, err, 400);
        });

    } else {
        return ReE(res, 'There is no user with this email address, please try again.', 400);
    }

}

module.exports.changePassword = async function (req, res, next) {
    let postdata = req.body;

    req.checkBody({
        'password': {
            notEmpty: true,
            errorMessage: 'Password is required',
            isLength: {
                options: { min: 8},
                errorMessage: 'Password must be at least 8 characters long'
            }
        },
        'captcha_token': {
            notEmpty: true,
            errorMessage: 'The CAPTCHA is required to continue'
        },
    });

    let errors = req.validationErrors();

    if (errors) {
        return ReE(res, errors, 400);
    }

    const googleVerifyUrl = `${process.env.googleVerifyUrl}?secret=${process.env.SECRETKEY}&response=${req.body.captcha_token}`;
    const response = await axios.post(googleVerifyUrl);
    const { success } = response.data;

    if (success) {
        let password = bcrypt.hashSync(postdata.password, 10);
        await Users.update({
            password, reset_token: null
        }, {
            where: {
                email: postdata.email,
                reset_token: postdata.token
            }
        }).then(updated => {
            if (updated == 1) {
                return ReS(res, "Password updated successfully");
            } else {
                return ReE(res, "Failed to update password!", 400);
            }
        }).catch(err => {
            return ReE(res, err, 400);
        })
    } else {
        return ReE(res, "Invalid CAPTCHA. Try again.", 400)
    }
}

module.exports.userActivation = async function (req, res, next) {
    if (req.query.email) {
        let { email, verification_token } = req.query;

        Users.findOne({
            where: {
                email,
            }
        }).then(user => {
            if (user) {
                if (user.status == 1) {
                    return ReS(res, "You are already a verified user")
                }

                Users.update({ status: 1, verification_token: null }, {
                    where: {
                        email,
                        verification_token
                    }
                }).then(async updated => {
                    if (updated == 1) {
                        await Products.findAll({
                            limit: 4,
                            order: [["rented_count", "DESC"]],
                            include: [
                                {
                                    model: ProductImages,
                                    attributes: ["image_url"]
                                }
                            ]
                        }).then(async (data) => {
                            let sortedArray = [];
                            await data.map((val) => {
                                let tempObj = {
                                    image_url: val.dataValues.ProductImages[0].dataValues.image_url,
                                    title: val.dataValues.title,
                                    id: val.dataValues.id
                                };
                                sortedArray.push(tempObj);
                            })

                            let mailOptions = {
                                from: CONFIG.welcomeemail,
                                to: user.email,
                                template: 'p0-welcome-email-2',
                                subject: "Welcome to Our Circular Fashion Journey!",
                                context: {
                                    fullName: `${user.first_name} ${user.last_name}`,
                                    redirectUrl: CONFIG.BASE_URL,
                                    mailTo: CONFIG.welcomeemail,
                                    storeUrl: CONFIG.BASE_URL,
                                    // filePath: CONFIG.IMAGE_URL,
                                    ecommerceLogo: CONFIG.ecommerce_LOGO,
                                    featuredRentals: sortedArray
                                }
                            };
                            sendMail(mailOptions, (response) => {
                                return ReS(res, "Your account was set up successfully!");
                            });

                        }).catch(err => {
                            console.log("ERROR IN FETCHING FEATURED RENTALS", err);
                            return ReS(res, "Your account was set up successfully!");
                        });

                    } else {
                        return ReE(res, "Your account activation failed!  Please reach out to us via the Contact page for assistance.", 400);
                    }
                })
            } else {
                return ReE(res, "User not found");
            }
        })

    } else {
        return ReE(res, "Email is required!", 400);
    }
}

module.exports.resendVerification = async function (req, res, next) {
    let postdata = req.body;
    req.checkBody({
        'email': {
            notEmpty: true,
            isEmail: true,
            errorMessage: 'email is required'
        }
    });

    let errors = req.validationErrors();

    if (errors) {
        return ReE(res, errors, 400);
    }

    Users.findOne({
        where: {
            email: postdata.email
        }
    }).then(user => {
        if (user) {
            if (user.status == 1) {
                return ReS(res, "You are a verified user")
            } else {
                let verification_token = bcrypt.hashSync(user.email + user.first_name + CONFIG.jwt_encryption_admin, 15);

                let url = CONFIG.BASE_URL + '/account/account-verification';

                let mailOptions = {
                    from: CONFIG.welcomeemail,
                    to: user.email,
                    template: 'add-user',
                    subject: "Verify your new account on E-Commerce",
                    context: {
                        fullName: user.first_name,
                        redirectUrl: url + '?email=' + user.email + "&verification_token=" + verification_token,
                        mailTo: CONFIG.welcomeemail,
                        storeUrl: CONFIG.BASE_URL,
                        // filePath: CONFIG.IMAGE_URL,
                        ecommerceLogo: CONFIG.ecommerce_LOGO,
                    }
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (!error) {
                        Users.update({ verification_token }, {
                            where: {
                                email: user.email
                            }
                        }).then(updated => {
                            if (updated == 1) {
                                return ReS(res, "Sent verification email again.", {
                                    data: {
                                        payload: user.email,
                                        verification_token
                                    }
                                });
                            } else {
                                return ReE(res, "Try again!", 400);
                            }
                        })

                    } else {
                        return ReE(res, "Failed to send email!", 400);
                    }
                });
            };


        } else {
            return ReE(res, "User not found")
        }
    })
}

module.exports.logout = async function (req, res, next) {
    if (req.user) {
        req.logout();
        delete req.user;
        return ReS(res, "Logged out successfully.");
    } else {
        return ReE(res, "No logged in user found.", 400);
    }
}