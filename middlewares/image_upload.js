const multer = require("multer");
let path = require("path");
const fs = require("fs");
const mime = require("mime");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("base directory", __dirname + "..");
    cb(null, path.join(__dirname, ".." + "/public/media/thumbnail"));
  },
  filename: (req, file, cb) => {
    cb(null, randomStr(10) + "." + file.originalname.split(".").pop());
  },
});

let uploadFile = multer({ storage: storage });
module.exports = uploadFile;

module.exports.uploadBase64 = async function (base64image, callback) {
  let imageBuffer = base64image;

  let file = await detectMimeType(base64image);

  let fileExt = file && file.split("/").pop();
  let fileName = randomStr(10) + "." + fileExt;
  const path1 =
    path.join(__dirname, ".." + "/public/media/thumbnail/") + fileName;

  let base64Image = base64image.split(";base64,").pop();

  fs.writeFile(path1, base64Image, { encoding: "base64" }, function (err) {
    if (!err) {
      callback(fileName);
    } else {
      callback(null);
    }
  });
};

module.exports.uploadBase64B = async function (base64image, callback) {
  let matches = base64image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error("Invalid input string");
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], "base64");
  let decodedImg = response;
  let imageBuffer = decodedImg.data;
  let type = decodedImg.type;
  let extension = mime.getExtension(type);
  let fileName = randomStr(10) + "." + extension;
  const path1 =
    path.join(__dirname, ".." + "/public/media/thumbnail/") + fileName;
  try {
    fs.writeFileSync(path1, imageBuffer, "utf8");
    callback(fileName);
  } catch (e) {
    callback(null);
  }
};
