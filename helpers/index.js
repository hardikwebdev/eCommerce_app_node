ReE = function (res, err, code, data) {
  // Error Web Response
  if (typeof err == "object" && typeof err.message != "undefined") {
    err = err.message;
  }

  if (typeof code !== "undefined") {
    res.statusCode = code;
  } else {
    res.statusCode = 500;
  }
  let send_data = { success: false, message: err, code: code || 500 };
  if (typeof data == "object") {
    send_data = Object.assign(data, send_data); //merge the objects
  }
  return res.json(send_data);
};

ReS = function (res, msg, data, code) {
  // Success Web Response
  let send_data = { success: true, message: msg, code: code || 200 };
  if (typeof data == "object") {
    send_data = Object.assign(data, send_data); //merge the objects
  }
  if (typeof code !== "undefined") {
    res.statusCode = code;
  } else {
    res.statusCode = 200;
  }
  return res.json(send_data);
};

randomStr = function (m, remove_unessery = false) {
  let m = m || 9;
  s = "";
  let r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

  if (remove_unessery)
    r = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

  for (let i = 0; i < m; i++) {
    s += r.charAt(Math.floor(Math.random() * r.length));
  }
  return s;
};

isJSON = async function (text) {
  if (typeof text !== "string") {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
};

let signatures = {
  JVBERi0: "application/pdf",
  R0lGODdh: "image/gif",
  R0lGODlh: "image/gif",
  iVBORw0KGgo: "image/png",
  "/9j/": "image/jpg" || "image/jpeg",
};

detectMimeType = async function (b64) {
  // base64 encoded data doesn't contain commas
  let base64ContentArray = b64.split(",");

  // base64 content cannot contain whitespaces but nevertheless skip if there are!
  let mimeType = base64ContentArray[0].match(
    /[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/
  )[0];

  // base64 encoded data - pure
  let base64Data = base64ContentArray[1];

  console.log(mimeType);
  return mimeType;
};

randomNum = function (m) {
  let m = m || 4;
  s = "";
  let r = "1234567890";

  for (let i = 0; i < m; i++) {
    s += r.charAt(Math.floor(Math.random() * r.length));
  }
  return s;
};

generateRandomKey = function (length) {
  let start = 2;
  let stop = parseInt(length) + start;
  return Math.random().toString(36).substring(start, stop);
};

checkisArray = function (a) {
  return !!a && a.constructor === Array;
};

checkisObject = function (a) {
  return !!a && a.constructor === Object;
};

deleteFileSync = function (filepath) {
  const fs = require("fs");
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return true;
  } else {
    return false;
  }
};

const randomNumber = require("random-number-csprng");
generate = (size) => {
  return new Promise((resolve, reject) => {
    let code = [];
    let splitter = 2;
    let divider = Math.floor(size / splitter);
    while (divider > 9) {
      splitter++;
      divider = Math.floor(size / splitter);
    }

    let min_num = Math.pow(10, divider - 1);
    let max_num = Math.pow(10, divider) - 1;

    // console.log({ divider, splitter, min_num, max_num });

    let i = 0;
    while (i < splitter) {
      code[i] = randomNumber(min_num, max_num);
      i++;
    }

    let reminder = size % divider;
    if (reminder) {
      let reminder_min = Math.pow(10, reminder - 1);
      let reminder_max = Math.pow(10, reminder) - 1;
      code[i] = randomNumber(reminder_min, reminder_max);
      // console.log({ reminder, reminder_min, reminder_max });
    }

    return Promise.all(code)
      .then((data) => {
        resolve(41 + data.join(""));
      })
      .catch((err) => reject(err));
  });
};

dayFromString = function (day) {
  if (day == "Monday") {
    return "1";
  } else if (day == "Tuesday") {
    return "2";
  } else if (day == "Wednesday") {
    return "3";
  } else if (day == "Thursday") {
    return "4";
  } else if (day == "Friday") {
    return "5";
  } else if (day == "Saturday") {
    return "6";
  } else if (day == "Sunday") {
    return "7";
  }

  return;
};

hoursToMinutes = function (hoursValue) {
  if (hoursValue.includes(".")) {
    let hoursAndMinutes = hoursValue;
    hoursAndMinutes = parseFloat(hoursAndMinutes).toFixed(
      hoursAndMinutes.split(".")[1].length
    );
    hoursAndMinutes = hoursValue.split(".");
    let minutes = hoursAndMinutes.pop();
    let hours = hoursAndMinutes.pop();

    let totalMinutes = parseInt(hours * 60) + parseInt(minutes);

    return totalMinutes;
  } else {
    let totalMinutes = parseInt(hoursValue * 60) + parseInt(minutes);
    return totalMinutes;
  }
};

convertMinsToHrsMins = function (minutes) {
  let h = Math.floor(minutes / 60);
  let m = minutes % 60;
  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  return h + "." + m;
};

getFilesizeInBytes = function (filename) {
  let fs = require("fs");
  if (fs.existsSync(filename)) {
    let stats = fs.statSync(filename);
    let fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
  }
  return null;
};

updateOrCreate = async function (model, where, newItem) {
  // First try to find the record
  const foundItem = await model.findOne({ where: where });
  if (!foundItem) {
    // Item not found, create a new one
    const item = await model.create(newItem);
    return item;
  }
  // Found an item, update it
  await model.update(newItem, { where: where });
  const updatedItem = await model.findOne({ where: where });
  return updatedItem;
};

module.exports.checkJSON = async function (text) {
  if (typeof text !== "string") {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
};

const weekday = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  thurs: "thursday",
  fri: "friday",
  sat: "saturday",
};

getWeekday = async function (text) {
  let day = null;
  let valText = text.toLowerCase().trim();

  for (let key in weekday) {
    let valuei = weekday[key];
    if (valText == key) {
      day = valuei;
      break;
    } else if (valText == valuei) {
      day = valuei;
      break;
    }
  }
  return day;
};

module.exports.paginate = async function (array, page_size, page_number) {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice((page_number - 1) * page_size, page_number * page_size);
};

diff_hours = function (dt2, dt1) {
  let diff = Math.abs(dt2.getTime() - dt1.getTime()) / 36e5;
  return Math.abs(Math.round(diff));
};

diff_minutes = function (dt2, dt1) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
};

splitURL = async function (valuei) {
  let URLsplit = valuei.split("/");

  let host = URLsplit[0] + "//" + URLsplit[2] + "/";

  let newURL = valuei.replace(host, "");
  return newURL;
};

const momenttz = require("moment-timezone");
convertTimezone = (date) => {
  let convertedDate = momenttz
    .tz(new Date(date), "America/Los_Angeles")
    .format("MM/DD/YYYY");
  return convertedDate;
};
