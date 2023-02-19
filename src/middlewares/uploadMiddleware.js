const multer = require("multer");
const path = require("path");
const fs = require("fs");

function ramdomName(_n, _ext, dest) {
  const posibleChars = "abcdefghijklmnopqrstuvwxyz123456789";
  let filename = "";

  for (let i = 0; i < _n; i++) {
    const random = Math.floor(Math.random() * (posibleChars.length - 1) - 0);
    filename += posibleChars[random];
  }
  if (
    fs.existsSync(__dirname + `/../../public/img/${dest}/${filename + _ext}`)
  ) {
    ramdomName(_n, _ext);
    return false;
  }

  return filename + _ext;
}
// const base64Middleware = (req, res, next) => {
//   if (req.body.file) {
//     const bufferStream = new Base64Decode();
//     bufferStream.end(req.body.file);
//     req.file = {
//       buffer: bufferStream.read(),
//       originalname: "image.jpeg",
//       mimetype: "image/jpeg",
//       encoding: "7bit"
//     }
//   }
//   next();
// };
const upload = (dest) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, `/../../public/img/${dest}`));
    },
    filename: (req, file, cb) => {
      cb(null, ramdomName(40, path.extname(file.originalname), dest));
    },
  });
  return multer({ storage });
};

module.exports ={
  upload,
  // base64Middleware
};
