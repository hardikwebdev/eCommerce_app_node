require("./config/config");
require("./helpers");

var express = require('express');
var app_cron = express();
const db = require("./models");

var cronRouter = require('./crons/crons');

var cronArgs = process.argv.slice(2);
switch (cronArgs[0]) {

	case 'remove_blackout_dates':
		// 5 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www remove_blackout_dates >/dev/null 2>&1
		cronRouter.remove_blackout_dates();
		break;

	case 'create_shipment':
		// */30 * * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www create_shipment >/dev/null 2>&1
		cronRouter.create_shipment();
		break;

	case 'order_reminder_24hours_before_toseller':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www order_reminder_24hours_before_toseller >/dev/null 2>&1

		cronRouter.order_reminder_24hours_before_toseller();
		break;

	case 'day_after_rental_date_start_seller':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www day_after_rental_date_start_seller >/dev/null 2>&1

		cronRouter.day_after_rental_date_start_seller();
		break;

	case 'on_rental_end_date_buyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www on_rental_end_date_buyer >/dev/null 2>&1

		cronRouter.on_rental_end_date_buyer();
		break;

	case 'after_1day_rental_end_date_buyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www after_1day_rental_end_date_buyer >/dev/null 2>&1

		cronRouter.after_1day_rental_end_date_buyer();
		break;

	case 'local_pickup_reminder_24hours_before_start_date_tobuyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www local_pickup_reminder_24hours_before_start_date_tobuyer >/dev/null 2>&1

		cronRouter.local_pickup_reminder_24hours_before_start_date_tobuyer();
		break;

	case 'local_pickup_before_48hours_rental_end_date_buyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www local_pickup_before_48hours_rental_end_date_buyer >/dev/null 2>&1

		cronRouter.local_pickup_before_48hours_rental_end_date_buyer();
		break;

	case 'local_pickup_1day_after_rental_end_date_buyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www local_pickup_1day_after_rental_end_date_buyer >/dev/null 2>&1

		cronRouter.local_pickup_1day_after_rental_end_date_buyer();
		break;

	case 'local_pickup_on_end_date_seller':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www local_pickup_on_end_date_seller >/dev/null 2>&1

		cronRouter.local_pickup_on_end_date_seller();
		break;

	case 'local_pickup_3days_after_end_date_buyer':
		// 0 0 * * * cd /var/www/e-commerce-node && /usr/bin/node ./cron_bin/www local_pickup_3days_after_end_date_buyer >/dev/null 2>&1

		cronRouter.local_pickup_3days_after_end_date_buyer();
		break;

	default:
		console.log('Sorry, No cron to run');
		process.exit();
}

module.exports = app_cron;