const nodemailer = require('nodemailer');
let sgTransport = require('nodemailer-sendgrid-transport');
const hbs = require('nodemailer-express-handlebars');

let smtpoptions = {
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
        user: CONFIG.GMAIL_USERNAME,
        pass: CONFIG.GMAIL_PASSWORD
    }
}

let devsmtpoptions = {
    service: "gmail",
    auth: {
        user: CONFIG.GMAIL_USERNAME,
        pass: CONFIG.GMAIL_PASSWORD
    }
}

let transporter = process.env.NODE_ENV == "production" ? nodemailer.createTransport(smtpoptions) : nodemailer.createTransport(devsmtpoptions);

let options = {
    viewEngine: {
        extname: '.hbs',
        layoutsDir: 'views/layouts/',
        defaultLayout: 'layout-email',
        partialsDir: 'views/email/'
    },
    viewPath: 'views/email/',
    extName: '.hbs'
};

transporter.use('compile', hbs(options));

module.exports.transporter = transporter;