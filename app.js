require("./config/config");
require("./helpers");

let createError = require('http-errors');
let express = require('express');
let path = require('path');
const fs = require('fs');
let cookieParser = require('cookie-parser');
let validator = require("express-validator");
let passport = require("passport");
let bodyParser = require("body-parser");
let helmet = require("helmet");
let cors = require("cors");
let useragent = require('express-useragent');
let flash = require('connect-flash');
// let cron = require('node-cron');

const paginate = require('express-paginate');
let moment = require('moment');
let hbs = require('express-hbs');
let helpers = require('handlebars-helpers')({
	handlebars: hbs.handlebars
});
let indexRouter = require('./routes/index');

let app = express();

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS, PUT, PATCH, DELETE"
	);
	next();
});

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(helmet());
app.use(helmet.frameguard());
app.use(helmet.noCache());
app.use(cors());
app.use(useragent.express());
app.use(express.json({limit: "10mb", extended: true}))

app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit: 50000}))
app.use(validator());
app.use(passport.initialize());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(paginate.middleware(20, 100));
app.use(flash());

let session = require('express-session');
let FileStore = require('session-file-store')(session);
let development = process.env.NODE_ENV === 'development' ? path.join(__dirname, "../") + 'sessions' : './sessions';

app.use(session({
	store: new FileStore({
		path: development
	}),
	// cookie: { maxAge: process.env.JWT_EXPIRATION },
	secret: process.env.APP_PASSWORD,
	resave: false,
	saveUninitialized: true,
}));

app.use(function (req, res, next) {
	res.locals.url = req.url;
	res.locals.surl = path.basename(req.url);
	res.locals.currentpage = req.query.page || null;
	res.locals.session = req.session;
	res.locals.user = req.session.user || null;
	next();
});

app.use('/api/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = err;

	// render the error page
	res.status(err.status || 500);
	res.render('error', {
		title: 'E-Commerce App - Error',
		layout: ''
	});
});

module.exports = app;