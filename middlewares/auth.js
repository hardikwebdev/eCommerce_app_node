const passport = require("passport");

module.exports.AuthMiddleware = function (req, res, next) {
  require("./passport").UserAuth(passport);

  passport.authenticate("jwt", async function (err, user, info) {
    if (!user) {
      if (info) {
        return ReE(res, "Your authentication token expired!", 401);
      }

      return ReE(res, "Unauthorized user", 500);
    }
    let userreturn = user.toWeb();
    if (user.status == 1) {
      req.user = { ...userreturn, ...req.session.user };
      return next();
    } else {
      return ReE(
        res,
        "Your account is deactivated! Kindly verify your account or contact the administrator.",
        500
      );
    }
  })(req, res, next);
};
